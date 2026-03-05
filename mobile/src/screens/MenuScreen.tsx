import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { useMonetization } from '../context/MonetizationContext';
import Paywall from '../components/Paywall';

export default function MenuScreen() {
  const { enterThemeSelection, loadGame, hasSave, isLoading } = useGame();
  const { isPremium, showPaywallModal, openPaywall, closePaywall } = useMonetization();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.inner}>
        <Text style={styles.title}>CHRONOS</Text>
        <Text style={styles.tagline}>Infinite possibilities. One timeline. Yours.</Text>

        <View style={styles.buttonStack}>
          {hasSave && (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={loadGame}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnTextPrimary}>CONTINUE TIMELINE</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, styles.btnWhite]}
            onPress={enterThemeSelection}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnTextDark}>
              {hasSave ? 'NEW TIMELINE' : 'BEGIN STORY'}
            </Text>
          </TouchableOpacity>

          {!isPremium && (
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={openPaywall}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.btnTextOutline}>REMOVE ADS</Text>
            </TouchableOpacity>
          )}
        </View>

        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>✦ PREMIUM</Text>
          </View>
        )}
      </View>

      {showPaywallModal && <Paywall onClose={closePaywall} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  title: {
    fontSize: 64,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 10,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(156,163,175,0.8)',
    textAlign: 'center',
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  buttonStack: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  btn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#4f46e5',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  btnWhite: {
    backgroundColor: '#ffffff',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnTextPrimary: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 3,
    fontSize: 13,
  },
  btnTextDark: {
    color: '#000',
    fontWeight: '700',
    letterSpacing: 3,
    fontSize: 13,
  },
  btnTextOutline: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 3,
    fontSize: 12,
  },
  premiumBadge: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  premiumBadgeText: {
    color: '#c084fc',
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
  },
});
