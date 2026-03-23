import { StyleSheet, Platform } from 'react-native';
import { COLORS, SHADOWS, SIZES, RADIUS } from '../constants/theme';

/**
 * Hook providing common design patterns and layout styles for consistent UI.
 */
export default function useThemeStyles() {
  return StyleSheet.create({
    /* Header with top padding for safe area and bottom curves */
    curvedHeader: {
      backgroundColor: COLORS.header,
      paddingTop: Platform.OS === 'ios' ? 60 : 50,
      paddingHorizontal: SIZES.base,
      paddingBottom: SIZES.base + 4,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      ...SHADOWS.lg,
      zIndex: 10,
    },
    
    /* Standard card layout used for products and summary boxes */
    card: {
      backgroundColor: COLORS.white,
      borderRadius: RADIUS.lg,
      padding: SIZES.base,
      ...SHADOWS.sm,
      borderWidth: 1,
      borderColor: COLORS.divider,
    },

    /* Screen container with background color */
    screen: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

    /* Centered empty state container */
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SIZES.xl,
    }
  });
}
