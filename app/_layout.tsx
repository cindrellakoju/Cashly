import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import { FinancialProvider, useFinancial } from '@/context/FinancialContext';

// Keep native splash screen visible while loading cursive handwriting fonts
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigation() {
  const { theme, isDbLoaded } = useFinancial();
  const statusBarStyle = theme === 'kawaii' ? 'dark' : 'light';

  useEffect(() => {
    if (isDbLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isDbLoaded]);

  if (!isDbLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Details' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    GreatVibes: require('@/assets/fonts/GreatVibes-Regular.ttf'),
    DancingScript: require('@/assets/fonts/DancingScript-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <FinancialProvider>
      <RootNavigation />
    </FinancialProvider>
  );
}
