import WidgetKit
import SwiftUI

@main
struct WorkoutWidgetBundle: WidgetBundle {
    // Exactly one widget, registered behind a single availability check.
    // WidgetBundleBuilder has no buildEither (if/else fails to compile) and
    // `if #unavailable` crashes the Swift compiler here — so keep this shape.
    @WidgetBundleBuilder
    var body: some Widget {
        if #available(iOS 16.1, *) {
            WorkoutWidgetLiveActivity()
        }
    }
}
