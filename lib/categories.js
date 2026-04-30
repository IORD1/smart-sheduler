export const CATEGORIES = {
  work:     { label: 'Work',     emoji: '💼', color: 'var(--cat-work)' },
  health:   { label: 'Health',   emoji: '🏃', color: 'var(--cat-health)' },
  social:   { label: 'Social',   emoji: '🥂', color: 'var(--cat-social)' },
  focus:    { label: 'Focus',    emoji: '🧠', color: 'var(--cat-focus)' },
  errand:   { label: 'Errand',   emoji: '📦', color: 'var(--cat-errand)' },
  personal: { label: 'Personal', emoji: '🏡', color: 'var(--cat-personal)' },
  meal:     { label: 'Meal',     emoji: '🍽️', color: 'var(--cat-meal)' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

const KEYWORDS = [
  { cat: 'meal',   re: /\b(lunch|breakfast|brunch|dinner|coffee|snack|meal)\b/i },
  { cat: 'health', re: /\b(gym|run|workout|tennis|yoga|swim|bike|walk|hike|sport|fitness|pilates)\b/i },
  { cat: 'social', re: /\b(party|drinks|hangout|catch[- ]?up|date|wedding|birthday|reunion)\b/i },
  { cat: 'focus',  re: /\b(write|writing|deep[- ]?work|study|review|research|brief|spec|doc)\b/i },
  { cat: 'errand', re: /\b(grocery|shopping|errand|pickup|drop[- ]?off|laundry|bank|post|mail)\b/i },
  { cat: 'work',   re: /\b(standup|stand-up|sync|meeting|1:1|one[- ]?on[- ]?one|interview|review|design|demo|planning|retro|sprint)\b/i },
  { cat: 'personal', re: /\b(read|reading|book|chapter|journal|reflect|home|family|kids?)\b/i },
];

export function classify(text) {
  if (!text) return 'personal';
  for (const { cat, re } of KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return 'personal';
}
