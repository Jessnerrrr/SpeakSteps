import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PatientPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

export function PatientPressable({
  style,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  ...props
}: PatientPressableProps) {
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...props}
      accessibilityRole={accessibilityRole}
      style={[style, motion]}
      onPressIn={(event) => {
        scale.value = withTiming(0.97, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 140 });
        onPressOut?.(event);
      }}
    />
  );
}
