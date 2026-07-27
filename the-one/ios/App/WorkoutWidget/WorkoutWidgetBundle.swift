import WidgetKit
import SwiftUI

@main
struct WorkoutWidgetBundle: WidgetBundle {
    // WidgetBundleBuilder does NOT support if/else — only standalone
    // availability checks. Use two mutually exclusive ifs so exactly one
    // ActivityConfiguration is registered per OS version.
    @WidgetBundleBuilder
    var body: some Widget {
        if #available(iOS 18.0, *) {
            // Lock Screen / Dynamic Island + Apple Watch Smart Stack.
            WorkoutWidgetLiveActivityWithWatch()
        }
        if #unavailable(iOS 18.0) {
            // Pre-18 phones: Lock Screen / Dynamic Island only.
            WorkoutWidgetLiveActivity()
        }
    }
}
