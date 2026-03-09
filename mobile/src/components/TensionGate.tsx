import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useMonetization } from '../context/MonetizationContext';

interface Props {
  isLocked: boolean;
  onUnlockAd: () => void;
  children: React.ReactNode;
}

export default function TensionGate({ isLocked, onUnlockAd, children }: Props) {
  const { openPaywall } = useMonetization();

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Blurred content beneath */}
      <View style={styles.blurWrapper} pointerEvents="none">
        {children}
      </View>

      {/* Lock overlay */}
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.heading}>HIGH TENSION DETECTED</Text>
          <Text style={styles.body}>
            The story has reached a critical cliffhanger. Unlock the next moments.
          </Text>

          <TouchableOpacity
            style={[styles.btn, styles.btnAd]}
            onPress={onUnlockAd}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Watch Ad to Unlock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPro]}
            onPress={openPaywall}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Unlock Pro (No Ads)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  blurWrapper: {
    opacity: 0.25,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  lockIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  heading: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(209,213,219,0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  btnAd: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 5,
  },
  btnPro: {
    backgroundColor: '#7c3aed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 5,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
