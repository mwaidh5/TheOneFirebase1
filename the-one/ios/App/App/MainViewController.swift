import UIKit
import Capacitor

// Custom plugins compiled directly into the app target (not npm packages) are
// NOT auto-discovered by Capacitor — they must be registered on the bridge.
// Main.storyboard instantiates this subclass instead of CAPBridgeViewController.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WorkoutActivityPlugin())
        bridge?.registerPluginInstance(SoundPlugin())
    }
}
