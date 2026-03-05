import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface Props {
  items: string[];
  visible: boolean;
  onClose: () => void;
  onInspect: (item: string) => void;
}

function getItemColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('chip') || n.includes('drive') || n.includes('data') || n.includes('device')) return '#22d3ee';
  if (n.includes('gun') || n.includes('sword') || n.includes('blade') || n.includes('weapon')) return '#f87171';
  if (n.includes('key') || n.includes('card') || n.includes('pass') || n.includes('access')) return '#facc15';
  if (n.includes('med') || n.includes('heal') || n.includes('potion') || n.includes('kit')) return '#34d399';
  if (n.includes('note') || n.includes('map') || n.includes('log') || n.includes('book')) return '#e2e8f0';
  if (n.includes('tool') || n.includes('wrench') || n.includes('part') || n.includes('scrap')) return '#fb923c';
  return '#818cf8';
}

function getItemEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('chip') || n.includes('drive') || n.includes('data')) return '💾';
  if (n.includes('gun') || n.includes('pistol') || n.includes('rifle')) return '🔫';
  if (n.includes('sword') || n.includes('blade') || n.includes('knife')) return '🗡️';
  if (n.includes('key')) return '🗝️';
  if (n.includes('card') || n.includes('pass') || n.includes('badge')) return '🪪';
  if (n.includes('med') || n.includes('potion') || n.includes('heal')) return '💊';
  if (n.includes('bandage') || n.includes('kit')) return '🩹';
  if (n.includes('map')) return '🗺️';
  if (n.includes('book') || n.includes('diary') || n.includes('log')) return '📖';
  if (n.includes('note') || n.includes('paper') || n.includes('file')) return '📄';
  if (n.includes('tool') || n.includes('wrench')) return '🔧';
  return '📦';
}

export default function InventoryModal({ items, visible, onClose, onInspect }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>CARGO HOLD</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {items.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>EMPTY</Text>
              </View>
            ) : (
              items.map((item, idx) => {
                const color = getItemColor(item);
                const emoji = getItemEmoji(item);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.itemRow}
                    onPress={() => onInspect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIconBox, { borderColor: color + '40' }]}>
                      <Text style={styles.itemEmoji}>{emoji}</Text>
                    </View>
                    <View style={styles.itemText}>
                      <Text style={[styles.itemName, { color }]}>{item}</Text>
                      <Text style={styles.itemHint}>Tap to inspect</Text>
                    </View>
                    <Text style={[styles.itemArrow, { color }]}>→</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    maxHeight: '70%',
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 6,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: 'rgba(156,163,175,0.6)',
    fontSize: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.3,
  },
  emptyText: {
    color: 'rgba(107,114,128,0.5)',
    fontSize: 10,
    letterSpacing: 5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    gap: 14,
  },
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 22,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  itemHint: {
    fontSize: 10,
    color: 'rgba(107,114,128,0.5)',
    letterSpacing: 1,
  },
  itemArrow: {
    fontSize: 16,
    opacity: 0.6,
  },
});
