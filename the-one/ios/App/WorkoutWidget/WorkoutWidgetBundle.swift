import WidgetKit
import SwiftUI

@main
struct WorkoutWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        if #available(iOS 16.1, *) {
            WorkoutWidgetLiveActivity()
        }
    }
}
