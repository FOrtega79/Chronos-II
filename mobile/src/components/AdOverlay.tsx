/**
 * AdOverlay — visual indicator shown while a rewarded ad is displaying.
 * The actual ad is rendered natively by Google AdMob SDK; this overlay
 * provides a "Don't close the app" hint and loading state.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';

interface Props {
  visible: boolean;
}

export default function AdOverlay({ visible }: Props) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, pulse]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Animated.View style={[styles.dot, { opacity: pulse }]} />
          <Text style={styles.label}>AD IN PROGRESS</Text>
          <Text style={styles.hint}>
            Watch the full ad to unlock the next chapter.{'\n'}Do not close the app.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: 300,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
  },
  label: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 5,
  },
  hint: {
    color: 'rgba(156,163,175,0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
