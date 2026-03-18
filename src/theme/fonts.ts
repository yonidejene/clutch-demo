import { StyleSheet } from 'react-native';

export const FONT_FAMILIES = {
  heading: 'MonaSansExpanded-Bold',
  body: 'MonaSans-Regular',
} as const;

export const FONTS = StyleSheet.create({
  heading: { fontFamily: FONT_FAMILIES.heading },
  body: { fontFamily: FONT_FAMILIES.body },
});
