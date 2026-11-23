import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronRightIcon } from '@/components/therapist/icons';
import { useTherapist } from '@/components/therapist/TherapistProvider';

type ChecklistSection<T extends string> = {
  label: string;
  options: readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  allLabel: string;
  headerContent?: ReactNode;
  single?: boolean;
};

type ChecklistProps<T extends string> = {
  label: string;
  options: readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  emptyLabel?: string;
  allLabel?: string;
  compact?: boolean;
  resetOnAll?: boolean;
  sectionLabel?: string;
  extraSections?: readonly ChecklistSection<T>[];
  headerContent?: ReactNode;
  searchable?: boolean;
  optionCaptions?: ReadonlyMap<T, string>;
};

type ChecklistPalette = { card: string; line: string; text: string; faint: string; primary: string; muted: string };

export function TherapistChecklistFilter<T extends string>(props: ChecklistProps<T>) {
  const { palette, isDark } = useTherapist();
  return <ChecklistFilter {...props} palette={palette} isDark={isDark} />;
}

export function ChecklistFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
  emptyLabel = 'Select sounds',
  allLabel = 'All sounds',
  compact = false,
  resetOnAll = false,
  sectionLabel,
  extraSections = [],
  headerContent,
  searchable = false,
  optionCaptions,
  palette,
  isDark,
}: ChecklistProps<T> & { palette: ChecklistPalette; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [query, setQuery] = useState('');
  const sections: ChecklistSection<T>[] = [{ label: sectionLabel ?? label, options, selected, onChange, allLabel, headerContent }, ...extraSections];
  const section = sections[sectionIndex] ?? sections[0];
  const allSelected = resetOnAll ? section.selected.length === 0 : section.options.every((option) => section.selected.includes(option));
  const summary = !selected.length ? emptyLabel : options.every((option) => selected.includes(option)) && !resetOnAll ? allLabel : selected.join(', ');
  const search = query.trim().toLowerCase();
  const visibleOptions = section.options.filter((option) =>
    (option + (sectionIndex === 0 ? ' ' + (optionCaptions?.get(option) ?? '') : '')).toLowerCase().includes(search),
  );

  const toggle = (option: T) => {
    if (section.single) { section.onChange([option]); return; }
    section.onChange(section.selected.includes(option) ? section.selected.filter((item) => item !== option) : [...section.selected, option]);
  };

  return (
    <View style={[styles.menuWrap, compact && styles.compactWrap]}>
      {!compact && <Text style={[styles.menuLabel, { color: palette.text }]}>{label}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label + ': ' + summary}
        accessibilityState={{ expanded: open }}
        onPress={() => { setSectionIndex(0); setQuery(''); setOpen(true); }}
        style={[styles.menuControl, compact && styles.compactControl, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <Text style={[styles.menuValue, { color: selected.length || extraSections.length ? palette.text : palette.faint }]} numberOfLines={1}>
          {extraSections.length ? label : summary}
        </Text>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <ChevronRightIcon color={palette.faint} size={16} />
        </View>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.popupOverlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.popupCard, { backgroundColor: palette.card, borderColor: palette.line }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={[styles.popupHeader, { borderBottomColor: palette.line }]}>
              <Text style={[styles.popupTitle, { color: palette.text }]}>
                {extraSections.length ? label : `Select ${label}`}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={styles.popupCloseBtn}
                hitSlop={8}
              >
                <Text style={[styles.popupCloseText, { color: palette.faint }]}>✕</Text>
              </Pressable>
            </View>

            {extraSections.length > 0 && (
              <View style={styles.sectionTabs}>
                {sections.map((group, index) => (
                  <Pressable key={group.label} accessibilityRole="tab" accessibilityState={{ selected: index === sectionIndex }}
                    onPress={() => { setSectionIndex(index); setQuery(''); }} style={[styles.sectionTab, { borderColor: index === sectionIndex ? palette.primary : palette.line }]}>
                    <Text style={{ color: palette.text }}>{group.label}{group.selected.length ? ' (' + group.selected.length + ')' : ''}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {section.headerContent}
            {searchable && (section.options.length > 10 || section.label === 'Students') && (
              <TextInput value={query} onChangeText={setQuery} accessibilityLabel={`Search ${section.label.toLowerCase()}`}
                placeholder={`Search ${section.label.toLowerCase()}`} placeholderTextColor={palette.faint}
                style={[styles.search, { borderColor: palette.line, color: palette.text }]} />
            )}
            <ScrollView key={section.label} style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              <Pressable
                accessibilityRole={section.single ? 'radio' : 'checkbox'}
                accessibilityState={{ checked: allSelected }}
                onPress={() => section.onChange(resetOnAll || allSelected ? [] : [...section.options])}
                style={[styles.popupOption, extraSections.length > 0 && styles.groupedOption, { borderBottomWidth: 1, borderBottomColor: palette.line }]}
              >
                <View style={[styles.checkSquare, section.single && styles.radioCircle, allSelected && styles.checkSquareOn]}>
                  {allSelected ? <Text style={styles.checkMark}>{section.single ? '•' : '✓'}</Text> : null}
                </View>
                <Text style={[styles.popupOptionText, { color: palette.text, fontWeight: '700' }]}>{resetOnAll ? section.allLabel : 'Select all'}</Text>
              </Pressable>
              {visibleOptions.map((option) => {
                const checked = section.selected.includes(option);
                const caption = sectionIndex === 0 ? optionCaptions?.get(option) : undefined;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole={section.single ? 'radio' : 'checkbox'}
                    accessibilityState={{ checked }}
                    onPress={() => toggle(option)}
                    style={[styles.popupOption, extraSections.length > 0 && styles.groupedOption, checked && { backgroundColor: isDark ? '#183449' : '#F0F9FF' }]}
                  >
                    <View style={[styles.checkSquare, section.single && styles.radioCircle, checked && styles.checkSquareOn]}>
                      {checked ? <Text style={styles.checkMark}>{section.single ? '•' : '✓'}</Text> : null}
                    </View>
                    <View style={extraSections.length > 0 ? styles.optionCopy : undefined}>
                      <Text style={[styles.popupOptionText, { color: palette.text }]}>{option}</Text>
                      {caption ? <Text style={[styles.optionCaption, { color: palette.muted }]}>{caption}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
              {search && visibleOptions.length === 0 ? (
                <Text style={[styles.noMatches, { color: palette.muted }]}>No matches.</Text>
              ) : null}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={[styles.popupDoneBtn, { backgroundColor: palette.primary }]}
            >
              <Text style={styles.popupDoneBtnText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuWrap: { marginBottom: 14, gap: 6 },
  menuLabel: { fontSize: 13, fontWeight: '700' },
  menuControl: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  menuValue: { flex: 1, fontSize: 14 },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  popupCard: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  popupCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  popupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginVertical: 2,
  },
  checkSquare: { width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  checkSquareOn: { backgroundColor: '#0284C7' },
  radioCircle: { borderRadius: 8 },
  checkMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  popupOptionText: {
    fontSize: 14,
  },
  popupDoneBtn: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  compactWrap: { marginBottom: 0 },
  compactControl: { minHeight: 42, width: 130, paddingHorizontal: 10 },
  sectionTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  sectionTab: { flexGrow: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8 },
  search: { minHeight: 42, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10, marginBottom: 6 },
  groupedOption: { justifyContent: 'flex-start', gap: 10, minHeight: 42 },
  optionCopy: { flex: 1, gap: 2 },
  optionCaption: { fontSize: 12 },
  noMatches: { padding: 12, fontSize: 13 },
});
