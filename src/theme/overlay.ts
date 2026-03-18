/**
 * Overlay colors for video controls, badges, and tints.
 * Used via style={{ backgroundColor: OVERLAY.* }} since these
 * are semi-transparent values that Uniwind can't generate from className.
 */
export const OVERLAY = {
  /** Standard control background (mute, etc.) */
  bg: 'rgba(0,0,0,0.5)',
  /** Heavier background (duration badge, toggle pill) */
  bgHeavy: 'rgba(0,0,0,0.6)',
  /** Subtle tint over blurred media */
  tint: 'rgba(0,0,0,0.3)',
  /** Highlighted/active state (play button, active toggle) */
  highlight: 'rgba(255,255,255,0.2)',
  /** Foreground (icons/text) on overlay controls — always white */
  fg: '#FFFFFF',
} as const;
