/**
 * Design tokens for One Question a Day.
 *
 * The app ships a warm, calm-but-lively visual system with full light and dark
 * palettes. Screens consume the active palette through `useTheme()` (see
 * `theme-provider.tsx`); the static `colors` export below is the light palette,
 * kept for modules that have not migrated to the hook yet.
 */

export type ThemeScheme = 'light' | 'dark';

export type Palette = {
  // Surfaces
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  border: string;
  borderStrong: string;
  overlay: string;

  // Text
  ink: string;
  inkSoft: string;
  inkMuted: string;
  onAccent: string;

  // Brand / primary action
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primaryInk: string;

  // Playful accent (streaks, celebrations, highlights)
  accent: string;
  accentSoft: string;
  accentInk: string;

  // Semantic
  success: string;
  successSoft: string;
  successInk: string;
  danger: string;
  dangerSoft: string;
  dangerInk: string;

  // Legacy aliases (older screens referenced these names)
  green: string;
  greenSoft: string;
  peach: string;
  peachInk: string;
};

export const lightColors: Palette = {
  background: '#F6F1E8',
  backgroundElevated: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EADF',
  surfaceStrong: '#ECE3D5',
  border: '#E4DACC',
  borderStrong: '#D6C9B6',
  overlay: 'rgba(28, 25, 20, 0.42)',

  ink: '#1D241E',
  inkSoft: '#4E5A50',
  inkMuted: '#5F6C61',
  onAccent: '#FFFFFF',

  primary: '#1E5A43',
  primaryPressed: '#174A37',
  primarySoft: '#E2EFE8',
  primaryInk: '#12432F',

  accent: '#DE7A34',
  accentSoft: '#FBE7D4',
  accentInk: '#9A511C',

  success: '#1E7A4D',
  successSoft: '#DFF1E6',
  successInk: '#12613B',
  danger: '#B23A3A',
  dangerSoft: '#F7E3E0',
  dangerInk: '#8C2A2A',

  green: '#1E5A43',
  greenSoft: '#E2EFE8',
  peach: '#FBE7D4',
  peachInk: '#9A511C',
};

export const darkColors: Palette = {
  background: '#13120E',
  backgroundElevated: '#1B1915',
  surface: '#211E19',
  surfaceMuted: '#2A2620',
  surfaceStrong: '#332E26',
  border: '#37322A',
  borderStrong: '#484137',
  overlay: 'rgba(0, 0, 0, 0.58)',

  ink: '#F4EFE5',
  inkSoft: '#C3BBAD',
  inkMuted: '#9A9284',
  onAccent: '#17130D',

  primary: '#54BE90',
  primaryPressed: '#48A97F',
  primarySoft: '#1C3A2D',
  primaryInk: '#BFE9D5',

  accent: '#EEA15C',
  accentSoft: '#3A2A1A',
  accentInk: '#F4C79A',

  success: '#5FC08C',
  successSoft: '#1E3B2C',
  successInk: '#BFE9D5',
  danger: '#E48A82',
  dangerSoft: '#3B211F',
  dangerInk: '#F2C4BE',

  green: '#54BE90',
  greenSoft: '#1C3A2D',
  peach: '#3A2A1A',
  peachInk: '#F4C79A',
};

export const palettes: Record<ThemeScheme, Palette> = {
  light: lightColors,
  dark: darkColors,
};

/** Legacy static export — the light palette. Prefer `useTheme()` in new code. */
export const colors = lightColors;

export const radius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
} as const;

/**
 * Named type ramp. Values are plain objects so they can be spread into
 * StyleSheet entries: `{ ...typography.title, color: theme.ink }`.
 */
export const typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '800' as const, letterSpacing: -1.2 },
  h1: { fontSize: 30, lineHeight: 37, fontWeight: '800' as const, letterSpacing: -0.7 },
  h2: { fontSize: 23, lineHeight: 30, fontWeight: '800' as const, letterSpacing: -0.4 },
  title: { fontSize: 18, lineHeight: 25, fontWeight: '700' as const, letterSpacing: -0.2 },
  bodyLg: { fontSize: 17, lineHeight: 27, fontWeight: '400' as const, letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '400' as const, letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.1 },
  eyebrow: { fontSize: 12, lineHeight: 15, fontWeight: '800' as const, letterSpacing: 1.4 },
} as const;

/** Motion durations (ms) and a spring config tuned for gentle, non-bouncy UI. */
export const motion = {
  duration: { fast: 150, base: 260, slow: 440, celebrate: 900 },
  spring: { damping: 16, stiffness: 180, mass: 0.9 },
} as const;

export function shadow(scheme: ThemeScheme, level: 'sm' | 'md' | 'lg' = 'md') {
  if (scheme === 'dark') {
    // Elevation on dark surfaces reads through borders/tint, not drop shadow.
    return { shadowColor: 'transparent', elevation: 0 } as const;
  }
  const presets = {
    sm: { shadowColor: '#3B2E1C', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    md: { shadowColor: '#3B2E1C', shadowOpacity: 0.09, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
    lg: { shadowColor: '#3B2E1C', shadowOpacity: 0.12, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 9 },
  } as const;
  return presets[level];
}

/**
 * Category presentation. Keys match `Question['category']`; each entry has a
 * soft chip background and a readable ink for its label, resolved per scheme.
 */
export type CategoryKey =
  | 'daily_life'
  | 'relationships'
  | 'choices'
  | 'values'
  | 'fears'
  | 'identity'
  | 'meaning'
  | 'gratitude'
  | 'hopes'
  | 'change'
  | 'memories';

const categoryHue: Record<CategoryKey, { label: string; light: [string, string]; dark: [string, string] }> = {
  daily_life: { label: 'Günlük hayat', light: ['#E7EEDD', '#4C5B33'], dark: ['#2A3320', '#C6D6A6'] },
  relationships: { label: 'İlişkiler', light: ['#F6E1DA', '#9A4A38'], dark: ['#3A241F', '#EDB6A9'] },
  choices: { label: 'Seçimler', light: ['#E1EBF3', '#345B79'], dark: ['#1F2E3A', '#A9CCE4'] },
  values: { label: 'Değerler', light: ['#EEE6F3', '#5C4479'], dark: ['#2C2338', '#CDB6E6'] },
  fears: { label: 'Korkular', light: ['#EDE7E1', '#5B4A3A'], dark: ['#2E271F', '#D6C4B0'] },
  identity: { label: 'Kimlik', light: ['#E2EFE8', '#2E6B4E'], dark: ['#1C3428', '#AEE0C6'] },
  meaning: { label: 'Anlam', light: ['#F3EAD9', '#7A5A24'], dark: ['#332818', '#E6CE9E'] },
  gratitude: { label: 'Şükran', light: ['#FBE7D4', '#9A511C'], dark: ['#3A2A1A', '#F4C79A'] },
  hopes: { label: 'Umutlar', light: ['#DEEDEC', '#2C6460'], dark: ['#1B3130', '#A7DAD6'] },
  change: { label: 'Değişim', light: ['#E9E7DA', '#585A34'], dark: ['#2C2C1D', '#CFD0A6'] },
  memories: { label: 'Anılar', light: ['#F1E6EC', '#7A3E60'], dark: ['#33202A', '#E6B6CF'] },
};

export function categoryLabel(key: string): string {
  return categoryHue[key as CategoryKey]?.label ?? key.replace(/_/g, ' ');
}

export function categoryColors(key: string, scheme: ThemeScheme): { bg: string; ink: string } {
  const entry = categoryHue[key as CategoryKey] ?? categoryHue.daily_life;
  const [bg, ink] = entry[scheme];
  return { bg, ink };
}
