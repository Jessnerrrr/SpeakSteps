import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatCalendarDate, parseCalendarDate, todayCalendarDate, type CalendarDateFormat } from '@/data/calendar-date';

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const dueDatePresets = [['Today', 0], ['+3 Days', 3], ['+1 Week', 7], ['+2 Weeks', 14]] as const;
const yearsPerPage = 12;

export function AssignmentCalendar({ value, onSelect, isDark, label = 'Due date', format = 'mdy', minDate, maxDate, showDueDatePresets = false, dateNotice }: {
  value: string; onSelect: (value: string) => void; isDark: boolean;
  label?: string; format?: CalendarDateFormat; minDate?: Date; maxDate?: Date; showDueDatePresets?: boolean;
  dateNotice?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [yearPage, setYearPage] = useState<number | null>(null);
  const minYear = minDate?.getFullYear() ?? 1000;
  const maxYear = maxDate?.getFullYear() ?? 9999;
  const lastYearPage = Math.floor((maxYear - minYear) / yearsPerPage);
  const firstShownYear = minYear + (yearPage ?? 0) * yearsPerPage;
  const lastShownYear = Math.min(firstShownYear + yearsPerPage - 1, maxYear);
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const textColor = isDark ? '#E2E8F0' : '#17364D';
  const lineColor = isDark ? '#3A5066' : '#D9E5EF';
  const softColor = isDark ? '#243B50' : '#F1F7FC';
  const today = todayCalendarDate();
  const isAllowed = (date: Date) => (!minDate || date >= minDate) && (!maxDate || date <= maxDate);
  const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const canGoBack = previousMonth.getFullYear() >= minYear &&
    (!minDate || start > new Date(minYear, minDate.getMonth(), 1));
  const canGoForward = nextMonth.getFullYear() <= maxYear && (!maxDate || nextMonth <= maxDate);
  const close = () => {
    setOpen(false);
    setYearPage(null);
  };
  const jumpToYear = (year: number) => {
    const earliest = minDate && year === minYear ? minDate.getMonth() : 0;
    const latest = maxDate && year === maxYear ? maxDate.getMonth() : 11;
    setMonth(new Date(year, Math.min(latest, Math.max(earliest, month.getMonth())), 1));
    setYearPage(null);
  };
  const applyDate = () => {
    if (yearPage !== null || !selectedDate || !isAllowed(selectedDate)) return;
    onSelect(formatCalendarDate(selectedDate, format));
    close();
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${label.toLowerCase()} calendar`}
        accessibilityHint={value || 'No date selected'} style={[styles.dateField, { borderColor: lineColor, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]} onPress={() => {
        const previous = parseCalendarDate(value, format);
        const initial = previous && isAllowed(previous) ? previous : today;
        const allowedStart = minDate && initial < minDate ? minDate : maxDate && initial > maxDate ? maxDate : initial;
        setMonth(allowedStart);
        setSelectedDate(previous && isAllowed(previous) ? previous : showDueDatePresets ? allowedStart : null);
        setOpen(true);
      }}>
        <Text style={[styles.fieldText, { color: value ? textColor : isDark ? '#A6B9CC' : '#536A7D' }]}>{value || 'Select date'}</Text>
        <Ionicons name="calendar-outline" size={21} color={isDark ? '#38BDF8' : '#0284C7'} />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <View style={[styles.header, styles.titleRow, { borderBottomColor: lineColor }]}>
              <View style={[styles.titleIcon, { backgroundColor: softColor }]}><Ionicons name="calendar-outline" size={19} color={isDark ? '#7DD3FC' : '#0865AD'} /></View>
              <Text accessibilityRole="header" style={[styles.title, { color: textColor }]}>{`Select ${label}`}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close calendar" style={styles.iconButton} onPress={close}>
                <Ionicons name="close" size={22} color={textColor} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.calendarBody}>
            {(showDueDatePresets || dateNotice) && (
              <View style={[styles.notice, { backgroundColor: softColor, borderColor: lineColor }]}>
                <Ionicons name="lock-closed-outline" size={15} color={isDark ? '#7DD3FC' : '#0865AD'} />
                <Text style={[styles.noticeText, { color: textColor }]}>{dateNotice || 'Past dates are locked. Choose today or a future date.'}</Text>
              </View>
            )}
            {yearPage === null && <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={!canGoBack} style={[styles.iconButton, !canGoBack && styles.disabled]} onPress={() => setMonth(previousMonth)}>
                <Ionicons name="chevron-back" size={20} color={textColor} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose year" style={styles.monthButton}
                onPress={() => setYearPage(Math.floor((month.getFullYear() - minYear) / yearsPerPage))}>
                <Text accessibilityLiveRegion="polite" style={styles.month}>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month)}</Text>
                <Ionicons name="chevron-down" size={15} color="#0284C7" />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={!canGoForward} style={[styles.iconButton, !canGoForward && styles.disabled]} onPress={() => setMonth(nextMonth)}>
                <Ionicons name="chevron-forward" size={20} color={textColor} />
              </Pressable>
            </View>}
            {showDueDatePresets && yearPage === null && (
              <View style={styles.presets}>
                {dueDatePresets.map(([name, offset]) => {
                  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
                  const selected = selectedDate?.getTime() === date.getTime();
                  const disabled = !isAllowed(date);
                  return (
                    <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled}
                      onPress={() => { setSelectedDate(date); setMonth(date); }}
                      style={[styles.preset, { borderColor: lineColor, backgroundColor: selected ? '#0865AD' : softColor }, disabled && styles.disabled]}>
                      <Text style={[styles.presetText, { color: selected ? '#FFFFFF' : textColor }]}>{name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {yearPage !== null ? (
              <View>
                <View style={styles.header}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Earlier years" disabled={yearPage === 0}
                    style={[styles.iconButton, yearPage === 0 && styles.disabled]} onPress={() => setYearPage(yearPage - 1)}>
                    <Ionicons name="chevron-back" size={20} color={textColor} />
                  </Pressable>
                  <Text accessibilityLiveRegion="polite" style={[styles.dateSummary, { color: textColor }]}>{firstShownYear}–{lastShownYear}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Later years" disabled={yearPage >= lastYearPage}
                    style={[styles.iconButton, yearPage >= lastYearPage && styles.disabled]} onPress={() => setYearPage(yearPage + 1)}>
                    <Ionicons name="chevron-forward" size={20} color={textColor} />
                  </Pressable>
                </View>
                <View style={styles.yearGrid}>
                  {Array.from({ length: lastShownYear - firstShownYear + 1 }, (_, index) => {
                    const year = firstShownYear + index;
                    const selected = year === month.getFullYear();
                    return (
                      <Pressable key={year} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => jumpToYear(year)}
                        style={[styles.yearButton, { backgroundColor: selected ? '#0865AD' : softColor }]}>
                        <Text style={{ color: selected ? '#FFFFFF' : textColor, fontWeight: selected ? '700' : '400' }}>{year}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : <View style={styles.grid}>
              {weekdays.map((day) => <Text key={day} style={[styles.cell, styles.weekday, { color: textColor }]}>{day}</Text>)}
              {Array.from({ length: start.getDay() }, (_, index) => <View key={'blank-' + index} style={styles.cell} />)}
              {Array.from({ length: days }, (_, index) => {
                const day = index + 1;
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const dateLabel = formatCalendarDate(date, format);
                const selected = selectedDate?.getTime() === date.getTime();
                const disabled = !isAllowed(date);
                return (
                  <Pressable key={day} accessibilityRole="button" accessibilityLabel={dateLabel} accessibilityState={{ selected, disabled }} disabled={disabled}
                    style={styles.cell} onPress={() => setSelectedDate(date)}>
                    <View style={[styles.dateNumber, disabled && { backgroundColor: softColor }, selected && styles.selected]}>
                      <Text style={{ color: selected ? '#FFFFFF' : disabled ? (isDark ? '#8295A5' : '#718597') : textColor, fontWeight: selected ? '700' : '400' }}>{day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>}
            </ScrollView>
            <View style={[styles.footer, { borderTopColor: lineColor }]}>
              <View style={styles.header}>
                <Text style={[styles.noticeText, { color: textColor }]}>{`Selected ${label.toLowerCase()}`}</Text>
                <Text accessibilityLiveRegion="polite" style={[styles.dateSummary, { color: textColor }]}>{selectedDate ? formatCalendarDate(selectedDate, format) : '—'}</Text>
              </View>
              <View style={styles.footerButtons}>
                <Pressable accessibilityRole="button" accessibilityLabel="Cancel date selection" onPress={close} style={[styles.footerButton, { borderColor: lineColor }]}><Text style={{ color: textColor, fontWeight: '600' }}>Cancel</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={!selectedDate || yearPage !== null} onPress={applyDate}
                  style={[styles.footerButton, styles.applyButton, (!selectedDate || yearPage !== null) && styles.disabled]}>
                  <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                  <Text style={styles.yearApplyText}>Apply date</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateField: { minHeight: 44, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12 },
  fieldText: { flexShrink: 1, fontSize: 14 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: 'rgba(15,34,53,0.45)' },
  card: { width: '100%', maxWidth: 360, maxHeight: '94%', borderRadius: 18, padding: 12 },
  calendarBody: { flexGrow: 0, flexShrink: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { gap: 8, borderBottomWidth: 1, paddingBottom: 4, marginBottom: 8 },
  titleIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontWeight: '700', fontSize: 17 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, borderWidth: 1, borderRadius: 8, marginBottom: 4 },
  noticeText: { flexShrink: 1, fontSize: 12, lineHeight: 16 },
  presets: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  preset: { flex: 1, minHeight: 36, borderWidth: 1, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  presetText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  month: { fontWeight: '700', fontSize: 15, color: '#0284C7' },
  monthButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 4 },
  yearButton: { width: '31%', minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  yearApplyText: { color: '#FFFFFF', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' },
  weekday: { textAlign: 'center', lineHeight: 40, fontWeight: '600' },
  dateNumber: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: '#0865AD', borderRadius: 17 },
  disabled: { opacity: 0.4 },
  footer: { borderTopWidth: 1, marginTop: 8, paddingTop: 10, gap: 8 },
  dateSummary: { fontSize: 14, fontWeight: '700' },
  footerButtons: { flexDirection: 'row', gap: 8 },
  footerButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 9, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 5 },
  applyButton: { backgroundColor: '#0865AD', borderColor: '#0865AD' },
});
