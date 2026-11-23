export type CalendarDateFormat = 'mdy' | 'iso';

export function parseCalendarDate(value: string, format: CalendarDateFormat = 'mdy'): Date | null {
  const match = (format === 'iso' ? /^(\d{4})-(\d{2})-(\d{2})$/ : /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/).exec(value.trim());
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  const [year, month, day] = format === 'iso' ? parts : [parts[2], parts[0], parts[1]];
  if (year < 1000) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function formatCalendarDate(date: Date, format: CalendarDateFormat = 'mdy') {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return format === 'iso' ? [year, month, day].join('-') : [month, day, year].join('/');
}

export function todayCalendarDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export const minimumStudentAge = 5;
export const maximumStudentAge = 12;
export const studentBirthDateNotice = `Choose a birth date for a student aged ${minimumStudentAge}–${maximumStudentAge}.`;

export function studentBirthDateLimits(today = todayCalendarDate()) {
  const birthdayCutoff = (yearsAgo: number) => {
    const year = today.getFullYear() - yearsAgo;
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(today.getDate(), lastDay));
  };
  const minDate = birthdayCutoff(maximumStudentAge + 1);
  minDate.setDate(minDate.getDate() + 1);
  return { minDate, maxDate: birthdayCutoff(minimumStudentAge) };
}

export function studentAgeFromBirthDate(value: string, today = todayCalendarDate()) {
  const birthDate = parseCalendarDate(value);
  const { minDate, maxDate } = studentBirthDateLimits(today);
  if (!birthDate || birthDate < minDate || birthDate > maxDate) return null;
  const birthdayPending = today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  return today.getFullYear() - birthDate.getFullYear() - Number(birthdayPending);
}
