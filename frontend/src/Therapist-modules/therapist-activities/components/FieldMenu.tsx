import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronRightIcon } from '@/components/therapist/icons';

export function FieldMenu({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const { palette } = useTherapist();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: palette.text }]}>{label}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => setOpen((current) => !current)} style={[styles.control, { borderColor: palette.line, backgroundColor: palette.card }]}>
        <Text style={[styles.value, { color: palette.text }]} numberOfLines={1}>{value}</Text>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <ChevronRightIcon color={palette.faint} size={16} />
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.menu, { borderColor: palette.line, backgroundColor: palette.card }]}>
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              style={[styles.option, option === value && { backgroundColor: '#F8F1EA' }]}
            >
              <Text style={[styles.optionText, { color: palette.text }]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ChecklistMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const { palette } = useTherapist();
  const [open, setOpen] = useState(false);
  const allSelected = options.every((option) => selected.includes(option));
  const summary = selected.length === 0 ? 'Select sounds' : allSelected ? 'All sounds' : selected.join(', ');

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen((current) => !current)} style={[styles.control, { borderColor: palette.line, backgroundColor: palette.card }]}>
        <Text style={[styles.value, { color: selected.length ? palette.text : palette.faint }]} numberOfLines={1}>{summary}</Text>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <ChevronRightIcon color={palette.faint} size={16} />
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.menu, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: allSelected }} onPress={() => onChange(allSelected ? [] : [...options])} style={styles.option}>
            <Box checked={allSelected} />
            <Text style={[styles.optionText, { color: palette.text }]}>Select all</Text>
          </Pressable>
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <Pressable key={option} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => toggle(option)} style={styles.option}>
                <Box checked={checked} />
                <Text style={[styles.optionText, { color: palette.text }]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function Box({ checked }: { checked: boolean }) {
  return <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Text style={styles.mark}>✓</Text> : null}</View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  control: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: { flex: 1, fontSize: 14 },
  menu: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  optionText: { fontSize: 14 },
  box: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#C48B5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: '#C48B5A' },
  mark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
