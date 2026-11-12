export type TherapistPalette = {
  background: string;
  canvas: string;
  card: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  green: string;
  greenSoft: string;
  greenText: string;
  alert: string;
  orange: string;
  nav: string;
  navInactive: string;
  shadow: string;
  inverse: string;
  recent: string;
  track: string;
  input: string;
};

export const lightPalette: TherapistPalette = {
  background: '#F7F8F8',
  canvas: '#E6EBEF',
  card: '#FFFFFF',
  text: '#1E293B',
  muted: '#63778A',
  faint: '#8B9AAB',
  line: '#E6EBEF',
  primary: '#0EA5E9',
  primarySoft: '#B1E0F4',
  primaryText: '#0369A1',
  green: '#43B05C',
  greenSoft: '#D2E3C5',
  greenText: '#2F7D3F',
  alert: '#F5693F',
  orange: '#F5A524',
  nav: '#FFFFFF',
  navInactive: '#8B9AAB',
  shadow: '#0F172A',
  inverse: '#FFFFFF',
  recent: '#E4E9EE',
  track: '#E6EBEF',
  input: '#FFFFFF',
};

export const darkPalette: TherapistPalette = {
  background: '#0F1720',
  canvas: '#0B1218',
  card: '#1A2633',
  text: '#F8FAFC',
  muted: '#A8B6C4',
  faint: '#7E8C9A',
  line: '#2A3A4A',
  primary: '#0EA5E9',
  primarySoft: '#164E63',
  primaryText: '#7DD3FC',
  green: '#43B05C',
  greenSoft: '#1C3A28',
  greenText: '#86EFAC',
  alert: '#F5693F',
  orange: '#F5A524',
  nav: '#121C27',
  navInactive: '#7E8C9A',
  shadow: '#000000',
  inverse: '#FFFFFF',
  recent: '#162230',
  track: '#243444',
  input: '#121C27',
};

export type ThemeMode = 'auto' | 'light' | 'dark';
