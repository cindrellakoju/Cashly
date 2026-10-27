import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFinancial } from '@/context/FinancialContext';

const { width, height } = Dimensions.get('window');

interface WelcomeSplashScreenProps {
  onFinish: () => void;
  autoDismissDelay?: number; // ms to auto dismiss (default: 0 = disabled, waits for tap)
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({
  onFinish,
  autoDismissDelay = 0,
}) => {
  const { theme } = useFinancial();
  const isKawaii = theme === 'kawaii';

  // Theme-aware colors
  const bgColor = isKawaii ? '#FDF9EE' : '#0D0D0F';
  const textColor = isKawaii ? '#243326' : '#F4F4F5';
  const cursiveAccentColor = isKawaii ? '#3c7a45' : '#4ade80';
  const flourishColor = isKawaii ? '#86c28f' : '#22c55e';
  const subtextColor = isKawaii ? '#788c7b' : '#a1a1aa';
  const glowColor = isKawaii ? 'rgba(101, 168, 101, 0.15)' : 'rgba(74, 222, 128, 0.18)';

  // Texts to write
  const fullLine1 = 'welcome to';
  const fullLine2 = 'cashly';

  // Displayed writing text states
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');

  // Main screen fade/scale animation for dismiss
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  const screenScaleAnim = useRef(new Animated.Value(1)).current;

  // Icon floating animations
  const iconFadeAnim = useRef(new Animated.Value(0)).current;
  const iconTranslateAnim = useRef(new Animated.Value(15)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.85)).current;

  // Sparkle star animations
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0.5)).current;

  // Flourish underline width animation
  const flourishAnim = useRef(new Animated.Value(0)).current;

  // Subtitle & tap prompt animations
  const subtextFadeAnim = useRef(new Animated.Value(0)).current;
  const tapPromptFadeAnim = useRef(new Animated.Value(0)).current;

  const [isDismissing, setIsDismissing] = useState(false);
  const dismissTimerRef = useRef<any>(null);

  const handleDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    // Ensure full text is filled immediately on tap
    setText1(fullLine1);
    setText2(fullLine2);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    Animated.parallel([
      Animated.timing(screenFadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(screenScaleAnim, {
        toValue: 1.04,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  };

  useEffect(() => {
    let isCancelled = false;

    // 1. App icon reveal animation
    Animated.parallel([
      Animated.timing(iconFadeAnim, {
        toValue: 1,
        duration: 450,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.spring(iconTranslateAnim, {
        toValue: 0,
        friction: 6,
        tension: 50,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Start handwriting Line 1 ("welcome to") character-by-character
    const startTimer = setTimeout(() => {
      if (isCancelled) return;
      let idx1 = 0;
      const interval1 = setInterval(() => {
        if (isCancelled) {
          clearInterval(interval1);
          return;
        }
        idx1++;
        setText1(fullLine1.slice(0, idx1));

        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}

        if (idx1 >= fullLine1.length) {
          clearInterval(interval1);

          // 3. Short natural calligraphy pause, then write Line 2 ("cashly")
          setTimeout(() => {
            if (isCancelled) return;
            let idx2 = 0;
            const interval2 = setInterval(() => {
              if (isCancelled) {
                clearInterval(interval2);
                return;
              }
              idx2++;
              setText2(fullLine2.slice(0, idx2));

              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}

              if (idx2 >= fullLine2.length) {
                clearInterval(interval2);

                // 4. Sparkle star pop at the tail of cashly
                Animated.parallel([
                  Animated.timing(sparkleOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                  }),
                  Animated.spring(sparkleScale, {
                    toValue: 1.25,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  Animated.loop(
                    Animated.sequence([
                      Animated.timing(sparkleScale, {
                        toValue: 1.3,
                        duration: 700,
                        useNativeDriver: true,
                      }),
                      Animated.timing(sparkleScale, {
                        toValue: 0.95,
                        duration: 700,
                        useNativeDriver: true,
                      }),
                    ])
                  ).start();
                });

                // 5. Draw flourish calligraphic underline
                Animated.timing(flourishAnim, {
                  toValue: 1,
                  duration: 450,
                  useNativeDriver: false,
                }).start(() => {
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch {}
                });

                // 6. Reveal subtitle & tap prompt
                Animated.timing(subtextFadeAnim, {
                  toValue: 1,
                  duration: 400,
                  delay: 120,
                  useNativeDriver: true,
                }).start();

                Animated.timing(tapPromptFadeAnim, {
                  toValue: 1,
                  duration: 500,
                  delay: 300,
                  useNativeDriver: true,
                }).start();

                // Auto dismiss ONLY if explicitly requested (> 0)
                if (autoDismissDelay && autoDismissDelay > 0) {
                  dismissTimerRef.current = setTimeout(() => {
                    handleDismiss();
                  }, autoDismissDelay);
                }
              }
            }, 85);
          }, 150);
        }
      }, 70);
    }, 320);

    return () => {
      isCancelled = true;
      clearTimeout(startTimer);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  // Calculate flourish underline width
  const flourishWidth = flourishAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: bgColor,
          opacity: screenFadeAnim,
          transform: [{ scale: screenScaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        {/* Ambient Radial Glow */}
        <View style={[styles.ambientGlow, { backgroundColor: glowColor }]} />

        {/* Floating App Icon / Mascot */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: iconFadeAnim,
              transform: [
                { translateY: iconTranslateAnim },
                { scale: iconScaleAnim },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Center Cursive Calligraphy Section */}
        <View style={styles.textContainer}>
          {/* Line 1: "welcome to" */}
          <View style={styles.wordBox}>
            {/* Ghost text anchors permanent layout and centering so zero jumping occurs */}
            <Text style={[styles.cursiveLine1, { opacity: 0 }]} accessible={false}>
              {fullLine1}
            </Text>
            {/* Active writing cursive text */}
            <View style={styles.absoluteTextWrapper}>
              <Text
                numberOfLines={1}
                style={[styles.cursiveLine1, { color: textColor }]}
              >
                {text1}
              </Text>
            </View>
          </View>

          {/* Line 2: "cashly" */}
          <View style={styles.line2Row}>
            <View style={styles.wordBox}>
              {/* Ghost text anchors permanent layout and centering */}
              <Text style={[styles.cursiveLine2, { opacity: 0 }]} accessible={false}>
                {fullLine2}
              </Text>
              {/* Active writing cursive text */}
              <View style={styles.absoluteTextWrapper}>
                <Text
                  numberOfLines={1}
                  style={[styles.cursiveLine2, { color: cursiveAccentColor }]}
                >
                  {text2}
                </Text>
              </View>
            </View>

            {/* Sparkle star at the tail of cashly */}
            <Animated.Text
              style={[
                styles.sparkleStar,
                {
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              ✨
            </Animated.Text>
          </View>

          {/* Flourish Calligraphic Underline */}
          <View style={styles.flourishContainer}>
            <Animated.View
              style={[
                styles.flourishLine,
                {
                  width: flourishWidth,
                  backgroundColor: flourishColor,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.flourishDot,
                {
                  opacity: flourishAnim,
                  backgroundColor: cursiveAccentColor,
                },
              ]}
            />
          </View>

          {/* Elegant Minimalist Tagline */}
          <Animated.Text
            style={[
              styles.subtitle,
              {
                color: subtextColor,
                opacity: subtextFadeAnim,
              },
            ]}
          >
            PERSONAL FINANCE &amp; TRACKER
          </Animated.Text>
        </View>

        {/* Bottom "Tap anywhere to continue" hint */}
        <Animated.View
          style={[
            styles.bottomPrompt,
            {
              opacity: tapPromptFadeAnim,
            },
          ]}
        >
          <Text style={[styles.bottomPromptText, { color: subtextColor }]}>
            tap anywhere to continue
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    top: height * 0.22,
    left: (width - width * 0.9) / 2,
  },
  iconWrapper: {
    marginBottom: 20,
    shadowColor: '#2b5936',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  wordBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 4,
    overflow: 'visible',
  },
  absoluteTextWrapper: {
    position: 'absolute',
    left: 28,
    top: 4,
    right: 28,
    bottom: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'visible',
  },
  line2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cursiveLine1: {
    fontFamily: Platform.select({
      ios: 'GreatVibes',
      android: 'GreatVibes',
      web: "'GreatVibes', 'Dancing Script', 'Snell Roundhand', 'Brush Script MT', cursive",
      default: 'GreatVibes',
    }),
    fontSize: 42,
    lineHeight: 56,
    includeFontPadding: false,
    letterSpacing: 0,
    overflow: 'visible',
  },
  cursiveLine2: {
    fontFamily: Platform.select({
      ios: 'GreatVibes',
      android: 'GreatVibes',
      web: "'GreatVibes', 'Dancing Script', 'Snell Roundhand', 'Brush Script MT', cursive",
      default: 'GreatVibes',
    }),
    fontSize: 60,
    lineHeight: 82,
    fontWeight: '400',
    includeFontPadding: false,
    letterSpacing: 0,
    overflow: 'visible',
  },
  sparkleStar: {
    fontSize: 22,
    marginLeft: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  flourishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 16,
    height: 8,
  },
  flourishLine: {
    height: 2.5,
    borderRadius: 2,
  },
  flourishDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  bottomPrompt: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 36,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  bottomPromptText: {
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
});
