#!/usr/bin/env ruby
# Adds the WorkoutWidget (Live Activity) extension target to the Capacitor
# iOS project at build time. Runs on Codemagic after `cap sync ios`.
# Uses the `xcodeproj` gem so we never hand-edit project.pbxproj from Windows.

require 'xcodeproj'

REPO_ROOT  = File.expand_path(File.join(__dir__, '..'))
APP_DIR    = File.join(REPO_ROOT, 'the-one', 'ios', 'App')           # SOURCE_ROOT
PROJECT    = File.join(APP_DIR, 'App.xcodeproj')
WIDGET     = 'WorkoutWidget'
APP_BUNDLE = 'com.theone.training'
WIDGET_BUNDLE = "#{APP_BUNDLE}.#{WIDGET}"
DEPLOYMENT = '16.2'

project = Xcodeproj::Project.open(PROJECT)

app_target = project.targets.find { |t| t.name == 'App' }
abort('ERROR: App target not found') unless app_target

if project.targets.any? { |t| t.name == WIDGET }
  puts "#{WIDGET} target already present — nothing to do."
  exit 0
end

puts "Creating #{WIDGET} app-extension target..."
widget = project.new_target(:app_extension, WIDGET, :ios, DEPLOYMENT, project.products_group, :swift)

# ── Groups & file references ────────────────────────────────────────────────
widget_group = project.main_group.find_subpath(WIDGET, true)
widget_group.set_source_tree('SOURCE_ROOT')

def ref(group, abs_path)
  group.new_file(abs_path)
end

bundle_ref = ref(widget_group, File.join(APP_DIR, WIDGET, 'WorkoutWidgetBundle.swift'))
live_ref   = ref(widget_group, File.join(APP_DIR, WIDGET, 'WorkoutWidgetLiveActivity.swift'))
attrs_ref  = ref(widget_group, File.join(APP_DIR, WIDGET, 'WorkoutActivityAttributes.swift'))
ref(widget_group, File.join(APP_DIR, WIDGET, 'WorkoutWidget-Info.plist'))

# Widget compiles its 3 Swift files; the attributes file is also compiled into App.
widget.add_file_references([bundle_ref, live_ref, attrs_ref])

# ── Shared attributes + the Capacitor plugin go into the App target ──────────
app_group = project.main_group.find_subpath('App', true)
plugin_ref = ref(app_group, File.join(APP_DIR, 'App', 'WorkoutActivityPlugin.swift'))
app_target.add_file_references([attrs_ref, plugin_ref])

# ── Widget build settings ───────────────────────────────────────────────────
widget.build_configurations.each do |config|
  bs = config.build_settings
  bs['PRODUCT_BUNDLE_IDENTIFIER']   = WIDGET_BUNDLE
  bs['PRODUCT_NAME']                = '$(TARGET_NAME)'
  bs['INFOPLIST_FILE']              = "#{WIDGET}/WorkoutWidget-Info.plist"
  bs['IPHONEOS_DEPLOYMENT_TARGET']  = DEPLOYMENT
  bs['SWIFT_VERSION']               = '5.0'
  bs['TARGETED_DEVICE_FAMILY']      = '1,2'
  bs['GENERATE_INFOPLIST_FILE']     = 'NO'
  bs['SKIP_INSTALL']                = 'NO'
  bs['CODE_SIGN_STYLE']             = 'Manual'
  bs['MARKETING_VERSION']           = '1.0'
  bs['CURRENT_PROJECT_VERSION']     = '1'
  bs['SWIFT_EMIT_LOC_STRINGS']      = 'YES'
  bs['LD_RUNPATH_SEARCH_PATHS']     = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
end

# ── Embed the extension into the App + add a build dependency ────────────────
app_target.add_dependency(widget)
embed = app_target.copy_files_build_phases.find { |p| p.symbol_dst_subfolder_spec == :plug_ins }
embed ||= app_target.new_copy_files_build_phase('Embed App Extensions')
embed.symbol_dst_subfolder_spec = :plug_ins
bf = embed.add_file_reference(widget.product_reference, true)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts "Done. Added #{WIDGET} (#{WIDGET_BUNDLE}) and embedded it into App."
