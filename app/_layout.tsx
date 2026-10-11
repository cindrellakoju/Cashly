import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { FinancialProvider, useFinancial } from '@/context/FinancialContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigation() {
  const { theme } = useFinancial();
  const statusBarStyle = theme === 'kawaii' ? 'dark' : 'light';

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
  return (
    <FinancialProvider>
      <RootNavigation />
    </FinancialProvider>
  );
}
