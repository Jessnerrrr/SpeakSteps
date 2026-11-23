import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function useListPagination(total: number, pageSize: number, resetKey: string) {
  const [selection, setSelection] = useState({ resetKey, page: 0 });
  useEffect(() => {
    setSelection((current) => current.resetKey === resetKey ? current : { resetKey, page: 0 });
  }, [resetKey]);
  const pageCount = Math.ceil(total / pageSize);
  const page = Math.min(selection.resetKey === resetKey ? selection.page : 0, Math.max(0, pageCount - 1));
  const start = page * pageSize;
  const end = Math.min(start + pageSize, total);
  return { page, pageCount, start, end, onPageChange: (next: number) => setSelection({ resetKey, page: next }) };
}

export function ListPagination({ page, pageCount, start, end, total, noun, onPageChange, accent = '#0865AD', muted = '#436780', border = '#CBDDEB', surface = '#FFFFFF' }: {
  page: number; pageCount: number; start: number; end: number; total: number; noun: string;
  onPageChange: (page: number) => void;
  accent?: string; muted?: string; border?: string; surface?: string;
}) {
  if (pageCount <= 1) return null;
  const firstVisible = Math.max(0, Math.min(page - 1, pageCount - 3));
  const numbers = Array.from({ length: Math.min(3, pageCount) }, (_, index) => firstVisible + index);
  const arrows = [
    { label: 'First page', icon: 'play-back-outline', target: 0, disabled: page === 0 },
    { label: 'Previous page', icon: 'chevron-back', target: page - 1, disabled: page === 0 },
    { label: 'Next page', icon: 'chevron-forward', target: page + 1, disabled: page === pageCount - 1 },
    { label: 'Last page', icon: 'play-forward-outline', target: pageCount - 1, disabled: page === pageCount - 1 },
  ] as const;
  const renderArrow = ({ label, icon, target, disabled }: (typeof arrows)[number]) => (
    <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
      disabled={disabled} onPress={() => onPageChange(target)} style={[styles.control, { backgroundColor: surface }, disabled && styles.disabled]}>
      <Ionicons name={icon} color={muted} size={17} />
    </Pressable>
  );

  return (
    <View style={[styles.footer, { borderTopColor: border }]}>
      <Text accessibilityLiveRegion="polite" style={[styles.summary, { color: muted }]}>Showing {start + 1}–{end} of {total} {noun}</Text>
      <View style={styles.controls}>
        {arrows.slice(0, 2).map(renderArrow)}
        {numbers.map((number) => (
          <Pressable key={number} accessibilityRole="button" accessibilityLabel={'Page ' + (number + 1)}
            accessibilityState={{ selected: number === page }} onPress={() => onPageChange(number)}
            style={[styles.control, { backgroundColor: number === page ? accent : surface }]}>
            <Text style={[styles.number, { color: number === page ? '#FFFFFF' : muted }]}>{number + 1}</Text>
          </Pressable>
        ))}
        {arrows.slice(2).map(renderArrow)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, paddingVertical: 10, marginTop: 10, gap: 8, alignItems: 'center' },
  summary: { fontSize: 13 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  control: { minWidth: 34, minHeight: 44, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.4 },
  number: { fontWeight: '700', fontSize: 14 },
});
