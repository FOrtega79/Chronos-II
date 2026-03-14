/**
 * Config plugin to fix expo-av (EXAV) header resolution when
 * useFrameworks: "static" is enabled (required by react-native-google-mobile-ads).
 *
 * Root cause: with static frameworks, CocoaPods does not automatically
 * expose ExpoModulesCore public headers to the EXAV pod, causing:
 *   - 'ExpoModulesCore/EXEventEmitter.h' file not found
 *   - could not build Objective-C module 'EXAV'
 *
 * Fix: inject a post_install step that appends the ExpoModulesCore
 * public headers path to EXAV's HEADER_SEARCH_PATHS.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const GUARD = '# [withExpoAVStaticFix]';

const PATCH = `
  ${GUARD} Fix EXAV header search paths when useFrameworks: static is active
  installer.pods_project.targets.each do |target|
    if target.name == 'EXAV'
      target.build_configurations.each do |cfg|
        existing = cfg.build_settings['HEADER_SEARCH_PATHS'] || '$(inherited)'
        unless existing.include?('ExpoModulesCore')
          cfg.build_settings['HEADER_SEARCH_PATHS'] = [
            existing,
            '"${PODS_ROOT}/Headers/Public/ExpoModulesCore"',
            '"${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore/Swift Compatibility Header"',
          ].join(' ')
        end
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
        // Already patched – nothing to do.
        return cfg;
      }

      // Insert the patch inside the existing post_install block.
      podfile = podfile.replace(
        /(post_install do \|installer\|)/,
        `$1\n${PATCH}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return cfg;
    },
  ]);

module.exports = withExpoAVStaticFix;
