import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreenLib from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MonetizationProvider } from '../src/context/MonetizationContext';
import { GameProvider } from '../src/context/GameContext';
import { initRevenueCat } from '../src/services/revenueCatService';

// Keep the splash screen visible while we initialise
SplashScreenLib.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Initialise RevenueCat as early as possible
    initRevenueCat();
    // Hide Expo splash once the JS bundle is ready
    SplashScreenLib.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MonetizationProvider>
          <GameProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
            </Stack>
          </GameProvider>
        </MonetizationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
