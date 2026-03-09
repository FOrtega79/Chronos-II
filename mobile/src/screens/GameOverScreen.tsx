import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';

export default function GameOverScreen() {
  const { resetGame, loadGame, hasSave } = useGame();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <LinearGradient colors={['#000000', '#0d0000', '#000000']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Text style={styles.sigLabel}>SIGNAL LOST</Text>

        <View style={styles.separator} />

        <Text style={styles.title}>YOU ARE DEAD</Text>
        <Text style={styles.subtitle}>
          The timeline has collapsed. Your thread has ended.
        </Text>

        <View style={styles.buttonStack}>
          <TouchableOpacity
            style={[styles.btn, styles.btnDanger]}
            onPress={resetGame}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>NEW TIMELINE</Text>
          </TouchableOpacity>

          {hasSave && (
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={loadGame}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, styles.btnTextOutline]}>RESTORE CHECKPOINT</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  sigLabel: {
    fontSize: 10,
    letterSpacing: 8,
    color: 'rgba(239,68,68,0.6)',
    fontWeight: '700',
  },
  separator: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(239,68,68,0.3)',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(156,163,175,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  buttonStack: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginTop: 8,
  },
  btn: {
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnDanger: {
    backgroundColor: '#dc2626',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 3,
    fontSize: 12,
  },
  btnTextOutline: {
    color: 'rgba(255,255,255,0.6)',
  },
});
