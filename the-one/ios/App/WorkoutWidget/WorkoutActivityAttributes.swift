import ActivityKit
import Foundation

// Shared between the app (to start/stop the Live Activity) and the WorkoutWidget
// extension (to render it). Added to BOTH targets by ci/add_widget_target.rb.
@available(iOS 16.1, *)
struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // The system renders a self-counting timer from this date — no app needed.
        var startedAt: Date
        // What the athlete is doing, e.g. "Upper Body — Day 1".
        var title: String
    }

    // Static info for the whole session.
    var courseTitle: String
}
