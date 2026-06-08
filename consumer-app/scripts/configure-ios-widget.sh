#!/usr/bin/env bash
# adopt-4.7 — wire App Group entitlements, Capacitor plugin, and WidgetKit extension into Xcode project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PBX="$ROOT/ios/App/App.xcodeproj/project.pbxproj"

if [ ! -f "$PBX" ]; then
  echo "⚠ iOS project not found — run: npm run cap:add:ios"
  exit 0
fi

chmod +x "$0" 2>/dev/null || true

python3 - "$PBX" <<'PY'
import sys
from pathlib import Path

pbx_path = Path(sys.argv[1])
text = pbx_path.read_text()
if "HomeScreenWidgetPlugin.swift" in text:
    print("✓ Xcode project already includes home-screen widget wiring")
    sys.exit(0)

ids = {
    "plugin_ref": "A7WIDGET0000000000000001",
    "plugin_build": "A7WIDGET0000000000000002",
    "widget_swift_ref": "A7WIDGET0000000000000003",
    "widget_swift_build": "A7WIDGET0000000000000004",
    "widget_plist_ref": "A7WIDGET0000000000000005",
    "widget_ent_ref": "A7WIDGET0000000000000006",
    "widget_product_ref": "A7WIDGET0000000000000007",
    "widget_group_ref": "A7WIDGET0000000000000008",
    "widget_target_ref": "A7WIDGET0000000000000009",
    "widget_sources_ref": "A7WIDGET000000000000000A",
    "widget_resources_ref": "A7WIDGET000000000000000B",
    "widget_frameworks_ref": "A7WIDGET000000000000000C",
    "embed_phase_ref": "A7WIDGET000000000000000D",
    "embed_build_ref": "A7WIDGET000000000000000E",
    "proxy_ref": "A7WIDGET000000000000000F",
    "dep_ref": "A7WIDGET0000000000000010",
    "widget_debug_ref": "A7WIDGET0000000000000011",
    "widget_release_ref": "A7WIDGET0000000000000012",
    "widget_config_list_ref": "A7WIDGET0000000000000013",
}

text = text.replace(
    "/* End PBXBuildFile section */",
    f"\t\t{ids['plugin_build']} /* HomeScreenWidgetPlugin.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {ids['plugin_ref']} /* HomeScreenWidgetPlugin.swift */; }};\n"
    f"\t\t{ids['widget_swift_build']} /* OptiScheduleWidget.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {ids['widget_swift_ref']} /* OptiScheduleWidget.swift */; }};\n"
    f"\t\t{ids['embed_build_ref']} /* OptiScheduleWidget.appex in Embed App Extensions */ = {{isa = PBXBuildFile; fileRef = {ids['widget_product_ref']} /* OptiScheduleWidget.appex */; settings = {{ATTRIBUTES = (RemoveHeadersOnCopy, ); }}; }};\n"
    "/* End PBXBuildFile section */",
)

text = text.replace(
    "/* End PBXFileReference section */",
    f"\t\t{ids['plugin_ref']} /* HomeScreenWidgetPlugin.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = HomeScreenWidgetPlugin.swift; sourceTree = \"<group>\"; }};\n"
    f"\t\t{ids['widget_swift_ref']} /* OptiScheduleWidget.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = OptiScheduleWidget.swift; sourceTree = \"<group>\"; }};\n"
    f"\t\t{ids['widget_plist_ref']} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; }};\n"
    f"\t\t{ids['widget_ent_ref']} /* OptiScheduleWidget.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = OptiScheduleWidget.entitlements; sourceTree = \"<group>\"; }};\n"
    f"\t\t{ids['widget_product_ref']} /* OptiScheduleWidget.appex */ = {{isa = PBXFileReference; explicitFileType = \"wrapper.app-extension\"; includeInIndex = 0; path = OptiScheduleWidget.appex; sourceTree = BUILT_PRODUCTS_DIR; }};\n"
    "/* End PBXFileReference section */",
)

text = text.replace(
    "504EC2FB1FED79650016851F = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t504EC3061FED79650016851F /* App */,\n\t\t\t\t504EC3051FED79650016851F /* Products */,",
    "504EC2FB1FED79650016851F = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t504EC3061FED79650016851F /* App */,\n\t\t\t\t"
    + ids["widget_group_ref"]
    + " /* OptiScheduleWidget */,\n\t\t\t\t504EC3051FED79650016851F /* Products */,",
)

text = text.replace(
    "504EC3051FED79650016851F /* Products */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t504EC3041FED79650016851F /* App.app */,\n\t\t\t);",
    "504EC3051FED79650016851F /* Products */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t504EC3041FED79650016851F /* App.app */,\n\t\t\t\t"
    + ids["widget_product_ref"]
    + " /* OptiScheduleWidget.appex */,\n\t\t\t);",
)

text = text.replace(
    "504EC3071FED79650016851F /* AppDelegate.swift */,",
    "504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\t"
    + ids["plugin_ref"]
    + " /* HomeScreenWidgetPlugin.swift */,",
)

text = text.replace(
    "504EC3081FED79650016851F /* AppDelegate.swift in Sources */,",
    "504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\t"
    + ids["plugin_build"]
    + " /* HomeScreenWidgetPlugin.swift in Sources */,",
)

text = text.replace(
    "buildPhases = (\n\t\t\t\t6634F4EFEBD30273BCE97C65 /* [CP] Check Pods Manifest.lock */,\n\t\t\t\t504EC3001FED79650016851F /* Sources */,\n\t\t\t\t504EC3011FED79650016851F /* Frameworks */,\n\t\t\t\t504EC3021FED79650016851F /* Resources */,\n\t\t\t\t9592DBEFFC6D2A0C8D5DEB22 /* [CP] Embed Pods Frameworks */,\n\t\t\t);",
    "buildPhases = (\n\t\t\t\t6634F4EFEBD30273BCE97C65 /* [CP] Check Pods Manifest.lock */,\n\t\t\t\t504EC3001FED79650016851F /* Sources */,\n\t\t\t\t504EC3011FED79650016851F /* Frameworks */,\n\t\t\t\t504EC3021FED79650016851F /* Resources */,\n\t\t\t\t9592DBEFFC6D2A0C8D5DEB22 /* [CP] Embed Pods Frameworks */,\n\t\t\t\t"
    + ids["embed_phase_ref"]
    + " /* Embed App Extensions */,\n\t\t\t);",
)

text = text.replace(
    "dependencies = (\n\t\t\t);",
    "dependencies = (\n\t\t\t\t" + ids["dep_ref"] + " /* PBXTargetDependency */,\n\t\t\t);",
    1,
)

text = text.replace(
    "targets = (\n\t\t\t\t504EC3031FED79650016851F /* App */,\n\t\t\t);",
    "targets = (\n\t\t\t\t504EC3031FED79650016851F /* App */,\n\t\t\t\t"
    + ids["widget_target_ref"]
    + " /* OptiScheduleWidget */,\n\t\t\t);",
)

text = text.replace(
    "504EC3171FED79650016851F /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbaseConfigurationReference = FC68EB0AF532CFC21C3344DD /* Pods-App.debug.xcconfig */;\n\t\t\tbuildSettings = {",
    "504EC3171FED79650016851F /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbaseConfigurationReference = FC68EB0AF532CFC21C3344DD /* Pods-App.debug.xcconfig */;\n\t\t\tbuildSettings = {\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;",
)

text = text.replace(
    "504EC3181FED79650016851F /* Release */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbaseConfigurationReference = AF51FD2D460BCFE21FA515B2 /* Pods-App.release.xcconfig */;\n\t\t\tbuildSettings = {",
    "504EC3181FED79650016851F /* Release */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbaseConfigurationReference = AF51FD2D460BCFE21FA515B2 /* Pods-App.release.xcconfig */;\n\t\t\tbuildSettings = {\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;",
)

append = f"""
/* Begin PBXContainerItemProxy section */
\t\t{ids['proxy_ref']} /* PBXContainerItemProxy */ = {{
\t\t\tisa = PBXContainerItemProxy;
\t\t\tcontainerPortal = 504EC2FC1FED79650016851F /* Project object */;
\t\t\tproxyType = 1;
\t\t\tremoteGlobalIDString = {ids['widget_target_ref']};
\t\t\tremoteInfo = OptiScheduleWidget;
\t\t}};
/* End PBXContainerItemProxy section */

/* Begin PBXCopyFilesBuildPhase section */
\t\t{ids['embed_phase_ref']} /* Embed App Extensions */ = {{
\t\t\tisa = PBXCopyFilesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t{ids['embed_build_ref']} /* OptiScheduleWidget.appex in Embed App Extensions */,
\t\t\t);
\t\t\tname = "Embed App Extensions";
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t\tdstPath = "";
\t\t\tdstSubfolderSpec = 13;
\t\t}};
/* End PBXCopyFilesBuildPhase section */

/* Begin PBXTargetDependency section */
\t\t{ids['dep_ref']} /* PBXTargetDependency */ = {{
\t\t\tisa = PBXTargetDependency;
\t\t\ttarget = {ids['widget_target_ref']} /* OptiScheduleWidget */;
\t\t\ttargetProxy = {ids['proxy_ref']} /* PBXContainerItemProxy */;
\t\t}};
/* End PBXTargetDependency section */
"""

text = text.replace("/* Begin PBXFrameworksBuildPhase section */", append + "\n/* Begin PBXFrameworksBuildPhase section */")

widget_sections = f"""
\t\t{ids['widget_group_ref']} /* OptiScheduleWidget */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t{ids['widget_swift_ref']} /* OptiScheduleWidget.swift */,
\t\t\t\t{ids['widget_plist_ref']} /* Info.plist */,
\t\t\t\t{ids['widget_ent_ref']} /* OptiScheduleWidget.entitlements */,
\t\t\t);
\t\t\tpath = OptiScheduleWidget;
\t\t\tsourceTree = "<group>";
\t\t}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
\t\t{ids['widget_target_ref']} /* OptiScheduleWidget */ = {{
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = {ids['widget_config_list_ref']} /* Build configuration list for PBXNativeTarget "OptiScheduleWidget" */;
\t\t\tbuildPhases = (
\t\t\t\t{ids['widget_sources_ref']} /* Sources */,
\t\t\t\t{ids['widget_frameworks_ref']} /* Frameworks */,
\t\t\t\t{ids['widget_resources_ref']} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = OptiScheduleWidget;
\t\t\tproductName = OptiScheduleWidget;
\t\t\tproductReference = {ids['widget_product_ref']} /* OptiScheduleWidget.appex */;
\t\t\tproductType = "com.apple.product-type.app-extension";
\t\t}};
"""

text = text.replace("/* End PBXGroup section */", widget_sections)

widget_build_phases = f"""
\t\t{ids['widget_sources_ref']} /* Sources */ = {{
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t{ids['widget_swift_build']} /* OptiScheduleWidget.swift in Sources */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXSourcesBuildPhase section */

/* Begin PBXResourcesBuildPhase section */
\t\t{ids['widget_resources_ref']} /* Resources */ = {{
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXShellScriptBuildPhase section */
"""

text = text.replace("/* End PBXSourcesBuildPhase section */", widget_build_phases)

text = text.replace(
    "504EC3011FED79650016851F /* Frameworks */ = {",
    f"\t\t{ids['widget_frameworks_ref']} /* Frameworks */ = {{\n\t\t\tisa = PBXFrameworksBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n/* End PBXFrameworksBuildPhase section */\n\n/* Begin PBXFrameworksBuildPhase section */\n\t\t504EC3011FED79650016851F /* Frameworks */ = {{",
)

widget_configs = f"""
\t\t{ids['widget_debug_ref']} /* Debug */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tCODE_SIGN_ENTITLEMENTS = OptiScheduleWidget/OptiScheduleWidget.entitlements;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = OptiScheduleWidget/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 14.0;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks";
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.optischedule.consumer.OptiScheduleWidget;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSKIP_INSTALL = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t}};
\t\t\tname = Debug;
\t\t}};
\t\t{ids['widget_release_ref']} /* Release */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tCODE_SIGN_ENTITLEMENTS = OptiScheduleWidget/OptiScheduleWidget.entitlements;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = OptiScheduleWidget/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 14.0;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks";
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.optischedule.consumer.OptiScheduleWidget;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSKIP_INSTALL = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t}};
\t\t\tname = Release;
\t\t}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
\t\t{ids['widget_config_list_ref']} /* Build configuration list for PBXNativeTarget "OptiScheduleWidget" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{ids['widget_debug_ref']} /* Debug */,
\t\t\t\t{ids['widget_release_ref']} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
"""

text = text.replace("/* End XCBuildConfiguration section */", widget_configs)

pbx_path.write_text(text)
print("✓ Patched App.xcodeproj for HomeScreenWidget plugin + OptiScheduleWidget extension")
PY

echo "✓ iOS widget configure complete"
echo "  Enable App Group capability group.com.optischedule.consumer in Apple Developer for app + widget targets."
