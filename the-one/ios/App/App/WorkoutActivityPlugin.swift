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
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
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

        // Seed the current exercise straight away: the JS side may ask for an
        // update before Activity.request() resolves, and such an update would
        // find no activity to apply itself to.
        let attributes = WorkoutActivityAttributes(courseTitle: courseTitle)
        let state = WorkoutActivityAttributes.ContentState(
            startedAt: startedAt,
            title: title,
            exercise: call.getString("exercise"),
            detail: call.getString("detail")
        )
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

    // Push the currently active exercise (name + sets × reps) into the running
    // activity so the Lock Screen / Watch card shows what the athlete is doing.
    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.reject("Requires iOS 16.2+"); return }
        let exercise = call.getString("exercise")
        let detail = call.getString("detail")
        let title = call.getString("title")
        Task {
            for activity in Activity<WorkoutActivityAttributes>.activities {
                var state = activity.content.state
                if let title = title { state.title = title }
                state.exercise = exercise
                state.detail = detail
                await activity.update(ActivityContent(state: state, staleDate: nil))
            }
            call.resolve()
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
