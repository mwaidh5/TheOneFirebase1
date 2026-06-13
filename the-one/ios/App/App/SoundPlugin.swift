import Foundation
import Capacitor
import AVFoundation

// Plays the timer beeps NATIVELY through AVAudioEngine. WebAudio inside the
// WKWebView ignores the app's audio-session category, so HTML beeps stay muted
// when the ring/silent switch is on. Routing through AVAudioEngine uses the
// app's `.playback` session (set in AppDelegate), which plays regardless of the
// mute switch — exactly what a gym timer needs.
@objc(SoundPlugin)
public class SoundPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SoundPlugin"
    public let jsName = "Sound"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "beep", returnType: CAPPluginReturnPromise),
    ]

    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let fmt = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!
    private var prepared = false
    private let lock = NSLock()

    private func prepareIfNeeded() {
        lock.lock(); defer { lock.unlock() }
        if prepared { return }
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: fmt)
        prepared = true
    }

    private func ensureRunning() {
        let session = AVAudioSession.sharedInstance()
        // Re-assert playback so beeps sound even with the mute switch on.
        try? session.setCategory(.playback, options: [.mixWithOthers])
        try? session.setActive(true)
        if !engine.isRunning {
            engine.prepare()
            try? engine.start()
        }
    }

    // (frequencyHz, durationSeconds, volume) — frequency 0 == silence (a gap).
    private func segments(for kind: String) -> [(Double, Double, Float)] {
        switch kind {
        case "switch":
            return [(990, 0.14, 0.9), (0, 0.02, 0), (1245, 0.14, 0.85)]
        case "done":
            return [(880, 0.18, 0.95), (0, 0.04, 0), (1175, 0.18, 0.95), (0, 0.04, 0), (1568, 0.34, 0.95)]
        default: // countdown
            return [(880, 0.14, 0.95)]
        }
    }

    private func makeBuffer(for kind: String) -> AVAudioPCMBuffer? {
        let segs = segments(for: kind)
        let sr = fmt.sampleRate
        let total = segs.reduce(0) { $0 + Int($1.1 * sr) }
        guard total > 0,
              let buf = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(total)) else { return nil }
        buf.frameLength = AVAudioFrameCount(total)
        let ch = buf.floatChannelData![0]
        let fade = Int(0.005 * sr) // 5ms fade in/out kills clicks
        var idx = 0
        for (freq, dur, vol) in segs {
            let n = Int(dur * sr)
            for i in 0..<n {
                var sample: Float = 0
                if freq > 0 {
                    let phase = 2.0 * Double.pi * freq * Double(i) / sr
                    // Square wave = far louder/punchier than a sine at equal gain.
                    sample = (sin(phase) >= 0 ? 1.0 : -1.0) * vol
                    if i < fade { sample *= Float(i) / Float(fade) }
                    if i > n - fade { sample *= Float(n - i) / Float(fade) }
                }
                ch[idx] = sample
                idx += 1
            }
        }
        return buf
    }

    @objc func beep(_ call: CAPPluginCall) {
        let kind = call.getString("kind") ?? "countdown"
        prepareIfNeeded()
        ensureRunning()
        guard let buf = makeBuffer(for: kind) else { call.resolve(); return }
        player.scheduleBuffer(buf, at: nil, options: [], completionHandler: nil)
        if !player.isPlaying { player.play() }
        call.resolve()
    }
}
