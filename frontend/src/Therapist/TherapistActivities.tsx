import { ListPagination, useListPagination } from '@/components/list-pagination';
import { matchesPracticeLanguage, PRACTICE_LANGUAGES } from '@/types/sentences';
import { AssignmentCalendar } from '@/components/assignment-calendar';
import { todayCalendarDate } from '@/data/calendar-date';
import { TherapistChecklistFilter } from '@/components/therapist/TherapistChecklistFilter';
// =============================================================================
// THERAPIST ACTIVITIES — Library, Creator/Editor, Detail & Assignment in one file
// Replaces: therapist-activities/pages, components, data
// =============================================================================

import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  BookOpen,
  Sparkles,
  Layers,
  Volume2,
  Video,
  Play,
  Edit3,
  Send,
  Save,
  Check,
  CheckCircle2,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon, PencilIcon, SearchIcon, TrashIcon } from '@/components/therapist/icons';
import {
  activityLanguages,
  levelColors,
  positionChoices,
  positionsFromLabel,
  practiceLevels,
  targetSounds,
  usesPhraseFields,
  wordPositions,
  isAssignmentDate,
  type Activity,
  type PracticeLevel,
  type TargetSound,
  type WordPosition,
} from '@/Therapist-modules/therapist-activities/data/activityData';
import { patientName } from '@/Therapist-modules/therapist-patients/data/samplePatients';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

// ─── Simple Audio Demo Card ──────────────────────────────────────────────────

function AudioCard({ title, meta }: { title: string; meta: string }) {
  const [playing, setPlaying] = useState(false);
  const bars = [8, 14, 10, 18, 12, 16, 9, 15];
  return (
    <Pressable accessibilityRole="button" onPress={() => setPlaying((c) => !c)} style={actStyles.audioCard}>
      <View style={actStyles.audioPlay}>
        <Text style={actStyles.audioPlayIcon}>{playing ? '❚❚' : '▶'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={actStyles.audioTitle}>{title}</Text>
        <Text style={actStyles.audioMeta}>{playing ? 'Playing demo…' : meta}</Text>
      </View>
      <View style={actStyles.audioBars}>
        {bars.map((height, i) => (
          <View key={i} style={[actStyles.audioBar, { height: playing ? height + 4 : height }]} />
        ))}
      </View>
    </Pressable>
  );
}

// ─── Reusable Field Dropdowns (Popup Style) ──────────────────────────────────

function FieldMenu({
  label,
  value,
  options,
  onChange,
  optionLabels,
}: {
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  optionLabels?: ReadonlyMap<string, string>;
}) {
  const { palette } = useTherapist();
  const [open, setOpen] = useState(false);
  return (
    <View style={actStyles.menuWrap}>
      {label ? <Text style={[actStyles.menuLabel, { color: palette.text }]}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[actStyles.menuControl, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <Text style={[actStyles.menuValue, { color: palette.text }]} numberOfLines={1}>
          {optionLabels?.get(value) ?? value}
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
        <Pressable style={actStyles.popupOverlay} onPress={() => setOpen(false)}>
          <Pressable style={[actStyles.popupCard, { backgroundColor: palette.card, borderColor: palette.line }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={[actStyles.popupHeader, { borderBottomColor: palette.line }]}>
              <Text style={[actStyles.popupTitle, { color: palette.text }]}>
                {label ? `Select ${label}` : 'Select Option'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={actStyles.popupCloseBtn}
                hitSlop={8}
              >
                <Text style={[actStyles.popupCloseText, { color: palette.faint }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const isSelected = option === value;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    style={[
                      actStyles.popupOption,
                      isSelected && { backgroundColor: '#E0F2FE' },
                    ]}
                  >
                    <Text
                      style={[
                        actStyles.popupOptionText,
                        { color: palette.text },
                        isSelected && { color: '#0284C7', fontWeight: '700' },
                      ]}
                    >
                      {optionLabels?.get(option) ?? option}
                    </Text>
                    {isSelected && <Text style={{ color: '#0284C7', fontWeight: '700', fontSize: 16 }}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── 1. Activity Library & Word Bank ─────────────────────────────────────────

const tabs = ['Unassigned', 'Assigned', 'Completed'] as const;
const activitiesPerPage = 8;

export function ActivityLibrary() {
  const { palette } = useTherapist();
  const { activities, beginNewActivity, wordBank } = useActivities();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof tabs)[number]>('Unassigned');
  const [filters, setFilters] = useState<PracticeLevel[]>([]);
  const [languageFilter, setLanguageFilter] = useState('All languages');
  const [section, setSection] = useState<'library' | 'bank'>('library');



  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activities.filter((activity) => {
      if (activity.status !== tab) return false;
      if (filters.length > 0 && !filters.includes(activity.level)) return false;
      if (!matchesPracticeLanguage(activity.language, languageFilter === 'All languages' ? undefined : languageFilter)) return false;
      if (!needle) return true;
      return `${activity.title} ${activity.sound} ${activity.level}`.toLowerCase().includes(needle);
    });
  }, [activities, filters, languageFilter, query, tab]);

  const pagination = useListPagination(visible.length, activitiesPerPage, JSON.stringify([query, tab, filters, languageFilter]));
  const pageActivities = visible.slice(pagination.start, pagination.end);

  if (section === 'bank') return <WordBank onOpenLibrary={() => setSection('library')} />;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content}>
      <Text style={[actStyles.kicker, { color: palette.faint }]}>PURPOSEFUL PRACTICE</Text>
      <Text style={[actStyles.title, { color: palette.primary }]}>The activity library.</Text>
      <Text style={[actStyles.subtitle, { color: palette.muted }]}>Build the small steps that make a big difference.</Text>

      <View style={[actStyles.sectionTabs, { borderBottomColor: palette.line }]}>
        <Text style={[actStyles.sectionTab, { color: palette.primary, borderBottomColor: palette.primary }]}>
          Activity Library
        </Text>
        <Pressable accessibilityRole="button" onPress={() => setSection('bank')}>
          <Text style={[actStyles.sectionTab, { color: palette.faint }]}>Word Bank ({wordBank.length})</Text>
        </Pressable>
      </View>

      <View style={actStyles.searchRow}>
        <TextInput
          value={query}
          onChangeText={(value) => setQuery(value)}
          placeholder="Search activities..."
          placeholderTextColor={palette.faint}
          style={[actStyles.search, { borderColor: palette.line, color: palette.text, backgroundColor: palette.card }]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            beginNewActivity();
            router.push('/therapist/activities/edit' as never);
          }}
          style={actStyles.createTaskButton}
        >
          <Text style={actStyles.createTaskPlus}>+</Text>
          <Text style={actStyles.createTaskButtonText}>Create a Task</Text>
        </Pressable>
      </View>

      <View style={actStyles.statusRow}>
        {tabs.map((item) => {
          const selected = item === tab;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setTab(item)}
              style={[actStyles.statusBtn, selected ? { backgroundColor: palette.primary } : { backgroundColor: '#F3F4F6' }]}
            >
              <Text style={[actStyles.statusBtnText, { color: selected ? '#FFFFFF' : palette.muted }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <TherapistChecklistFilter
        label="Practice level"
        options={practiceLevels}
        selected={filters}
        onChange={(value) => setFilters(value)}
        emptyLabel="All levels"
        allLabel="All levels"
      />
      <FieldMenu label="Language" options={['All languages', ...PRACTICE_LANGUAGES]} value={languageFilter} onChange={setLanguageFilter} />

      <View style={actStyles.grid}>
        {pageActivities.map((activity) => (
          <Pressable
            key={activity.id}
            accessibilityRole="button"
            onPress={() => router.push(`/therapist/activities/${activity.id}` as never)}
            style={[actStyles.card, { borderColor: palette.line, backgroundColor: palette.card }]}
          >
            <View style={[actStyles.swatch, { backgroundColor: levelColors[activity.level] }]}>
              <Text style={actStyles.sound}>{activity.sound}</Text>
              <Text style={actStyles.wave}>≋</Text>
            </View>
            <View style={actStyles.cardBody}>
              <View style={actStyles.levelPill}>
                <Text style={actStyles.levelText}>{activity.level}</Text>
              </View>
              <Text style={[actStyles.cardTitle, { color: palette.text }]}>{activity.title}</Text>
              <Text style={[actStyles.cardMeta, { color: palette.faint }]}>{activity.language} · Therapist-created</Text>
              <Text style={[actStyles.viewLink, { color: palette.muted }]}>View activity ›</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <ListPagination {...pagination} total={visible.length} noun="activities" accent={palette.primary} muted={palette.muted} border={palette.line} surface={palette.card} />
      {visible.length === 0 ? <Text style={[actStyles.empty, { color: palette.muted }]}>No activities in this view.</Text> : null}
    </ScrollView>
  );
}

// ─── Word Bank View ──────────────────────────────────────────────────────────

function WordBank({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const { palette, isDark } = useTherapist();
  const { wordBank, addBankWord, removeBankWord } = useActivities();
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sounds, setSounds] = useState<TargetSound[]>([]);
  const [positions, setPositions] = useState<WordPosition[]>([]);
  const [wordBankLanguage, setWordBankLanguage] = useState('All languages');
  const [word, setWord] = useState('');
  const [sound, setSound] = useState<TargetSound>('/r/');
  const [position, setPosition] = useState<WordPosition>('Initial');
  const [language, setLanguage] = useState<string>('English');
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' | 'info') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3000);
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return wordBank.filter((item) => {
      if (sounds.length > 0 && !sounds.includes(item.sound)) return false;
      if (positions.length > 0 && !positions.includes(item.position)) return false;
      if (!matchesPracticeLanguage(item.language, wordBankLanguage === 'All languages' ? undefined : wordBankLanguage)) return false;
      if (!needle) return true;
      return item.text.toLowerCase().includes(needle);
    });
  }, [wordBankLanguage, positions, query, sounds, wordBank]);

  const toggle = <T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const pagination = useListPagination(visible.length, 10, JSON.stringify([query, sounds, positions, wordBankLanguage]));

  const filterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    sounds.forEach((s) => {
      chips.push({
        key: `sound-${s}`,
        label: `Sound: ${s}`,
        clear: () => setSounds((curr) => curr.filter((x) => x !== s)),
      });
    });
    positions.forEach((pos) => {
      chips.push({
        key: `pos-${pos}`,
        label: `Position: ${pos}`,
        clear: () => setPositions((curr) => curr.filter((x) => x !== pos)),
      });
    });
    if (wordBankLanguage !== 'All languages') {
      chips.push({ key: 'language', label: 'Language: ' + wordBankLanguage, clear: () => setWordBankLanguage('All languages') });
    }
    return chips;
  }, [sounds, positions, wordBankLanguage]);

  const save = () => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) {
      showNotice('Please enter a target word.', 'error');
      return;
    }
    const exists = wordBank.some((w) => w.text.toLowerCase() === trimmed);
    if (exists) {
      showNotice(`"${trimmed}" is already in the word bank.`, 'error');
      return;
    }
    addBankWord({ id: `bank-${Date.now()}`, text: trimmed, sound, position, language });
    setWord('');
    setAdding(false);
    showNotice(`Added "${trimmed}" to Word Bank.`, 'success');
  };

  const handleRemove = (id: string, wordText: string) => {
    removeBankWord(id);
    showNotice(`Removed "${wordText}" from Word Bank.`, 'info');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content} keyboardShouldPersistTaps="handled">
      <Text style={[actStyles.kicker, { color: palette.faint }]}>PURPOSEFUL PRACTICE</Text>
      <Text style={[actStyles.title, { color: palette.primary }]}>The word bank.</Text>
      <Text style={[actStyles.subtitle, { color: palette.muted }]}>Reusable targets organized by sound, position and language.</Text>

      <View style={[actStyles.sectionTabs, { borderBottomColor: palette.line }]}>
        <Pressable accessibilityRole="button" onPress={onOpenLibrary}>
          <Text style={[actStyles.sectionTab, { color: palette.faint }]}>Activity Library</Text>
        </Pressable>
        <Text style={[actStyles.sectionTab, { color: palette.primary, borderBottomColor: palette.primary }]}>
          Word Bank ({wordBank.length})
        </Text>
      </View>

      {/* Word Bank Search, Add & Filter Row */}
      <View style={actStyles.wbSearchRow}>
        <View style={[actStyles.bankSearchBox, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a specific word..."
            placeholderTextColor={palette.faint}
            style={[actStyles.searchInput, { color: palette.text }]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setAdding((c) => !c);
            setEditing(false);
          }}
          style={actStyles.wbAddBtn}
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={actStyles.wbAddBtnText}>Add a word</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter word bank"
          onPress={() => setFiltersOpen((c) => !c)}
          style={[
            actStyles.wbFilterBtn,
            { borderColor: palette.line, backgroundColor: palette.card },
            (filtersOpen || filterChips.length > 0) && actStyles.wbFilterBtnActive,
          ]}
        >
          <Filter size={16} color={filtersOpen || filterChips.length > 0 ? '#0284C7' : palette.muted} />
        </Pressable>
      </View>

      {/* Filter Panel */}
      {filtersOpen ? (
        <View style={[actStyles.wbFilterPanel, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <Text style={[actStyles.wbFilterHeading, { color: palette.muted }]}>Sound</Text>
          <View style={actStyles.wbFilterOptionsWrap}>
            {targetSounds.map((item) => {
              const isSel = sounds.includes(item);
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() => toggle(item, sounds, setSounds)}
                  style={[
                    actStyles.wbChoicePill,
                    { borderColor: palette.line, backgroundColor: palette.card },
                    isSel && actStyles.wbChoicePillActive,
                  ]}
                >
                  <Text style={[actStyles.wbChoicePillText, isSel && actStyles.wbChoicePillTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[actStyles.wbFilterHeading, { color: palette.muted, marginTop: 10 }]}>Position</Text>
          <View style={actStyles.wbFilterOptionsWrap}>
            {wordPositions.map((pos) => {
              const isSel = positions.includes(pos);
              return (
                <Pressable
                  key={pos}
                  accessibilityRole="button"
                  onPress={() => toggle(pos, positions, setPositions)}
                  style={[
                    actStyles.wbChoicePill,
                    { borderColor: palette.line, backgroundColor: palette.card },
                    isSel && actStyles.wbChoicePillActive,
                  ]}
                >
                  <Text style={[actStyles.wbChoicePillText, isSel && actStyles.wbChoicePillTextActive]}>{pos}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[actStyles.wbFilterHeading, { color: palette.muted, marginTop: 10 }]}>Language</Text>
          <View style={actStyles.wbFilterOptionsWrap}>
            {['All languages', ...PRACTICE_LANGUAGES].map((lang) => {
              const isSel = wordBankLanguage === lang;
              return (
                <Pressable
                  key={lang}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel }}
                  onPress={() => setWordBankLanguage(lang)}
                  style={[
                    actStyles.wbChoicePill,
                    { borderColor: palette.line, backgroundColor: palette.card },
                    isSel && actStyles.wbChoicePillActive,
                  ]}
                >
                  <Text style={[actStyles.wbChoicePillText, isSel && actStyles.wbChoicePillTextActive]}>{lang}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <View style={actStyles.wbChipsRow}>
          {filterChips.map((chip) => (
            <Pressable
              key={chip.key}
              style={[
                actStyles.wbChip,
                { borderColor: isDark ? '#0284C7' : '#BAE6FD', backgroundColor: isDark ? '#082F49' : '#F0F9FF' },
              ]}
              onPress={chip.clear}
            >
              <Text style={[actStyles.wbChipLabel, { color: isDark ? '#38BDF8' : '#0284C7' }]}>{chip.label}</Text>
              <X size={12} color="#0284C7" style={{ marginLeft: 4 }} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Notice Banner */}
      {notice ? (
        <View
          style={[
            actStyles.wbNotice,
            notice.type === 'error'
              ? { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }
              : notice.type === 'success'
              ? { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }
              : { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' },
          ]}
        >
          <CheckCircle2
            size={15}
            color={notice.type === 'error' ? '#EF4444' : notice.type === 'success' ? '#16A34A' : '#0284C7'}
          />
          <Text
            style={[
              actStyles.wbNoticeText,
              { color: notice.type === 'error' ? '#DC2626' : notice.type === 'success' ? '#15803D' : '#0369A1' },
            ]}
          >
            {notice.text}
          </Text>
        </View>
      ) : null}

      {/* Add a Word Entry Form */}
      {adding && (
        <View style={[actStyles.wbAddForm, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <Text style={[actStyles.wbAddFormTitle, { color: palette.text }]}>Add a Word Bank Entry</Text>

          <Text style={[actStyles.wbFormLabel, { color: palette.muted }]}>Word</Text>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder="Target word (e.g. rainbow)"
            placeholderTextColor={palette.faint}
            style={[actStyles.wbFormInput, { borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
          />

          <Text style={[actStyles.wbFormLabel, { color: palette.muted }]}>Sound</Text>
          <View style={actStyles.wbFilterOptionsWrap}>
            {targetSounds.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSound(s)}
                style={[
                  actStyles.wbChoicePill,
                  { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
                  sound === s && actStyles.wbChoicePillActive,
                ]}
              >
                <Text style={[actStyles.wbChoicePillText, sound === s && actStyles.wbChoicePillTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[actStyles.wbFormLabel, { color: palette.muted, marginTop: 10 }]}>Position</Text>
          <View style={actStyles.wbFilterOptionsWrap}>
            {wordPositions.map((pos) => (
              <Pressable
                key={pos}
                onPress={() => setPosition(pos)}
                style={[
                  actStyles.wbChoicePill,
                  { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
                  position === pos && actStyles.wbChoicePillActive,
                ]}
              >
                <Text style={[actStyles.wbChoicePillText, position === pos && actStyles.wbChoicePillTextActive]}>{pos}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[actStyles.wbFormLabel, { color: palette.muted, marginTop: 10 }]}>Language</Text>
          <View style={actStyles.wbFilterOptionsWrap}>
            {['English', 'Tagalog'].map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[
                  actStyles.wbChoicePill,
                  { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
                  language === lang && actStyles.wbChoicePillActive,
                ]}
              >
                <Text style={[actStyles.wbChoicePillText, language === lang && actStyles.wbChoicePillTextActive]}>{lang}</Text>
              </Pressable>
            ))}
          </View>

          <View style={actStyles.wbFormActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setWord('');
                setAdding(false);
              }}
              style={[actStyles.wbCancelWordBtn, { borderColor: palette.line, backgroundColor: palette.card }]}
            >
              <Text style={[actStyles.wbCancelWordBtnText, { color: palette.text }]}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={save} style={actStyles.wbSaveWordBtn}>
              <Text style={actStyles.wbSaveWordBtnText}>Save Target</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Word Bank List Header */}
      <View style={actStyles.wbListHeader}>
        <Text style={[actStyles.wbListTitle, { color: palette.text }]}>Word Bank List ({visible.length})</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Finish editing word bank' : 'Edit word bank'}
          onPress={() => setEditing((curr) => !curr)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[actStyles.wbEditModeBtn, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          {editing ? (
            <Check size={18} color="#0284C7" />
          ) : (
            <Pencil size={16} color={palette.muted} />
          )}
        </Pressable>
      </View>

      {/* Word Bank List */}
      <View style={[actStyles.wbListCard, { borderColor: palette.line, backgroundColor: palette.card }]}>
        {visible.slice(pagination.start, pagination.end).map((item, index) => (
          <View
            key={item.id}
            style={[
              actStyles.wbListRow,
              index > 0 && { borderTopWidth: 1, borderTopColor: palette.line },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[actStyles.wbWordText, { color: palette.text }]}>{item.text}</Text>
              <View style={[actStyles.wbSoundBadgeWrap, { backgroundColor: isDark ? '#1E3A5F' : '#F1F5F9' }]}>
                <Text style={[actStyles.wbSoundBadgeText, { color: isDark ? '#7DD3FC' : '#0369A1' }]}>{item.sound}</Text>
              </View>
            </View>

            {editing ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.text}`}
                onPress={() => handleRemove(item.id, item.text)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={actStyles.wbDeleteBtn}
              >
                <Trash2 size={16} color="#EF4444" />
              </Pressable>
            ) : (
              <View style={[actStyles.wbPositionBadge, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Text style={[actStyles.wbPositionBadgeText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>{item.position}</Text>
              </View>
            )}
          </View>
        ))}
        {visible.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: palette.muted, fontSize: 13 }}>No words match your search or filters.</Text>
          </View>
        )}
      </View>
    <ListPagination {...pagination} total={visible.length} noun="words" accent={palette.primary} muted={palette.muted} border={palette.line} surface={palette.card} />
    </ScrollView>
  );
}

// ─── 2. Activity Detail ──────────────────────────────────────────────────────

export function ActivityDetail({ activityId }: { activityId: string }) {
  const navigation = useNavigation();
  const { palette, isDark } = useTherapist();
  const { activities, beginEdit } = useActivities();
  const activity = activities.find((item) => item.id === activityId);

  if (!activity) {
    return <Text style={{ color: palette.muted, padding: 20 }}>This activity is no longer in the library.</Text>;
  }

  const totalWords = activity.words.length;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/therapist/activities' as never);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content}>
      {/* ── Top Header Navigation ── */}
      <View style={actStyles.topNavRow}>
        <Pressable
          accessibilityLabel="Back to library"
          onPress={handleBack}
          style={[actStyles.detailBack, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <ChevronLeftIcon color={palette.text} size={18} />
        </Pressable>
        <Text style={[actStyles.topNavTitle, { color: palette.muted }]}>Activity Details</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Hero Activity Card ── */}
      <View style={[actStyles.heroCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={actStyles.heroTopRow}>
          <View style={[actStyles.heroSoundBadge, { backgroundColor: levelColors[activity.level] || '#E0F2FE' }]}>
            <Text style={actStyles.heroSoundText}>{activity.sound}</Text>
            <Text style={actStyles.heroSoundWave}>≋</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              <View style={[actStyles.pillTag, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[actStyles.pillTagText, { color: '#0284C7' }]}>{activity.level}</Text>
              </View>
              <View style={[actStyles.pillTag, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                <Text style={[actStyles.pillTagText, { color: isDark ? '#E2E8F0' : '#475569' }]}>{activity.language}</Text>
              </View>
            </View>
            <Text style={[actStyles.heroTitle, { color: palette.text }]}>{activity.title}</Text>
          </View>
        </View>

        <View style={[actStyles.heroDivider, { backgroundColor: palette.line }]} />

        <View style={actStyles.heroMetaRow}>
          <View style={actStyles.heroMetaItem}>
            <Text style={actStyles.heroMetaLabel}>Position</Text>
            <Text style={[actStyles.heroMetaVal, { color: palette.text }]}>{activity.positions[0] || 'Initial'}</Text>
          </View>
          <View style={[actStyles.heroMetaDivider, { backgroundColor: palette.line }]} />
          <View style={actStyles.heroMetaItem}>
            <Text style={actStyles.heroMetaLabel}>Sound Target</Text>
            <Text style={[actStyles.heroMetaVal, { color: '#0284C7' }]}>{activity.sound}</Text>
          </View>
          <View style={[actStyles.heroMetaDivider, { backgroundColor: palette.line }]} />
          <View style={actStyles.heroMetaItem}>
            <Text style={actStyles.heroMetaLabel}>Word Targets</Text>
            <Text style={[actStyles.heroMetaVal, { color: palette.text }]}>{totalWords} words</Text>
          </View>
        </View>
      </View>

      {/* ── Instructions Card ── */}
      <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={actStyles.infoCardHeader}>
          <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
            <BookOpen size={16} color="#0284C7" />
          </View>
          <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Instructions</Text>
        </View>
        <Text style={[actStyles.infoCardBody, { color: palette.muted }]}>{activity.instructions}</Text>
      </View>

      {/* ── Articulatory Guide Card ── */}
      <View style={[actStyles.infoCard, { backgroundColor: isDark ? '#261C14' : '#FEFCE8', borderColor: isDark ? '#78350F' : '#FEF08A' }]}>
        <View style={actStyles.infoCardHeader}>
          <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF08A' }]}>
            <Sparkles size={16} color={isDark ? '#FCD34D' : '#B45309'} />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[actStyles.infoCardTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>Articulatory Guide</Text>
            <View style={[actStyles.guideBadge, { backgroundColor: isDark ? '#451A03' : '#FEF08A' }]}>
              <Text style={[actStyles.guideBadgeText, { color: isDark ? '#FDE68A' : '#B45309' }]}>Clinical Guidance</Text>
            </View>
          </View>
        </View>
        <Text style={[actStyles.infoCardBody, { color: isDark ? '#FCD34D' : '#78350F' }]}>{activity.guide}</Text>
      </View>

      {/* ── Practice Content Card ── */}
      <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={actStyles.infoCardHeader}>
          <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
            <Layers size={16} color="#0284C7" />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Practice Content</Text>
            <Text style={{ fontSize: 12, color: palette.faint, fontWeight: '600' }}>{totalWords} targets</Text>
          </View>
        </View>

        <PracticeContent activity={activity} />
      </View>

      {/* ── Preview Audio Model Card ── */}
      <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={actStyles.infoCardHeader}>
          <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
            <Volume2 size={16} color="#0284C7" />
          </View>
          <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Audio Pronunciation Model</Text>
        </View>
        <AudioCard title="Pronunciation Model" meta="Demo Playback • 0:08" />
      </View>

      {/* ── Visual Material Card ── */}
      <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={actStyles.infoCardHeader}>
          <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
            <Video size={16} color="#0284C7" />
          </View>
          <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Visual Material</Text>
        </View>
        <View style={actStyles.videoCardWrap}>
          <View style={actStyles.videoPlayCircle}>
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
          </View>
          <View style={actStyles.videoOverlayBottom}>
            <Text style={actStyles.videoLabelTitle}>{activity.visualName || 'Visual Demonstration Video'}</Text>
            <Text style={actStyles.videoLabelSubtitle}>High-Definition Mouth & Tongue Animation</Text>
          </View>
          <View style={actStyles.videoTagBadge}>
            <Text style={actStyles.videoTagBadgeText}>HD Demonstration</Text>
          </View>
        </View>
      </View>

      {/* ── Bottom Action Buttons ── */}
      {activity.assignments?.length ? (
        <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Assigned Students</Text>
          {activity.assignments.map((assignment) => (
            <View key={assignment.studentId}>
              <Text style={[actStyles.infoCardBody, { color: palette.text }]}>{assignment.studentName} · Due {assignment.dueDate}</Text>
              <Text style={[actStyles.infoCardBody, { color: palette.muted }]}>{assignment.instructions}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={actStyles.bottomActionBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            beginEdit(activity.id);
            router.push('/therapist/activities/edit' as never);
          }}
          style={[actStyles.actionBtnSecondary, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <Edit3 size={16} color={palette.text} />
          <Text style={[actStyles.actionBtnSecondaryText, { color: palette.text }]}>Edit Activity</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/therapist/activities/assign?id=${activity.id}` as never)}
          style={actStyles.actionBtnPrimary}
        >
          <Send size={16} color="#FFFFFF" />
          <Text style={actStyles.actionBtnPrimaryText}>Assign Activity</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function PracticeContent({ activity }: { activity: Activity }) {
  const { palette, isDark } = useTherapist();
  const phraseMode = usesPhraseFields(activity.level);
  return (
    <View style={{ gap: 12, marginTop: 4 }}>
      {wordPositions.map((position) => {
        const words = activity.words.filter((word) => word.position === position);
        return (
          <View key={position} style={[actStyles.posBlockCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: palette.line }]}>
            <View style={actStyles.posBlockHead}>
              <View style={[actStyles.posBadge, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <Text style={[actStyles.posBadgeText, { color: isDark ? '#F8FAFC' : '#334155' }]}>{position}</Text>
              </View>
              <Text style={{ fontSize: 12, color: palette.faint, fontWeight: '600' }}>
                {words.length} {words.length === 1 ? 'target' : 'targets'}
              </Text>
            </View>

            {words.length === 0 ? (
              <Text style={[actStyles.noTargetsText, { color: palette.faint }]}>No targets in this position.</Text>
            ) : (
              <View style={actStyles.chipGroup}>
                {words.map((word) => (
                  <View key={word.id} style={[actStyles.practiceChip, { backgroundColor: palette.card, borderColor: '#BAE6FD' }]}>
                    <Volume2 size={12} color="#0284C7" />
                    <Text style={actStyles.practiceChipText}>{word.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {phraseMode ? words.map((word) => (word.phrase ? <Text key={`${word.id}-line`} style={{ color: palette.muted, fontSize: 13, marginTop: 4 }}>{word.phrase}</Text> : null)) : null}
          </View>
        );
      })}
      {phraseMode ? activity.customLines.map((line, index) => <Text key={index} style={{ color: palette.muted, fontSize: 13, marginTop: 4 }}>{line}</Text>) : null}
    </View>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  const { palette } = useTherapist();
  return (
    <View style={actStyles.sectionBlock}>
      <Text style={[actStyles.sectionHead, { color: palette.text }]}>{title}</Text>
      <Text style={[actStyles.sectionBody, { color: palette.muted }]}>{body}</Text>
    </View>
  );
}

// ─── 3. Activity Editor / Creator ───────────────────────────────────────────

const steps = [
  { key: 'focus', label: 'Clinical focus' },
  { key: 'content', label: 'Activity content' },
  { key: 'preview', label: 'Preview & save' },
] as const;

export function ActivityEditor() {
  const navigation = useNavigation();
  const { palette, isDark, showActionNotice } = useTherapist();
  const { draft, setDraft, saveActivity, wordBank, addBankWord } = useActivities();
  const [error, setError] = useState('');
  const [bankQuery, setBankQuery] = useState('');
  const phraseMode = usesPhraseFields(draft.level);
  const positions = positionsFromLabel(draft.positionLabel);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/therapist/activities' as never);
    }
  };

  const bankResults = wordBank.filter(
    (word) => draft.selectedSounds.includes(word.sound) && word.text.includes(bankQuery.trim().toLowerCase()),
  );
  const selectedWords = wordBank.filter((word) => draft.selectedWordIds.includes(word.id));

  const continueFocus = () => {
    if (!draft.title.trim()) {
      setError('Please enter an activity title.');
      return;
    }
    if (!draft.sound) {
      setError('Please select a target sound.');
      return;
    }
    if (positions.length === 0) {
      setError('Please select at least one word position.');
      return;
    }
    setError('');
    setDraft({ step: 'content' });
  };

  const continueContent = () => {
    if (draft.origin === 'bank' && draft.selectedWordIds.length === 0) {
      setError('Please select at least one word from the word bank.');
      return;
    }
    if (draft.origin === 'custom' && draft.customWords.length === 0) {
      setError('Please add at least one custom word.');
      return;
    }
    setError('');
    setDraft({ step: 'preview' });
  };

  const saveWord = () => {
    const text = draft.customInput.trim().toLowerCase();
    if (!text) {
      setError('Please enter a custom word.');
      return;
    }
    if (draft.customWords.some((item) => item.text === text)) {
      setError('Word already added.');
      return;
    }
    const word = { id: `custom-${Date.now()}`, text, sound: draft.customSound, position: draft.customPosition, phrase: '' };
    setDraft({
      customWords: [...draft.customWords, word],
      customInput: '',
    });
    if (draft.saveToBank) addBankWord(word);
    setError('');
  };

  const toggleWord = (id: string, position: WordPosition) => {
    const selected = draft.selectedWordIds.includes(id);
    if (!selected) {
      const count = selectedWords.filter((word) => word.position === position).length;
      if (count >= 5) return;
    }
    setDraft({
      selectedWordIds: selected ? draft.selectedWordIds.filter((item) => item !== id) : [...draft.selectedWordIds, id],
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content} keyboardShouldPersistTaps="handled">
      {/* ── Top Header Navigation ── */}
      <View style={actStyles.topNavRow}>
        <Pressable
          accessibilityLabel="Back"
          onPress={handleBack}
          style={[actStyles.detailBack, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <ChevronLeftIcon color={palette.text} size={18} />
        </Pressable>
        <Text style={[actStyles.topNavTitle, { color: palette.text }]}>
          {draft.id ? 'Edit Activity' : 'Create New Activity'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Stepper Card ── */}
      <View style={[actStyles.stepperCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={actStyles.stepperRow}>
          {steps.map((step, index) => {
            const active = draft.step === step.key;
            const completed =
              (draft.step === 'content' && index === 0) ||
              (draft.step === 'preview' && index < 2);
            return (
              <Pressable
                key={step.key}
                onPress={() => { setError(''); setDraft({ step: step.key }); }}
                style={[actStyles.stepItem, { flex: 1 }]}
              >
                <View style={actStyles.stepCircleRow}>
                  <View style={[
                    actStyles.stepCircle,
                    active && actStyles.stepCircleActive,
                    completed && actStyles.stepCircleCompleted,
                  ]}>
                    <Text style={[
                      actStyles.stepCircleText,
                      (active || completed) && { color: '#FFFFFF' }
                    ]}>
                      {completed ? '✓' : index + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      actStyles.stepLabel,
                      { color: active ? '#0284C7' : completed ? palette.text : palette.faint },
                      active && { fontWeight: '700' }
                    ]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                </View>
                <View style={[
                  actStyles.stepProgressBar,
                  { backgroundColor: active || completed ? '#0284C7' : (isDark ? '#334155' : '#E2E8F0') }
                ]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── STEP 1: Clinical Focus ── */}
      {draft.step === 'focus' ? (
        <View style={{ gap: 14 }}>
          {/* Card 1: Basic Information */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <BookOpen size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Basic Information</Text>
            </View>

            <View style={{ gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Activity Title</Text>
                <TextInput
                  value={draft.title}
                  onChangeText={(title) => { setError(''); setDraft({ title }); }}
                  placeholder="e.g. Sunny Sounds"
                  placeholderTextColor={palette.faint}
                  style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                />
              </View>

              <View style={actStyles.editorRow}>
                <FieldMenu
                  label="Target Sound"
                  value={draft.sound}
                  options={targetSounds}
                  onChange={(s) => setDraft({ sound: s as TargetSound, selectedSounds: [s as TargetSound] })}
                />
                <FieldMenu
                  label="Practice Level"
                  value={draft.level}
                  options={practiceLevels}
                  onChange={(l) => setDraft({ level: l as typeof draft.level })}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Word Position (choose one or more)</Text>
                <View style={actStyles.choiceRow}>
                  {(['Initial', 'Medial', 'Final'] as const).map((pos) => {
                    const selected = positions.includes(pos);
                    return (
                      <Pressable
                        key={pos}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        onPress={() => {
                          const next = selected ? positions.filter((p) => p !== pos) : [...positions, pos];
                          const label =
                            next.length === 3
                              ? 'All (Initial, Medial, Final)'
                              : next.length === 2
                              ? next.includes('Initial') && next.includes('Medial')
                                ? 'Initial & Medial'
                                : next.includes('Initial') && next.includes('Final')
                                ? 'Initial & Final'
                                : 'Medial & Final'
                              : next.length === 1
                              ? next[0]
                              : 'Initial';
                          setDraft({ positionLabel: label as any });
                        }}
                        style={[
                          actStyles.posPill,
                          selected ? actStyles.posPillSelected : { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
                        ]}
                      >
                        <Text style={[actStyles.posPillText, selected && actStyles.posPillTextSelected]}>
                          {selected ? '✓ ' : ''}{pos}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Language</Text>
                <View style={[actStyles.langSegmentControl, { borderColor: palette.line }]}>
                  {(['English', 'Tagalog'] as const).map((lang) => (
                    <Pressable
                      key={lang}
                      accessibilityRole="button"
                      onPress={() => setDraft({ language: lang })}
                      style={[actStyles.langSegmentBtn, draft.language === lang && actStyles.langSegmentBtnActive]}
                    >
                      <Text style={[actStyles.langSegmentText, draft.language === lang && actStyles.langSegmentTextActive]}>
                        {lang}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Card 2: Clinical Instructions & Guidance */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Sparkles size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Instructions & Articulatory Guide</Text>
            </View>

            <View style={{ gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Instructions for Student/Facilitator</Text>
                <TextInput
                  value={draft.instructions}
                  onChangeText={(instructions) => setDraft({ instructions })}
                  placeholder="e.g. Listen to the model. Say each target slowly, then try it on your own."
                  placeholderTextColor={palette.faint}
                  multiline
                  style={[actStyles.editorInput, { minHeight: 74, paddingVertical: 10, borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', textAlignVertical: 'top' }]}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Articulatory Guide</Text>
                <TextInput
                  value={draft.guide}
                  onChangeText={(guide) => setDraft({ guide })}
                  placeholder="e.g. Keep the tongue tip behind the teeth and send the air forward."
                  placeholderTextColor={palette.faint}
                  multiline
                  style={[actStyles.editorInput, { minHeight: 74, paddingVertical: 10, borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', textAlignVertical: 'top' }]}
                />
              </View>
            </View>
          </View>

          {error ? <Text style={actStyles.errorText}>{error}</Text> : null}

          <View style={actStyles.bottomActionBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!draft.title.trim()) { setError('Enter an activity title.'); return; }
                saveActivity();
                showActionNotice('Activity draft saved.');
                router.push('/therapist/activities' as never);
              }}
              style={[actStyles.actionBtnSecondary, { borderColor: palette.line, backgroundColor: palette.card }]}
            >
              <Text style={[actStyles.actionBtnSecondaryText, { color: palette.text }]}>Save Draft</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={continueFocus} style={actStyles.actionBtnPrimary}>
              <Text style={actStyles.actionBtnPrimaryText}>Next: Content ›</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* ── STEP 2: Activity Content ── */}
      {draft.step === 'content' ? (
        <View style={{ gap: 14 }}>
          {/* Card 1: Target Vocabulary Selection */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Layers size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Target Vocabulary</Text>
            </View>

            {/* Segmented Origin Toggle */}
            <View style={[actStyles.langSegmentControl, { borderColor: palette.line, marginBottom: 14 }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => { setError(''); setDraft({ origin: 'bank' }); }}
                style={[actStyles.langSegmentBtn, draft.origin === 'bank' && actStyles.langSegmentBtnActive]}
              >
                <Text style={[actStyles.langSegmentText, draft.origin === 'bank' && actStyles.langSegmentTextActive]}>
                  Word Bank
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => { setError(''); setDraft({ origin: 'custom' }); }}
                style={[actStyles.langSegmentBtn, draft.origin === 'custom' && actStyles.langSegmentBtnActive]}
              >
                <Text style={[actStyles.langSegmentText, draft.origin === 'custom' && actStyles.langSegmentTextActive]}>
                  Custom Words
                </Text>
              </Pressable>
            </View>

            {draft.origin === 'bank' ? (
              <>
                <View style={actStyles.countersRow}>
                  {wordPositions.map((pos) => {
                    const count = selectedWords.filter((w) => w.position === pos).length;
                    const included = positions.includes(pos);
                    return (
                      <View key={pos} style={[actStyles.counterBox, { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }, included && count > 0 && { borderColor: '#38BDF8', backgroundColor: isDark ? '#082F49' : '#F0F9FF' }]}>
                        <Text style={[actStyles.counterLabel, { color: palette.muted }]}>{pos}</Text>
                        <Text style={[actStyles.counterVal, { color: included && count > 0 ? '#0284C7' : palette.text }]}>
                          {included ? count : 0}/5
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={{ marginTop: 12, marginBottom: 8 }}>
                  <TherapistChecklistFilter label="Target Sound" options={targetSounds} selected={draft.selectedSounds} onChange={(s) => setDraft({ selectedSounds: s as TargetSound[] })} />
                </View>

                <TextInput
                  value={bankQuery}
                  onChangeText={setBankQuery}
                  placeholder="Search existing from word bank..."
                  placeholderTextColor={palette.faint}
                  style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', marginBottom: 12 }]}
                />

                <View style={[actStyles.bankPicker, { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', maxHeight: 180 }]}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {bankResults.map((w) => {
                      const checked = draft.selectedWordIds.includes(w.id);
                      return (
                        <Pressable key={w.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => toggleWord(w.id, w.position)} style={actStyles.bankPickRow}>
                          <View style={[actStyles.checkSquare, checked && actStyles.checkSquareOn]}>{checked ? <Text style={actStyles.checkMark}>✓</Text> : null}</View>
                          <Text style={{ color: palette.text, fontSize: 14 }}>{w.text}</Text>
                          <View style={[actStyles.posBadge, { backgroundColor: isDark ? '#334155' : '#E2E8F0', marginLeft: 'auto' }]}>
                            <Text style={[actStyles.posBadgeText, { color: isDark ? '#F8FAFC' : '#475569', fontSize: 10 }]}>{w.position}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={[actStyles.chipGroup, { marginTop: 12 }]}>
                  {selectedWords.map((w) => (
                    <View key={w.id} style={[actStyles.editorChip, { backgroundColor: isDark ? '#082F49' : '#F0F9FF', borderColor: '#BAE6FD' }]}>
                      <Text style={actStyles.editorChipText}>{w.text}</Text>
                      <Pressable onPress={() => toggleWord(w.id, w.position)} hitSlop={6}><Text style={actStyles.editorChipX}>×</Text></Pressable>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <TextInput
                    value={draft.customInput}
                    onChangeText={(customInput) => { setError(''); setDraft({ customInput }); }}
                    placeholder="Type custom word here..."
                    placeholderTextColor={palette.faint}
                    style={[actStyles.editorInput, { flex: 1, borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  />
                  <Pressable accessibilityRole="button" onPress={saveWord} style={[actStyles.detailPrimary, { paddingHorizontal: 16, height: 46 }]}>
                    <Text style={actStyles.detailPrimaryText}>ADD</Text>
                  </Pressable>
                </View>

                <View style={[actStyles.chipGroup, { marginBottom: 14 }]}>
                  {draft.customWords.map((w) => (
                    <View key={w.id} style={[actStyles.editorChip, { backgroundColor: isDark ? '#082F49' : '#F0F9FF', borderColor: '#BAE6FD' }]}>
                      <Text style={actStyles.editorChipText}>{w.text}</Text>
                      <Pressable onPress={() => setDraft({ customWords: draft.customWords.filter((i) => i.id !== w.id) })} hitSlop={6}><Text style={actStyles.editorChipX}>×</Text></Pressable>
                    </View>
                  ))}
                </View>

                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.saveToBank }} onPress={() => setDraft({ saveToBank: !draft.saveToBank })} style={[actStyles.radioRow, { marginBottom: 12 }]}>
                  <View style={[actStyles.checkSquare, draft.saveToBank && actStyles.checkSquareOn]}>{draft.saveToBank ? <Text style={actStyles.checkMark}>✓</Text> : null}</View>
                  <Text style={{ color: palette.text, fontSize: 13, fontWeight: '600' }}>Save to Word Bank</Text>
                </Pressable>

                <View style={actStyles.editorRow}>
                  <FieldMenu label="Target Sound" value={draft.customSound} options={targetSounds} onChange={(s) => setDraft({ customSound: s as TargetSound })} />
                  <FieldMenu label="Position" value={draft.customPosition} options={wordPositions} onChange={(p) => setDraft({ customPosition: p as WordPosition })} />
                </View>
              </>
            )}
          </View>

          {/* Card 2: Media & Demonstrations */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Video size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Visual Material</Text>
            </View>

            <Pressable accessibilityRole="button" onPress={() => pickVisual((visualName) => setDraft({ visualName }))} style={[actStyles.uploadBox, { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', marginBottom: 14 }]}>
              <Video size={28} color="#0284C7" />
              <Text style={{ color: palette.text, fontWeight: '700', fontSize: 14 }}>{draft.visualName || 'Upload or browse files here'}</Text>
              <Text style={{ color: palette.faint, fontSize: 12 }}>MP4 or MOV, up to 20 MB per file</Text>
            </Pressable>

            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Volume2 size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Audio Pronunciation Model</Text>
            </View>
            <AudioCard title="Sample Audio Model" meta="Demo Playback • 0:08" />
          </View>

          {error ? <Text style={actStyles.errorText}>{error}</Text> : null}

          <View style={actStyles.bottomActionBar}>
            <Pressable accessibilityRole="button" onPress={() => { setError(''); setDraft({ step: 'focus' }); }} style={[actStyles.actionBtnSecondary, { borderColor: palette.line, backgroundColor: palette.card }]}>
              <Text style={[actStyles.actionBtnSecondaryText, { color: palette.text }]}>‹ Back</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={continueContent} style={actStyles.actionBtnPrimary}>
              <Text style={actStyles.actionBtnPrimaryText}>Next: Preview ›</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* ── STEP 3: Preview & Save ── */}
      {draft.step === 'preview' ? (
        <View style={{ gap: 14 }}>
          {/* Hero Card */}
          <View style={[actStyles.heroCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.heroTopRow}>
              <View style={[actStyles.heroSoundBadge, { backgroundColor: levelColors[draft.level] || '#E0F2FE' }]}>
                <Text style={actStyles.heroSoundText}>{draft.sound}</Text>
                <Text style={actStyles.heroSoundWave}>≋</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  <View style={[actStyles.pillTag, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[actStyles.pillTagText, { color: '#0284C7' }]}>{draft.level}</Text>
                  </View>
                  <View style={[actStyles.pillTag, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                    <Text style={[actStyles.pillTagText, { color: isDark ? '#E2E8F0' : '#475569' }]}>{draft.language}</Text>
                  </View>
                </View>
                <Text style={[actStyles.heroTitle, { color: palette.text }]}>{draft.title || 'Untitled activity'}</Text>
              </View>
            </View>

            <View style={[actStyles.heroDivider, { backgroundColor: palette.line }]} />

            <View style={actStyles.heroMetaRow}>
              <View style={actStyles.heroMetaItem}>
                <Text style={actStyles.heroMetaLabel}>Position</Text>
                <Text style={[actStyles.heroMetaVal, { color: palette.text }]}>{draft.positionLabel}</Text>
              </View>
              <View style={[actStyles.heroMetaDivider, { backgroundColor: palette.line }]} />
              <View style={actStyles.heroMetaItem}>
                <Text style={actStyles.heroMetaLabel}>Target Sound</Text>
                <Text style={[actStyles.heroMetaVal, { color: '#0284C7' }]}>{draft.sound}</Text>
              </View>
              <View style={[actStyles.heroMetaDivider, { backgroundColor: palette.line }]} />
              <View style={actStyles.heroMetaItem}>
                <Text style={actStyles.heroMetaLabel}>Word Targets</Text>
                <Text style={[actStyles.heroMetaVal, { color: palette.text }]}>
                  {(draft.origin === 'custom' ? draft.customWords : selectedWords).length} words
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions Card */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <BookOpen size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Instructions</Text>
            </View>
            <Text style={[actStyles.infoCardBody, { color: palette.muted }]}>{draft.instructions || 'No instructions provided.'}</Text>
          </View>

          {/* Articulatory Guide Card */}
          <View style={[actStyles.infoCard, { backgroundColor: isDark ? '#261C14' : '#FEFCE8', borderColor: isDark ? '#78350F' : '#FEF08A' }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF08A' }]}>
                <Sparkles size={16} color={isDark ? '#FCD34D' : '#B45309'} />
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[actStyles.infoCardTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>Articulatory Guide</Text>
                <View style={[actStyles.guideBadge, { backgroundColor: isDark ? '#451A03' : '#FEF08A' }]}>
                  <Text style={[actStyles.guideBadgeText, { color: isDark ? '#FDE68A' : '#B45309' }]}>Clinical Guidance</Text>
                </View>
              </View>
            </View>
            <Text style={[actStyles.infoCardBody, { color: isDark ? '#FCD34D' : '#78350F' }]}>{draft.guide || 'No guide provided.'}</Text>
          </View>

          {/* Practice Content Card */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Layers size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Practice Content</Text>
            </View>
            <View style={actStyles.chipGroup}>
              {(draft.origin === 'custom' ? draft.customWords : selectedWords).map((w) => (
                <View key={w.id} style={[actStyles.practiceChip, { backgroundColor: palette.card, borderColor: '#BAE6FD' }]}>
                  <Volume2 size={12} color="#0284C7" />
                  <Text style={actStyles.practiceChipText}>{w.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Audio Pronunciation Card */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Volume2 size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Audio Pronunciation Model</Text>
            </View>
            <AudioCard title="Pronunciation Model" meta="Demo Playback • 0:08" />
          </View>

          {/* Visual Material Card */}
          <View style={[actStyles.infoCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={actStyles.infoCardHeader}>
              <View style={[actStyles.infoIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Video size={16} color="#0284C7" />
              </View>
              <Text style={[actStyles.infoCardTitle, { color: palette.text }]}>Visual Material</Text>
            </View>
            <View style={actStyles.videoCardWrap}>
              <View style={actStyles.videoPlayCircle}>
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
              </View>
              <View style={actStyles.videoOverlayBottom}>
                <Text style={actStyles.videoLabelTitle}>{draft.visualName || 'Visual Demonstration Video'}</Text>
                <Text style={actStyles.videoLabelSubtitle}>High-Definition Mouth & Tongue Animation</Text>
              </View>
            </View>
          </View>

          {error ? <Text style={actStyles.errorText}>{error}</Text> : null}

          <View style={actStyles.bottomActionBar}>
            <Pressable accessibilityRole="button" onPress={() => { setError(''); setDraft({ step: 'content' }); }} style={[actStyles.actionBtnSecondary, { borderColor: palette.line, backgroundColor: palette.card }]}>
              <Text style={[actStyles.actionBtnSecondaryText, { color: palette.text }]}>‹ Back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                try {
                  saveActivity();
                  showActionNotice('Activity saved.');
                  router.push('/therapist/activities' as never);
                } catch (err: any) {
                  setError(err?.message || 'Failed to save activity.');
                }
              }}
              style={actStyles.actionBtnPrimary}
            >
              <Save size={16} color="#FFFFFF" />
              <Text style={actStyles.actionBtnPrimaryText}>Save Activity</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function EditorField({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const { palette } = useTherapist();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[actStyles.editorHeading, { color: palette.text }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.faint} style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text }]} />
    </View>
  );
}

function RadioItem({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { palette } = useTherapist();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={actStyles.radioRow}>
      <View style={[actStyles.radioOuter, selected && actStyles.radioOn]} />
      <Text style={{ color: palette.text }}>{label}</Text>
    </Pressable>
  );
}

function pickVisual(onPick: (name: string) => void) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/quicktime,.mp4,.mov';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      onPick(file.size > 20 * 1024 * 1024 ? '' : file.name);
    };
    input.click();
    return;
  }
  onPick('visual-material.mp4');
}

// ─── 4. Assign Activity Screen ───────────────────────────────────────────────

function StudentChecklistDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const { palette } = useTherapist();
  const [open, setOpen] = useState(false);
  const allSelected = options.length > 0 && options.every((option) => selected.includes(option.id));
  const summary =
    selected.length === 0
      ? 'Select student(s)...'
      : allSelected
      ? `All Students (${options.length})`
      : selected.length === 1
      ? options.find((option) => option.id === selected[0])?.name ?? 'Select student(s)...'
      : `${selected.length} Students Selected`;

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <View style={actStyles.menuWrap}>
      <Text style={[actStyles.menuLabel, { color: palette.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[actStyles.menuControl, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <Text style={[actStyles.menuValue, { color: selected.length ? palette.text : palette.faint }]} numberOfLines={1}>
          {summary}
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
        <Pressable style={actStyles.popupOverlay} onPress={() => setOpen(false)}>
          <Pressable style={[actStyles.popupCard, { backgroundColor: palette.card, borderColor: palette.line }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={[actStyles.popupHeader, { borderBottomColor: palette.line }]}>
              <Text style={[actStyles.popupTitle, { color: palette.text }]}>
                {`Select ${label}`}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={actStyles.popupCloseBtn}
                hitSlop={8}
              >
                <Text style={[actStyles.popupCloseText, { color: palette.faint }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: allSelected }}
                onPress={() => onChange(allSelected ? [] : options.map((option) => option.id))}
                style={[actStyles.popupOption, { borderBottomWidth: 1, borderBottomColor: palette.line }]}
              >
                <View style={[actStyles.checkSquare, allSelected && actStyles.checkSquareOn]}>
                  {allSelected ? <Text style={actStyles.checkMark}>✓</Text> : null}
                </View>
                <Text style={[actStyles.popupOptionText, { color: palette.text, fontWeight: '700' }]}>Select all</Text>
              </Pressable>
              {options.map((option) => {
                const checked = selected.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => toggle(option.id)}
                    style={[actStyles.popupOption, checked && { backgroundColor: '#F0F9FF' }]}
                  >
                    <View style={[actStyles.checkSquare, checked && actStyles.checkSquareOn]}>
                      {checked ? <Text style={actStyles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={[actStyles.popupOptionText, { color: palette.text }]}>{option.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={[actStyles.popupDoneBtn, { backgroundColor: palette.primary }]}
            >
              <Text style={actStyles.popupDoneBtnText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function AssignActivity() {
  const navigation = useNavigation();
  const { palette, patients, showActionNotice, isDark } = useTherapist();
  const { activities, assignActivity, beginEdit } = useActivities();
  const params = useLocalSearchParams<{ id?: string }>();
  const initialId = (Array.isArray(params.id) ? params.id[0] : params.id) || activities[0]?.id || '';
  const students = patients.map((patient) => ({ id: patient.id, name: patientName(patient) }));
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [activityId, setActivityId] = useState(initialId);
  const [dueDate, setDueDate] = useState('');
  const activity = activities.find((item) => item.id === activityId);
  const [instructions, setInstructions] = useState(activity?.instructions || '');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/therapist/activities' as never);
    }
  };

  const chooseActivity = (id: string) => {
    const next = activities.find((item) => item.id === id);
    if (!next) return;
    setActivityId(next.id);
    setInstructions(next.instructions);
    setPreview(false);
  };

  const assign = () => {
    try {
      const recipients = students.filter(({ id }) => selectedStudents.includes(id));
      if (recipients.length === 0) {
        setError('Please select at least one student.');
        return;
      }
      if (!activity) {
        setError('Please select an activity.');
        return;
      }
      if (!isAssignmentDate(dueDate)) {
        setError('Enter a valid due date today or later (mm/dd/yyyy).');
        return;
      }
      if (!instructions.trim()) {
        setError('Please provide activity instructions.');
        return;
      }
      for (const student of recipients) {
        assignActivity(activity.id, student, dueDate, instructions);
      }
      setError('');
      showActionNotice(recipients.length === 1 ? 'Activity assigned to ' + recipients[0].name + '.' : 'Activity assigned to ' + recipients.length + ' students.');
      router.push('/therapist/activities' as never);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign activity. Please try again.');
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content} keyboardShouldPersistTaps="handled">
      <Pressable
        accessibilityLabel="Back"
        onPress={handleBack}
        style={[actStyles.detailBack, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <Text style={[actStyles.assignTitle, { color: palette.text }]}>Assign Activity</Text>
      <StudentChecklistDropdown label="Student(s)" options={students} selected={selectedStudents} onChange={setSelectedStudents} />
      <FieldMenu label="Activity" value={activity?.id || 'Select activity'} options={activities.map((item) => item.id)}
        optionLabels={new Map(activities.map((item) => [item.id, [item.title, item.language, item.level].join(' · ')]))}
        onChange={chooseActivity} />
      <Pressable accessibilityRole="button" onPress={() => setPreview((open) => !open)} style={[actStyles.previewToggleBtn, preview && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 }]}>
        <Text style={actStyles.previewToggleText}>Activity Preview</Text>
        <Text style={actStyles.previewToggleText}>{preview ? '▲' : '▼'}</Text>
      </Pressable>
      {preview && activity ? (
        <View style={[actStyles.previewContainer, { borderColor: '#BAE6FD', backgroundColor: palette.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[actStyles.detailBadge, { marginTop: 0, marginBottom: 0 }]}>
                <Text style={actStyles.detailBadgeText}>{activity.level}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: palette.text }}>{activity.title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                beginEdit(activity.id);
                router.push('/therapist/activities/edit' as never);
              }}
              hitSlop={6}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#0284C7' }}>Edit Template ›</Text>
            </Pressable>
          </View>
          <PracticeContent activity={{ ...activity, instructions }} />
        </View>
      ) : null}

      <View style={{ marginTop: preview ? 16 : 0, marginBottom: 14 }}>
        <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Due Date</Text>
        <AssignmentCalendar value={dueDate} onSelect={setDueDate} isDark={isDark} minDate={todayCalendarDate()} showDueDatePresets />
      </View>

      <View style={{ marginBottom: 14 }}>
        <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Instructions</Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          multiline
          placeholder="Enter instructions for the student or parent..."
          placeholderTextColor={palette.faint}
          style={[actStyles.editorInput, { minHeight: 90, paddingVertical: 12, borderColor: palette.line, color: palette.text, backgroundColor: palette.card, textAlignVertical: 'top' }]}
        />
      </View>

      {error ? <Text style={actStyles.errorText}>{error}</Text> : null}

      <View style={actStyles.footerActions}>
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          style={[actStyles.detailSecondary, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={assign} style={actStyles.detailPrimary}>
          <Text style={actStyles.detailPrimaryText}>Assign Activity</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Default Page Exports with TherapistShell ────────────────────────────────

export default function TherapistActivities() {
  return (
    <TherapistShell active="activities">
      <ActivityLibrary />
    </TherapistShell>
  );
}

export function TherapistActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TherapistShell active="activities">
      <ActivityDetail activityId={Array.isArray(id) ? id[0] : id || ''} />
    </TherapistShell>
  );
}

export function TherapistActivityEdit() {
  return (
    <TherapistShell active="activities">
      <ActivityEditor />
    </TherapistShell>
  );
}

export function TherapistActivityAssign() {
  return (
    <TherapistShell active="activities">
      <AssignActivity />
    </TherapistShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const actStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  kicker: { fontSize: 11, letterSpacing: 0.6, fontWeight: '700' },
  title: { fontFamily: 'SourGummy-Bold', fontSize: 24, marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  sectionTabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, marginBottom: 14 },
  sectionTab: { fontSize: 14, fontWeight: '700', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  search: { flex: 1, height: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  createTaskButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, backgroundColor: '#0284C7', borderRadius: 10, paddingHorizontal: 14, gap: 6 },
  createTaskPlus: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  createTaskButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  create: { borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  createText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statusBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  swatch: { height: 92, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  sound: { fontSize: 28, fontWeight: '500', color: '#3F4A3A' },
  wave: { fontSize: 18, color: '#0284C7' },
  cardBody: { padding: 12, gap: 4 },
  levelPill: { alignSelf: 'flex-start', backgroundColor: '#E0F2FE', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 10, color: '#0284C7', fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 11 },
  viewLink: { fontSize: 12, marginTop: 4 },
  empty: { marginTop: 16, textAlign: 'center' },

  // Word Bank (Teacher-Dashboard aligned)
  wbSearchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bankSearchBox: { flex: 1, height: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  wbAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, backgroundColor: '#0284C7', paddingHorizontal: 12, borderRadius: 12, marginRight: 8 },
  wbAddBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  wbFilterBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  wbFilterBtnActive: { borderColor: '#0284C7', backgroundColor: '#E0F2FE' },
  wbFilterPanel: { width: '100%', maxWidth: 480, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 10 },
  wbFilterHeading: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  wbFilterOptionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wbChoicePill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  wbChoicePillActive: { borderColor: '#0284C7', backgroundColor: '#E0F2FE' },
  wbChoicePillText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  wbChoicePillTextActive: { color: '#0284C7', fontWeight: '700' },
  wbChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  wbChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  wbChipLabel: { fontSize: 12, fontWeight: '600' },
  wbNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12 },
  wbNoticeText: { fontSize: 13, fontWeight: '700' },
  wbAddForm: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 },
  wbAddFormTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  wbFormLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  wbFormInput: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13, marginBottom: 10 },
  wbFormActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 14 },
  wbCancelWordBtn: { height: 40, borderRadius: 10, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  wbCancelWordBtnText: { fontSize: 13, fontWeight: '700' },
  wbSaveWordBtn: { height: 40, backgroundColor: '#0284C7', borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  wbSaveWordBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  wbListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
  wbListTitle: { fontSize: 15, fontWeight: '700' },
  wbEditModeBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  wbListCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  wbListRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, minHeight: 48 },
  wbWordText: { fontSize: 14, fontWeight: '600' },
  wbSoundBadgeWrap: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  wbSoundBadgeText: { fontSize: 11, fontWeight: '700' },
  wbPositionBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  wbPositionBadgeText: { fontSize: 12, fontWeight: '700' },
  wbDeleteBtn: { padding: 4 },

  // Word Bank (Legacy support)
  addBtn: { height: 40, backgroundColor: '#0284C7', borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  filterToggle: { width: 40, height: 40, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterPanel: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12, gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: '#D7E8F2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  choiceOn: { borderColor: '#0EA5E9', backgroundColor: '#E7F6FD' },
  choiceText: { fontSize: 12, color: '#63778A' },
  choiceTextOn: { color: '#0284C7', fontWeight: '700' },
  posPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  posPillSelected: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  posPillText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  posPillTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  langSegmentControl: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden', height: 40 },
  langSegmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  langSegmentBtnActive: { backgroundColor: '#0284C7' },
  langSegmentText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  langSegmentTextActive: { color: '#FFFFFF', fontWeight: '700' },
  formWrap: { marginBottom: 8 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  wordInput: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, marginBottom: 12 },
  saveWordBtn: { alignSelf: 'flex-end', backgroundColor: '#0284C7', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4, marginBottom: 16 },
  saveWordBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  bankList: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  bankRow: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bankWordText: { fontSize: 14 },
  bankBadge: { backgroundColor: '#D9F3FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  bankBadgeText: { color: '#38B6E6', fontSize: 12, fontWeight: '700' },
  bankMinus: { fontSize: 18, fontWeight: '700', paddingHorizontal: 6 },

  // Detail & Hero Section
  topNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  topNavTitle: { fontSize: 15, fontWeight: '700' },
  detailBack: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  // Hero Card
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  heroSoundBadge: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroSoundText: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  heroSoundWave: { fontSize: 13, color: '#0284C7', marginTop: -2 },
  heroTitle: { fontSize: 22, fontWeight: '800' },
  pillTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillTagText: { fontSize: 11, fontWeight: '700' },
  heroDivider: { height: 1, marginVertical: 14 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroMetaItem: { flex: 1, alignItems: 'center' },
  heroMetaLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  heroMetaVal: { fontSize: 13, fontWeight: '700' },
  heroMetaDivider: { width: 1, height: 24 },

  // Info Cards
  infoCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoCardTitle: { fontSize: 15, fontWeight: '700' },
  infoCardBody: { fontSize: 14, lineHeight: 22 },
  guideBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  guideBadgeText: { fontSize: 11, fontWeight: '700' },

  // Practice Content
  posBlockCard: { borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 8 },
  posBlockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  posBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  posBadgeText: { fontSize: 11, fontWeight: '700' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  practiceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  practiceChipText: { color: '#0284C7', fontWeight: '700', fontSize: 13 },
  noTargetsText: { fontSize: 13, fontStyle: 'italic' },

  // Video Demonstration Card
  videoCardWrap: { height: 140, borderRadius: 14, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  videoPlayCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  videoOverlayBottom: { position: 'absolute', bottom: 10, left: 12, right: 12 },
  videoLabelTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  videoLabelSubtitle: { color: '#94A3B8', fontSize: 11 },
  videoTagBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  videoTagBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  // Bottom Action Bar
  bottomActionBar: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 36 },
  actionBtnSecondary: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnSecondaryText: { fontSize: 14, fontWeight: '700' },
  actionBtnPrimary: { flex: 1.2, height: 48, borderRadius: 14, backgroundColor: '#0284C7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0284C7', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  actionBtnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Legacy compatibility
  detailHeaderBlock: { marginBottom: 14 },
  detailBadge: { alignSelf: 'flex-start', backgroundColor: '#E0F2FE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  detailBadgeText: { color: '#0284C7', fontSize: 12, fontWeight: '700' },
  detailTitle: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  detailMeta: { fontSize: 13, marginBottom: 4 },
  sectionHead: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  sectionBlock: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 4 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  visualBox: { height: 124, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  visualPlayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  visualLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  detailActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 18, marginBottom: 36 },
  detailPrimary: { backgroundColor: '#0284C7', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  detailPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  detailSecondary: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  detailSecondaryText: { fontWeight: '700', fontSize: 14 },
  practiceBox: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 },
  posBlock: { gap: 6 },
  posTitle: { fontSize: 14, fontWeight: '700' },

  // Editor
  stepperCard: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 16 },
  stepperRow: { flexDirection: 'row', gap: 12 },
  stepCircleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#0284C7' },
  stepCircleCompleted: { backgroundColor: '#10B981' },
  stepCircleText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  stepProgressBar: { height: 3, borderRadius: 2 },
  stepper: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  stepItem: { flex: 1, gap: 6 },
  stepLine: { height: 3, borderRadius: 2 },
  stepLabel: { fontSize: 11, fontWeight: '700' },
  editorBlock: { gap: 12 },
  editorHeading: { fontSize: 15, fontWeight: '700' },
  helpText: { fontSize: 12, lineHeight: 17 },
  editorInput: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14 },
  editorRow: { flexDirection: 'row', gap: 10 },
  editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  errorText: { color: '#F5693F', fontSize: 13 },
  smallPrimaryBtn: { alignSelf: 'flex-end', backgroundColor: '#0284C7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#0284C7' },
  radioOn: { backgroundColor: '#0284C7' },
  countersRow: { flexDirection: 'row', gap: 8 },
  counterBox: { flex: 1, borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 12, padding: 10 },
  counterBoxOn: { backgroundColor: '#F8F1EA', borderColor: '#F0D2BC' },
  counterLabel: { fontSize: 12, color: '#63778A' },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  bankPicker: { borderWidth: 1, borderRadius: 12, padding: 8 },
  bankPickRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  editorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  editorChipText: { color: '#0284C7', fontWeight: '600', textTransform: 'capitalize' },
  editorChipX: { color: '#0284C7', fontSize: 14 },
  phraseLabel: { fontSize: 13, fontWeight: '700' },
  customLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  uploadIcon: { color: '#0284C7', fontSize: 20, fontWeight: '700' },
  previewCard: { backgroundColor: '#FBF6F1', borderRadius: 18, padding: 16, gap: 8 },
  previewSound: { textAlign: 'center', color: '#0284C7', fontSize: 28 },
  previewTitle: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1E293B' },
  previewMeta: { textAlign: 'center', color: '#8B9AAB', fontSize: 12, marginBottom: 8 },
  previewHeading: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 6 },
  previewBody: { fontSize: 13, color: '#63778A', lineHeight: 18 },
  brownChip: { backgroundColor: '#0284C7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  brownChipText: { color: '#FFFFFF', fontWeight: '700' },
  previewVisual: { height: 120, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },

  // Assign
  assignTitle: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  previewToggleBtn: { borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', borderRadius: 12, minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  previewToggleText: { color: '#0284C7', fontWeight: '700', fontSize: 14 },
  previewContainer: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  footerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 18, marginBottom: 36 },

  // Dropdown menu
  menuWrap: { marginBottom: 14, gap: 6 },
  menuLabel: { fontSize: 13, fontWeight: '700' },
  menuControl: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  menuValue: { flex: 1, fontSize: 14 },
  dropdownMenu: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  dropdownOptionText: { fontSize: 14 },
  checkSquare: { width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  checkSquareOn: { backgroundColor: '#0284C7' },
  checkMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Audio demo card
  audioCard: { borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  audioPlay: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  audioPlayIcon: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  audioTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  audioMeta: { fontSize: 12, color: '#8B9AAB', marginTop: 2 },
  audioBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  audioBar: { width: 4, borderRadius: 2, backgroundColor: '#0284C7' },

  // Popup Dropdown Styles
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
});
