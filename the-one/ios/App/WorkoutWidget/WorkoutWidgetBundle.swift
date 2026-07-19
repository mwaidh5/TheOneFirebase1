import WidgetKit
import SwiftUI

@main
struct WorkoutWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        if #available(iOS 18.0, *) {
            // Adds the Apple Watch Smart Stack presentation on top of the
            // Lock Screen / Dynamic Island one.
            WorkoutWidgetLiveActivityWithWatch()
        } else {
            WorkoutWidgetLiveActivity()
        }
    }
}
