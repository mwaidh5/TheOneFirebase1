import ActivityKit
import WidgetKit
import SwiftUI

// The Lock Screen / Dynamic Island UI for the live training timer.
@available(iOS 16.1, *)
struct WorkoutWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // ── Lock Screen / banner ──────────────────────────────────────────
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(Color.blue.opacity(0.2)).frame(width: 44, height: 44)
                    Image(systemName: "figure.run")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.blue)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.title)
                        .font(.headline)
                        .lineLimit(1)
                    Text(context.attributes.courseTitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                Spacer()
                Text(context.state.startedAt, style: .timer)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .multilineTextAlignment(.trailing)
                    .frame(minWidth: 70)
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.85))
            .activitySystemActionForegroundColor(Color.white)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "figure.run").foregroundColor(.blue)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.title).font(.caption).lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.startedAt, style: .timer)
                        .monospacedDigit()
                        .frame(width: 64)
                        .font(.system(.body, design: .rounded))
                }
            } compactLeading: {
                Image(systemName: "figure.run").foregroundColor(.blue)
            } compactTrailing: {
                Text(context.state.startedAt, style: .timer)
                    .monospacedDigit()
                    .frame(width: 44)
            } minimal: {
                Image(systemName: "figure.run").foregroundColor(.blue)
            }
        }
    }
}
