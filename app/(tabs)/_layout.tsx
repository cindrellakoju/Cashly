import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, ImageBackground } from 'react-native';
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
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <ImageBackground
        source={require('@/assets/images/grid_paper.png')}
        resizeMode="repeat"
        style={styles.gridBg}
        imageStyle={{ opacity: 0.85 }}
      >
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarActiveTintColor: colors.activeTabTint,
            tabBarInactiveTintColor: colors.inactiveTabTint,
            sceneStyle: { backgroundColor: 'transparent' },
            tabBarStyle: {
              display: (isAdminMode || !hasCompletedOnboarding || isWelcomeActive) ? 'none' : 'flex',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              backgroundColor: colors.tabBarBg,
              borderTopColor: 'transparent',
              borderTopWidth: 0,
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingBottom: Platform.OS === 'ios' ? 28 : 10,
              paddingTop: 8,
              shadowColor: '#28452D',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 8,
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
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gridBg: {
    flex: 1,
    width: '100%',
    height: '100%',
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
