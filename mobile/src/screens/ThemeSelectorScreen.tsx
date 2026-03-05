import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { StoryTheme } from '../types';

interface ThemeOption {
  id: StoryTheme;
  label: string;
  subtitle: string;
  emoji: string;
  accentColor: string;
  gradientColors: [string, string];
}

const THEMES: ThemeOption[] = [
  {
    id: 'scifi',
    label: 'Neon Void',
    subtitle: 'Orbital Facility · Memory Loss · Hard Sci-Fi',
    emoji: '🛸',
    accentColor: '#38bdf8',
    gradientColors: ['rgba(14,116,144,0.3)', 'rgba(0,0,0,0)'],
  },
  {
    id: 'fantasy',
    label: 'Eldritch Realms',
    subtitle: 'Ancient Ruins · Dark Magic · Gritty Fantasy',
    emoji: '⚔️',
    accentColor: '#a78bfa',
    gradientColors: ['rgba(91,33,182,0.3)', 'rgba(0,0,0,0)'],
  },
  {
    id: 'horror',
    label: 'Silent Shadows',
    subtitle: 'Isolated House · Cosmic Dread · Paranoia',
    emoji: '👁',
    accentColor: '#f87171',
    gradientColors: ['rgba(153,27,27,0.3)', 'rgba(0,0,0,0)'],
  },
  {
    id: 'cyberpunk',
    label: 'Chrome City',
    subtitle: 'Neon Metropolis · Corporate Noir · Data Theft',
    emoji: '🌆',
    accentColor: '#facc15',
    gradientColors: ['rgba(161,98,7,0.3)', 'rgba(0,0,0,0)'],
  },
  {
    id: 'postapocalyptic',
    label: 'Dust & Bone',
    subtitle: 'Wasteland · Survival · Desolate Ruins',
    emoji: '🌵',
    accentColor: '#fb923c',
    gradientColors: ['rgba(154,52,18,0.3)', 'rgba(0,0,0,0)'],
  },
];

export default function ThemeSelectorScreen() {
  const { startGame, isLoading } = useGame();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CHOOSE YOUR TIMELINE</Text>
        <Text style={styles.headerSub}>Each path is unique. There is no going back.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>INITIALIZING TIMELINE...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              onPress={() => startGame(theme.id)}
              activeOpacity={0.8}
              style={styles.card}
            >
              <LinearGradient
                colors={theme.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.cardBorder, { borderColor: theme.accentColor + '40' }]} />

              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>{theme.emoji}</Text>
                <View style={styles.cardText}>
                  <Text style={[styles.cardLabel, { color: theme.accentColor }]}>
                    {theme.label}
                  </Text>
                  <Text style={styles.cardSubtitle}>{theme.subtitle}</Text>
                </View>
                <Text style={[styles.cardArrow, { color: theme.accentColor }]}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 6,
    marginBottom: 8,
  },
  headerSub: {
    color: 'rgba(156,163,175,0.6)',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(99,102,241,0.7)',
    fontSize: 10,
    letterSpacing: 6,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(156,163,175,0.6)',
    letterSpacing: 0.5,
  },
  cardArrow: {
    fontSize: 20,
    fontWeight: '300',
  },
});
