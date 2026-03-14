/**
 * Config plugin to fix expo-av (EXAV) compilation when
 * useFrameworks: "static" is enabled (required by react-native-google-mobile-ads).
 *
 * Root cause: with static frameworks, CocoaPods does not automatically
 * build ExpoModulesCore with modular headers, so EXAV cannot resolve:
 *   #import <ExpoModulesCore/EXEventEmitter.h>
 *
 * Primary fix: expo-build-properties extraPods with modular_headers: true
 *   (see app.json) — tells CocoaPods to emit a module map for the pod.
 *
 * This plugin is a belt-and-suspenders fallback: it sets DEFINES_MODULE=YES
 * and SWIFT_INSTALL_OBJC_HEADER=YES on the ExpoModulesCore Xcode target via
 * a post_install hook, which makes Xcode generate the umbrella header and
 * module map at build time regardless of CocoaPods configuration.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const GUARD = '# [withExpoAVStaticFix]';

const PATCH = `
  ${GUARD} Ensure ExpoModulesCore emits a module map so EXAV can resolve its headers
  installer.pods_project.targets.each do |target|
    if target.name == 'ExpoModulesCore'
      target.build_configurations.each do |cfg|
        cfg.build_settings['DEFINES_MODULE'] = 'YES'
        cfg.build_settings['SWIFT_INSTALL_OBJC_HEADER'] = 'YES'
      end
    end
  end
`;

const withExpoAVStaticFix = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes(GUARD)) {
        return cfg;
      }

      podfile = podfile.replace(
        /(post_install do \|installer\|)/,
        `$1\n${PATCH}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return cfg;
    },
  ]);

module.exports = withExpoAVStaticFix;
