/**
 * Root screen — drives the entire app state machine.
 *
 * AppStatus flow:
 *   SPLASH → MENU → THEME_SELECT → PLAYING → GAME_OVER
 *                       ↑________________________|  (reset returns to MENU)
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGame } from '../src/context/GameContext';
import { useMonetization } from '../src/context/MonetizationContext';
import { AppStatus } from '../src/types';
import SplashScreen from '../src/screens/SplashScreen';
import MenuScreen from '../src/screens/MenuScreen';
import ThemeSelectorScreen from '../src/screens/ThemeSelectorScreen';
import GameOverScreen from '../src/screens/GameOverScreen';
import StoryView from '../src/components/StoryView';
import AdOverlay from '../src/components/AdOverlay';

export default function Index() {
  const { appStatus, enterThemeSelection } = useGame();
  const { isAdShowing } = useMonetization();
  const [showingSplash, setShowingSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowingSplash(false);
  };

  // Show splash first, then defer to appStatus
  if (showingSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <View style={styles.container}>
      {appStatus === AppStatus.MENU || appStatus === AppStatus.SPLASH ? (
        <MenuScreen />
      ) : appStatus === AppStatus.THEME_SELECT ? (
        <ThemeSelectorScreen />
      ) : appStatus === AppStatus.GAME_OVER ? (
        <GameOverScreen />
      ) : (
        // AppStatus.PLAYING
        <StoryView />
      )}

      {/* Global ad overlay — shown on top of any screen when an ad is active */}
      <AdOverlay visible={isAdShowing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
