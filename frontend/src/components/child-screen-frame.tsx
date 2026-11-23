import type { PropsWithChildren } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const childScreenColors = {
  canvas: '#E7F2FA',
  surface: '#FFFFFF',
  accent: '#0865AD',
};

export function ChildScreenFrame({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/split-bg.png')}
        style={styles.background}
        imageStyle={styles.pattern}
        resizeMode="cover"
      >
        <View style={styles.frame}>{children}</View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#8CBFE6' },
  background: { flex: 1, overflow: 'hidden', backgroundColor: '#8CBFE6', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6 },
  pattern: { opacity: 0.25 },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: childScreenColors.canvas,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#C7DFEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
});
