import { CategoryDef } from '@/types';

export type { CategoryDef };

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { value: 'bird',      label: 'Bird',      emoji: '🐦' },
  { value: 'mouse',     label: 'Mouse',     emoji: '🐭' },
  { value: 'character', label: 'Character', emoji: '👾' },
  { value: 'stencil',   label: 'Stencil',   emoji: '🎨' },
  { value: 'paste-up',  label: 'Paste-Up',  emoji: '📄' },
  { value: 'mural',     label: 'Mural',     emoji: '🖼️' },
  { value: 'tag',       label: 'Tag',       emoji: '✏️' },
  { value: 'sticker',   label: 'Sticker',   emoji: '🏷️' },
  { value: 'other',     label: 'Other',     emoji: '❓' },
];
