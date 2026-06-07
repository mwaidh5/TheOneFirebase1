import Foundation
import Capacitor
import ActivityKit

// Bridges JS <-> ActivityKit so the web app can start/stop the Lock-Screen
// training timer. Registered with Capacitor via CAPBridgedPlugin (Capacitor 6+).
@objc(WorkoutActivityPlugin)
public class WorkoutActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WorkoutActivityPlugin"
    public let jsName = "WorkoutActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            call.resolve(["supported": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["supported": false])
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.reject("Requires iOS 16.2+"); return }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities are disabled in Settings"); return
        }
        let title = call.getString("title") ?? "Workout"
        let courseTitle = call.getString("courseTitle") ?? ""
        let startMs = call.getDouble("startTs") ?? (Date().timeIntervalSince1970 * 1000)
        let startedAt = Date(timeIntervalSince1970: startMs / 1000.0)

        // End any stale activity before starting a fresh one.
        endAllActivities()

        let attributes = WorkoutActivityAttributes(courseTitle: courseTitle)
        let state = WorkoutActivityAttributes.ContentState(startedAt: startedAt, title: title)
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: ActivityContent(state: state, staleDate: nil)
            )
            call.resolve(["id": activity.id])
        } catch {
            call.reject("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        endAllActivities()
        call.resolve()
    }

    private func endAllActivities() {
        guard #available(iOS 16.2, *) else { return }
        Task {
            for activity in Activity<WorkoutActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
    }
}
