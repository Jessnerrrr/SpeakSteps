import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import type { TherapistNotification } from '@/Therapist-modules/therapist-homepage/data/sampleData';

type Filter = 'all' | 'unread';

export function NotificationPanel() {
  const { palette, notifications, markAllNotificationsRead, markNotificationRead, setNotificationsOpen } = useTherapist();
  const [filter, setFilter] = useState<Filter>('all');
  const visible = filter === 'unread' ? notifications.filter((item) => !item.read) : notifications;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (event: Event) => {
      if ((event as { key?: string }).key === 'Escape') setNotificationsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setNotificationsOpen]);

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={() => setNotificationsOpen(false)} />
      <View style={[styles.panel, { backgroundColor: palette.card, shadowColor: palette.shadow }]}>
        <Text style={[styles.title, { color: palette.text }]}>Notifications</Text>
        <View style={styles.filters}>
          <FilterChip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Unread" selected={filter === 'unread'} onPress={() => setFilter('unread')} />
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {visible.length === 0 ? (
            <Text style={[styles.empty, { color: palette.muted }]}>No unread notifications.</Text>
          ) : (
            visible.map((item) => (
              <NotificationRow key={item.id} item={item} onPress={() => markNotificationRead(item.id)} />
            ))
          )}
        </ScrollView>
        <Pressable accessibilityRole="button" onPress={markAllNotificationsRead} style={styles.markAll}>
          <Text style={[styles.markAllText, { color: palette.primary }]}>Mark all as read</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { palette } = useTherapist();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? palette.primary : 'transparent',
          borderColor: selected ? palette.primary : palette.line,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? palette.inverse : palette.muted }]}>{label}</Text>
    </Pressable>
  );
}

function NotificationRow({ item, onPress }: { item: TherapistNotification; onPress: () => void }) {
  const { palette } = useTherapist();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, { borderBottomColor: palette.line }]}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{item.title}</Text>
        <Text style={[styles.rowBody, { color: palette.muted }]}>{item.body}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={[styles.time, { color: palette.faint }]}>{item.time}</Text>
        {!item.read ? <View style={[styles.unread, { backgroundColor: palette.primary }]} /> : <View style={styles.unreadSpacer} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  panel: {
    position: 'absolute',
    top: 6,
    left: 16,
    right: 16,
    maxHeight: 460,
    borderRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    maxHeight: 300,
  },
  listContent: {
    paddingBottom: 4,
  },
  empty: {
    fontSize: 13,
    paddingVertical: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: 92,
  },
  time: {
    fontSize: 11,
    textAlign: 'right',
  },
  unread: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unreadSpacer: {
    width: 8,
    height: 8,
  },
  markAll: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
