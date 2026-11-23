import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

const sparks = [
  { x: -49, y: -25, size: 15, color: '#E5A11C' },
  { x: 41, y: -35, size: 19, color: '#E5A11C' },
  { x: -54, y: 18, size: 12, color: '#60A9D9' },
  { x: 51, y: 16, size: 13, color: '#60A9D9' },
  { x: -30, y: 43, size: 10, color: '#E5A11C' },
  { x: 32, y: 38, size: 11, color: '#E5A11C' },
] as const;

function Spark({ progress, x, y, size, color }: (typeof sparks)[number] & { progress: SharedValue<number> }) {
  const motion = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.19, 0.48, 1], [0, 0, 1, 0.65]),
    transform: [
      { translateX: x * progress.value },
      { translateY: y * progress.value },
      { scale: interpolate(progress.value, [0, 0.25, 0.63, 1], [0.3, 0.3, 1.15, 1]) },
    ],
  }));
  return <Animated.View style={[styles.spark, motion]}><Ionicons name="sparkles" size={size} color={color} /></Animated.View>;
}

export function PracticeStarCelebration() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  const star = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.22, 1], [0, 1, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 0.44, 0.7, 1], [0.28, 1.17, 0.94, 1]) },
      { rotate: interpolate(progress.value, [0, 0.52, 1], [-30, 8, 0]) + 'deg' },
    ],
  }));
  return (
    <View aria-hidden style={styles.stage}>
      <View style={styles.halo} />
      {sparks.map((spark) => <Spark key={spark.x} progress={progress} {...spark} />)}
      <Animated.View style={[styles.star, star]}><Ionicons name="star" size={55} color="#E9A21A" /></Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: 138, height: 105, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF0C1' },
  star: { shadowColor: '#BD780C', shadowOpacity: 0.24, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5 },
  spark: { position: 'absolute' },
});
