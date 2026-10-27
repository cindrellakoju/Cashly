import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '@/context/FinancialContext';
import { HapticTab } from '@/components/haptic-tab';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { WelcomeSplashScreen } from '@/components/WelcomeSplashScreen';

export default function TabLayout() {
  const { colors, isAdminMode, hasCompletedOnboarding, isWelcomeActive, setIsWelcomeActive, isDbLoaded } = useFinancial();

  if (!isDbLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: colors.activeTabTint,
          tabBarInactiveTintColor: colors.inactiveTabTint,
          tabBarStyle: {
            display: (isAdminMode || !hasCompletedOnboarding || isWelcomeActive) ? 'none' : 'flex',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            paddingTop: 8,
            shadowColor: colors.cardShadow.shadowColor,
            shadowOffset: colors.cardShadow.shadowOffset,
            shadowOpacity: colors.cardShadow.shadowOpacity,
            shadowRadius: colors.cardShadow.shadowRadius,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="debit-credit"
          options={{
            title: 'Debt & Credit',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} size={24} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Wishlist',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'gift' : 'gift-outline'} size={24} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Accounts',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={24} color={color as string} />
            ),
          }}
        />
        {/* Hide old explore route if present */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Admin overlay — shown on top of every tab when isAdminMode is active */}
      {isAdminMode && (
        <View style={[styles.adminOverlay, { backgroundColor: colors.bgPrimary }]}>
          <AdminDashboardView />
        </View>
      )}

      {/* Welcome Screen Overlay — shown above everything without bottom nav */}
      {isWelcomeActive && (
        <View style={styles.welcomeOverlay}>
          <WelcomeSplashScreen onFinish={() => setIsWelcomeActive(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  adminOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 200,
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
  },
});
