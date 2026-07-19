import ActivityKit
import WidgetKit
import SwiftUI

// ── Shared Lock Screen / banner card ─────────────────────────────────────────
@available(iOS 16.2, *)
struct WorkoutLockScreenView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>
    var body: some View {
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
                if let ex = context.state.exercise, !ex.isEmpty {
                    // Current exercise + its sets × reps, updated live from the app.
                    HStack(spacing: 4) {
                        Text(ex)
                            .font(.caption).fontWeight(.semibold)
                            .foregroundColor(.blue)
                            .lineLimit(1)
                        if let d = context.state.detail, !d.isEmpty {
                            Text("· \(d)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }
                    }
                } else {
                    Text(context.attributes.courseTitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
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
    }
}

// ── Compact card for the Apple Watch Smart Stack ─────────────────────────────
@available(iOS 18.0, *)
struct WorkoutWatchView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "figure.run")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.blue)
            VStack(alignment: .leading, spacing: 1) {
                Text(context.state.exercise ?? context.state.title)
                    .font(.caption2).fontWeight(.bold)
                    .lineLimit(1)
                if let d = context.state.detail, !d.isEmpty {
                    Text(d)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            Spacer()
            Text(context.state.startedAt, style: .timer)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .monospacedDigit()
                .frame(maxWidth: 52)
        }
        .padding(.horizontal, 4)
    }
}

// Picks the watch layout when rendered in the Smart Stack, phone layout otherwise.
@available(iOS 18.0, *)
struct WorkoutFamilyAwareView: View {
    @Environment(\.activityFamily) private var family
    let context: ActivityViewContext<WorkoutActivityAttributes>
    var body: some View {
        switch family {
        case .small: WorkoutWatchView(context: context)
        default: WorkoutLockScreenView(context: context)
        }
    }
}

// ── Dynamic Island (shared by both widget variants) ──────────────────────────
@available(iOS 16.2, *)
func workoutDynamicIsland(context: ActivityViewContext<WorkoutActivityAttributes>) -> DynamicIsland {
    DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
            Image(systemName: "figure.run").foregroundColor(.blue)
        }
        DynamicIslandExpandedRegion(.center) {
            VStack(spacing: 1) {
                Text(context.state.exercise ?? context.state.title)
                    .font(.caption).fontWeight(.semibold)
                    .lineLimit(1)
                if let d = context.state.detail, !d.isEmpty {
                    Text(d)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
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

// ── Widget variants ──────────────────────────────────────────────────────────
// Pre-iOS-18 phones: Lock Screen + Dynamic Island only.
@available(iOS 16.2, *)
struct WorkoutWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            WorkoutLockScreenView(context: context)
        } dynamicIsland: { context in
            workoutDynamicIsland(context: context)
        }
    }
}

// iOS 18+: same activity, plus the Apple Watch Smart Stack presentation
// (requires watchOS 11 on the paired watch).
@available(iOS 18.0, *)
struct WorkoutWidgetLiveActivityWithWatch: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            WorkoutFamilyAwareView(context: context)
        } dynamicIsland: { context in
            workoutDynamicIsland(context: context)
        }
        .supplementalActivityFamilies([.small])
    }
}
