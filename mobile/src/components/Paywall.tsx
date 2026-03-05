import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMonetization } from '../context/MonetizationContext';

interface Props {
  onClose: () => void;
}

const FEATURES = [
  { icon: '🚫', label: 'No Ads' },
  { icon: '♾️', label: 'Unlimited Tension Passes' },
  { icon: '🎨', label: '4K Image Generation' },
  { icon: '🎙️', label: 'AI Voice Narration' },
  { icon: '💙', label: 'Support Independent Devs' },
];

export default function Paywall({ onClose }: Props) {
  const { purchasePremium, restorePurchases, isRestoringPurchases } = useMonetization();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await purchasePremium();
      onClose();
    } catch (err: any) {
      if (!err?.userCancelled) {
        Alert.alert(
          'Purchase Failed',
          err?.message ?? 'Something went wrong. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Purchases Restored', 'Your premium access has been restored.');
      onClose();
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message ?? 'No previous purchases found.');
    }
  };

  const isProcessing = isPurchasing || isRestoringPurchases;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header gradient accent */}
          <LinearGradient
            colors={['rgba(168,85,247,0.3)', 'transparent']}
            style={styles.headerGlow}
          />

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Chronos Premium</Text>
          <Text style={styles.subtitle}>Experience the timeline without interruptions.</Text>

          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.purchaseBtn, isProcessing && styles.purchaseBtnDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7c3aed', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.purchaseBtnGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.purchaseBtnText}>Upgrade Now — $4.99 / month</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={isProcessing}
          >
            {isRestoringPurchases ? (
              <ActivityIndicator size="small" color="rgba(156,163,175,0.6)" />
            ) : (
              <Text style={styles.restoreBtnText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            Subscriptions auto-renew unless cancelled. Manage in App Store settings.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#111',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    padding: 28,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  headerGlow: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 4,
  },
  closeBtnText: {
    color: 'rgba(156,163,175,0.6)',
    fontSize: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e9d5ff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(156,163,175,0.7)',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },
  featureList: {
    gap: 14,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 18,
    width: 28,
  },
  featureLabel: {
    color: 'rgba(229,231,235,0.9)',
    fontSize: 15,
  },
  purchaseBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  purchaseBtnDisabled: {
    opacity: 0.6,
  },
  purchaseBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  purchaseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  restoreBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreBtnText: {
    color: 'rgba(156,163,175,0.6)',
    fontSize: 13,
  },
  legal: {
    color: 'rgba(107,114,128,0.7)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },
});
