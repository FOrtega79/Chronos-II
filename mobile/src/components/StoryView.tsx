import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useMonetization } from '../context/MonetizationContext';
import TensionGate from './TensionGate';
import InventoryModal from './InventoryModal';
import Paywall from './Paywall';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_CLOSED = 96;
const DRAWER_OPEN_RATIO = 0.7;

export default function StoryView() {
  const insets = useSafeAreaInsets();
  const {
    currentBeat,
    makeChoice,
    isLoading,
    currentImage,
    gameState,
    resetGame,
    saveGame,
    isNarrationEnabled,
    isPlayingAudio,
    isAudioLoading,
    toggleNarration,
  } = useGame();
  const { isPremium, showRewardedAd, openPaywall, showPaywallModal, closePaywall, isAdShowing } =
    useMonetization();

  const [isAdUnlocked, setIsAdUnlocked] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saveNotification, setSaveNotification] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const drawerHeight = useRef(new Animated.Value(DRAWER_CLOSED)).current;
  const saveOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Track relationship changes
  const prevRelsRef = useRef<Record<string, number>>({});
  const [relUpdates, setRelUpdates] = useState<{ name: string; diff: number }[]>([]);

  // Reset unlock state + scroll top on each new beat
  useEffect(() => {
    setIsAdUnlocked(false);
    setIsDrawerOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentBeat]);

  // Fade content during loading
  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: isLoading ? 0.4 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isLoading, contentOpacity]);

  // Drawer animation
  useEffect(() => {
    const targetHeight = isDrawerOpen ? SCREEN_HEIGHT * DRAWER_OPEN_RATIO : DRAWER_CLOSED;
    Animated.spring(drawerHeight, {
      toValue: targetHeight,
      friction: 8,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [isDrawerOpen, drawerHeight]);

  // Relationship updates
  useEffect(() => {
    if (!gameState) return;
    const current: Record<string, number> = {};
    gameState.npcRelationships.forEach((r) => (current[r.name] = r.score));

    const updates: { name: string; diff: number }[] = [];
    for (const [name, score] of Object.entries(current)) {
      const prev = prevRelsRef.current[name];
      if (prev === undefined) updates.push({ name, diff: score });
      else if (prev !== score) updates.push({ name, diff: score - prev });
    }

    prevRelsRef.current = current;
    setRelUpdates(updates.length > 0 ? updates : []);
  }, [gameState]);

  // Save notification animation
  const triggerSaveNotification = () => {
    Animated.sequence([
      Animated.timing(saveOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(saveOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    setShowMenu(false);
    await saveGame();
    triggerSaveNotification();
  };

  const handleInspect = (item: string) => {
    setShowInventory(false);
    makeChoice(`Inspect ${item}`);
  };

  const handleUnlockAd = () => {
    showRewardedAd(() => setIsAdUnlocked(true));
  };

  if (!currentBeat || !gameState) return null;

  const isCliffhanger = currentBeat.tension_score > 7;
  const isLocked = isCliffhanger && !isPremium && !isAdUnlocked;
  const drawerHidden = isLoading || isLocked;

  return (
    <View style={styles.container}>
      {/* ── Background Image ── */}
      <View style={StyleSheet.absoluteFillObject}>
        {currentImage ? (
          <Image
            source={{ uri: currentImage }}
            style={styles.bgImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bgImage, styles.bgPlaceholder]}>
            {isLoading && (
              <View style={styles.visualizingRow}>
                <ActivityIndicator size="small" color="rgba(99,102,241,0.4)" />
                <Text style={styles.visualizingText}>VISUALIZING</Text>
              </View>
            )}
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.75)', '#000']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* ── HUD Header ── */}
      <View style={[styles.hud, { paddingTop: insets.top + 8 }]}>
        <View style={styles.hudLeft}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>{gameState.currentLocation}</Text>
          </View>
          <View style={styles.healthBar}>
            <View style={styles.healthBarLabels}>
              <Text style={styles.healthLabel}>VITALS</Text>
              <Text
                style={[
                  styles.healthValue,
                  { color: gameState.health < 30 ? '#ef4444' : '#34d399' },
                ]}
              >
                {gameState.health}%
              </Text>
            </View>
            <View style={styles.healthBarTrack}>
              <View
                style={[
                  styles.healthBarFill,
                  {
                    width: `${Math.max(0, Math.min(100, gameState.health))}%`,
                    backgroundColor:
                      gameState.health < 30
                        ? '#ef4444'
                        : gameState.health < 60
                        ? '#eab308'
                        : '#10b981',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Top-right controls */}
        <View style={styles.hudRight}>
          {/* Save notification */}
          <Animated.Text style={[styles.saveNote, { opacity: saveOpacity }]}>
            SAVED ✓
          </Animated.Text>

          {/* Narration toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, isNarrationEnabled && styles.iconBtnActive]}
            onPress={() => {
              if (!isPremium && !isNarrationEnabled) {
                openPaywall();
              } else {
                toggleNarration();
              }
            }}
            disabled={isAudioLoading}
          >
            {isAudioLoading ? (
              <ActivityIndicator size="small" color="#818cf8" />
            ) : (
              <Text style={styles.iconBtnText}>{isNarrationEnabled ? '🔊' : '🔇'}</Text>
            )}
          </TouchableOpacity>

          {/* Hamburger menu */}
          <TouchableOpacity
            style={[styles.iconBtn, showMenu && styles.iconBtnActive]}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Text style={styles.iconBtnText}>{showMenu ? '✕' : '☰'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Dropdown Menu ── */}
      {showMenu && (
        <View style={[styles.dropMenu, { top: insets.top + 64 }]}>
          <TouchableOpacity
            style={styles.dropMenuItem}
            onPress={() => {
              setShowMenu(false);
              setShowInventory(true);
            }}
          >
            <Text style={styles.dropMenuIcon}>📦</Text>
            <Text style={styles.dropMenuLabel}>INVENTORY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropMenuItem} onPress={handleSave}>
            <Text style={styles.dropMenuIcon}>💾</Text>
            <Text style={styles.dropMenuLabel}>SAVE PROGRESS</Text>
          </TouchableOpacity>

          <View style={styles.dropMenuDivider} />

          <TouchableOpacity
            style={[styles.dropMenuItem, styles.dropMenuItemDanger]}
            onPress={() => {
              setShowMenu(false);
              resetGame();
            }}
          >
            <Text style={styles.dropMenuIcon}>🚪</Text>
            <Text style={[styles.dropMenuLabel, styles.dropMenuLabelDanger]}>
              CLOSE STORY
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Scrollable Story Content ── */}
      <Animated.ScrollView
        ref={scrollRef}
        style={[styles.storyScroll, { opacity: contentOpacity }]}
        contentContainerStyle={[
          styles.storyContent,
          { paddingTop: insets.top + 120, paddingBottom: DRAWER_CLOSED + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TensionGate isLocked={isLocked} onUnlockAd={handleUnlockAd}>
          {/* System Log */}
          {gameState.narrativeHistory.length > 0 && (
            <View style={styles.sysLog}>
              <View style={styles.sysLogLine} />
              <Text style={styles.sysLogLabel}>System Log</Text>
              <Text style={styles.sysLogText}>
                "{gameState.narrativeHistory[gameState.narrativeHistory.length - 1]}"
              </Text>
            </View>
          )}

          {/* Relationship Updates */}
          {relUpdates.length > 0 && (
            <View style={styles.relRow}>
              {relUpdates.map((u, i) => (
                <View
                  key={`${u.name}-${i}`}
                  style={[
                    styles.relBadge,
                    {
                      borderColor: u.diff > 0 ? '#10b981' : '#ef4444',
                      backgroundColor: u.diff > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[styles.relName, { color: u.diff > 0 ? '#34d399' : '#f87171' }]}
                  >
                    {u.name}
                  </Text>
                  <Text
                    style={[styles.relDiff, { color: u.diff > 0 ? '#34d399' : '#f87171' }]}
                  >
                    {u.diff > 0 ? '+' : ''}
                    {u.diff}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Narrative Text */}
          <Text style={styles.narrative}>{currentBeat.narrative_text}</Text>
        </TensionGate>
      </Animated.ScrollView>

      {/* ── Loading hint ── */}
      {isLoading && (
        <View style={styles.loadingHint}>
          <Text style={styles.loadingHintText}>SIMULATING TIMELINE...</Text>
        </View>
      )}

      {/* ── Choice Drawer ── */}
      {!drawerHidden && (
        <Animated.View style={[styles.drawer, { height: drawerHeight }]}>
          <LinearGradient
            colors={['rgba(17,17,17,0.6)', 'rgba(0,0,0,0.95)', '#000']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Top edge sheen */}
          <View style={styles.drawerSheen} />

          {/* Handle / toggle */}
          <TouchableOpacity
            style={styles.drawerHandle}
            onPress={() => setIsDrawerOpen(!isDrawerOpen)}
            activeOpacity={0.8}
          >
            <View style={styles.drawerHandleBar} />
            <Text style={styles.drawerHandleLabel}>
              {isDrawerOpen ? 'MINIMIZE' : 'DECIDE'}
            </Text>
          </TouchableOpacity>

          {/* Options */}
          {isDrawerOpen && (
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={[
                styles.optionsContent,
                { paddingBottom: insets.bottom + 16 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {currentBeat.options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionCard}
                  onPress={() => {
                    setIsDrawerOpen(false);
                    setTimeout(() => makeChoice(opt.action), 200);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.optionIndex}>PATH 0{idx + 1}</Text>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}

      {/* ── Modals ── */}
      <InventoryModal
        items={gameState.playerInventory}
        visible={showInventory}
        onClose={() => setShowInventory(false)}
        onInspect={handleInspect}
      />

      {showPaywallModal && <Paywall onClose={closePaywall} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgPlaceholder: {
    backgroundColor: '#050510',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.4,
  },
  visualizingText: {
    color: 'rgba(99,102,241,0.6)',
    fontSize: 9,
    letterSpacing: 5,
    fontWeight: '600',
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hudLeft: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  locationText: {
    color: 'rgba(156,163,175,0.9)',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  healthBar: {
    width: 140,
    paddingLeft: 15,
    gap: 4,
  },
  healthBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthLabel: {
    color: 'rgba(107,114,128,0.8)',
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: '600',
  },
  healthValue: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  healthBarTrack: {
    height: 4,
    backgroundColor: 'rgba(55,65,81,0.8)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveNote: {
    color: '#34d399',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    borderColor: 'rgba(99,102,241,0.6)',
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  iconBtnText: {
    fontSize: 16,
  },
  dropMenu: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  dropMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  dropMenuItemDanger: {
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  dropMenuIcon: {
    fontSize: 16,
  },
  dropMenuLabel: {
    color: 'rgba(209,213,219,0.8)',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
  },
  dropMenuLabelDanger: {
    color: 'rgba(248,113,113,0.8)',
  },
  dropMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 8,
  },
  storyScroll: {
    flex: 1,
  },
  storyContent: {
    paddingHorizontal: 24,
  },
  sysLog: {
    marginBottom: 20,
    gap: 8,
  },
  sysLogLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(99,102,241,0.5)',
  },
  sysLogLabel: {
    color: 'rgba(99,102,241,0.7)',
    fontSize: 9,
    letterSpacing: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sysLogText: {
    color: 'rgba(156,163,175,0.7)',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    paddingLeft: 28,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(99,102,241,0.15)',
  },
  relRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  relBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderLeftWidth: 2,
    gap: 8,
  },
  relName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  relDiff: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  narrative: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 36,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  loadingHint: {
    position: 'absolute',
    bottom: DRAWER_CLOSED + 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  loadingHintText: {
    color: 'rgba(99,102,241,0.8)',
    fontSize: 9,
    letterSpacing: 5,
    fontWeight: '600',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  drawerSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  drawerHandle: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    gap: 6,
  },
  drawerHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(156,163,175,0.25)',
  },
  drawerHandleLabel: {
    color: 'rgba(156,163,175,0.6)',
    fontSize: 9,
    letterSpacing: 5,
    fontWeight: '700',
  },
  optionsList: {
    flex: 1,
  },
  optionsContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    gap: 6,
  },
  optionIndex: {
    color: 'rgba(99,102,241,0.5)',
    fontSize: 9,
    letterSpacing: 4,
    fontWeight: '700',
  },
  optionLabel: {
    color: 'rgba(229,231,235,0.9)',
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
  },
  optionArrow: {
    color: 'rgba(99,102,241,0.6)',
    fontSize: 16,
    alignSelf: 'flex-end',
  },
});
