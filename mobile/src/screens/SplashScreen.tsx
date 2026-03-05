import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish, opacity, scale]);

  return (
    <LinearGradient colors={['#000000', '#0a0a1a', '#000000']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.title}>CHRONOS</Text>
        <View style={styles.separator} />
        <Text style={styles.subtitle}>INFINITE TEXT ADVENTURE</Text>
        <View style={styles.spinnerRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotMid]} />
          <View style={styles.dot} />
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
    gap: 16,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 12,
  },
  separator: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(99,102,241,0.5)',
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(156,163,175,0.7)',
    letterSpacing: 6,
    fontWeight: '300',
  },
  spinnerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(99,102,241,0.4)',
  },
  dotMid: {
    backgroundColor: 'rgba(99,102,241,0.8)',
  },
});
