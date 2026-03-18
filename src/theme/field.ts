import { FONT_FAMILIES } from './fonts';
import { RADIUS } from './radius';

/** Shared input style — white background with dark text for readability on dark theme. */
export const INPUT_STYLE = {
  borderRadius: RADIUS.md,
  fontFamily: FONT_FAMILIES.body,
  backgroundColor: '#FFFFFF',
  color: '#111111',
} as const;
