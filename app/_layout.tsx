"use no memo";
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useCallback } from 'react';
import Animated, { FadeOut, FadeIn, FadeInDown, Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '../database/db';
import { processScheduledTransactions } from '../utils/scheduler';
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [dbReady, setDbReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  
  // Cinematic continuous zoom state for premium feel
  const scale = useSharedValue(0.95);

  const cinematicZoom = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Handle errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Handle DB Initialization
  const onDbInit = useCallback(async (db: any) => {
    try {
      await migrateDbIfNeeded(db);
      await processScheduledTransactions(db);
      setDbReady(true);
    } catch (e) {
      console.error('DB Migration failed:', e);
      setDbReady(true); // Proceed anyway to avoid locking the user out
    }
  }, []);

  const isAppReady = loaded && dbReady;

  useEffect(() => {
    if (isAppReady) {
      // Hide the native splash screen smoothly
      SplashScreen.hideAsync().catch(() => {});
      
      // Start the ultra-slow cinematic zoom
      // eslint-disable-next-line react-hooks/immutability
      scale.value = withTiming(1.02, { duration: 4000, easing: Easing.out(Easing.cubic) });
      
      // Hold the custom JS splash screen for 3 seconds for the cinematic effect
      setTimeout(() => {
        setSplashAnimationComplete(true);
      }, 3000);

      // Add Premium Haptics that trigger exactly when the elements fade in
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, 300); // Triggers with "YTUZO"
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, 800); // Triggers with Logo
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }, 1500); // Triggers with Slogan
    }
  }, [isAppReady, scale]);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <ThemeProvider value={DarkTheme}>
        <SQLiteProvider databaseName="ytuzo.db" onInit={onDbInit}>
          <View style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </View>
        </SQLiteProvider>
      </ThemeProvider>
      
      {/* Premium Cinematic Splash Screen Overlay */}
      {!splashAnimationComplete && (
        <Animated.View 
          pointerEvents="none"
          exiting={FadeOut.duration(1500).easing(Easing.inOut(Easing.ease))} 
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}
        >
          <Animated.View style={[{ alignItems: 'center' }, cinematicZoom]}>
            {/* Brand Name (Executive Layout) */}
            <Animated.Text 
              entering={FadeIn.duration(1500).delay(300).easing(Easing.out(Easing.ease))}
              style={{ 
                color: '#FFFFFF', // Back to pure white for ultra-high contrast
                fontSize: 32,
                fontWeight: '200', // Ultra-Light font gives the executive/bank feel
                letterSpacing: 22, // Extreme tracking
                textTransform: 'uppercase',
                marginLeft: 22, // offset letterSpacing
                marginBottom: 36, // Space before the emblem
              }}
            >
              YTUZO
            </Animated.Text>

            {/* Aesthetic Luxury Logo Animation (Acts as an emblem) */}
            <Animated.Image 
              entering={FadeInDown.duration(1200).delay(800).easing(Easing.out(Easing.exp))} 
              source={require('../assets/images/splash_v2.png')} 
              style={{ width: 75, height: 75, resizeMode: 'contain', marginBottom: 32 }} 
            />

            {/* Subtitle / Slogan */}
            <Animated.Text 
              entering={FadeIn.duration(1500).delay(1500).easing(Easing.out(Easing.ease))}
              style={{ 
                color: '#8A8A93', 
                fontSize: 8,
                fontWeight: '400', 
                letterSpacing: 6, 
                lineHeight: 18, 
                textTransform: 'uppercase',
                marginLeft: 6,
                textAlign: 'center',
              }}
            >
              Your Tracker{'\n'}a Universal Zen Organizer
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
