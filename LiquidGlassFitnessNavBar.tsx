/**
 * LiquidGlassFitnessNavBar.tsx
 *
 * Self-contained single-file implementation containing:
 * 1. `LiquidGlassButton` (React Native) — Interactive Apple iOS 26 / visionOS-style
 *    Liquid Glass button with specular refraction rim, press bloom, and spring physics.
 * 2. `LiquidGlassNavBar` (React Native) — Floating Apple-style Liquid Glass navigation bar
 *    with a fluid morphing lens pill, squash-and-stretch spring transitions, chromatic edge
 *    highlights, and a detached floating Liquid Glass Action Orb.
 * 3. `FitnessTrackerApp` (React Native) — Complete Apple Fitness-inspired tracker app
 *    (Summary Rings, Workouts, Activity, Heart Rate, Profile + Quick-Start Workout drawer)
 *    with ambient glowing backdrops that scroll beneath the Liquid Glass bar.
 * 4. `FLUTTER_LIQUID_GLASS_HOST_DART` — Complete Flutter (Dart) host integration &
 *    MethodChannel bridge (`com.fitness.liquidglass/nav`) to communicate with the
 *    React Native Liquid Glass button/navbar in a hybrid Flutter + React Native app.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type FitnessTabId = 'summary' | 'workouts' | 'activity' | 'heart' | 'profile';

export interface NavTabItem {
  id: FitnessTabId;
  label: string;
  icon: string;
  accentColor: string;
  badgeCount?: number;
}

export interface LiquidGlassButtonProps {
  label?: string;
  icon?: string;
  onPress: () => void;
  variant?: 'pill' | 'orb' | 'compact';
  tintColor?: string;
  active?: boolean;
  size?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export interface LiquidGlassNavBarProps {
  tabs: NavTabItem[];
  activeTab: FitnessTabId;
  onSelectTab: (tabId: FitnessTabId) => void;
  onQuickActionPress: () => void;
  quickActionActive?: boolean;
}

// ============================================================================
// HYBRID FLUTTER <-> REACT NATIVE BRIDGE HELPER
// ============================================================================

/**
 * Dispatches navigation and button events from React Native to the Flutter Host
 * when running inside a hybrid Flutter + React Native container, while remaining
 * 100% safe and standalone when running in pure React Native.
 */
class FlutterHybridBridge {
  private static channel = NativeModules?.FlutterLiquidGlassChannel;

  static notifyTabSelected(tabId: FitnessTabId) {
    if (this.channel?.onTabSelected) {
      this.channel.onTabSelected(tabId);
    }
  }

  static notifyButtonPressed(buttonId: string, payload?: Record<string, unknown>) {
    if (this.channel?.onButtonPressed) {
      this.channel.onButtonPressed(buttonId, payload ?? {});
    }
  }
}

// ============================================================================
// DESIGN TOKENS — APPLE FITNESS & LIQUID GLASS PALETTE
// ============================================================================

const COLORS = {
  bgDeep: '#05060A',
  bgCard: 'rgba(24, 26, 36, 0.72)',
  moveRing: '#FA114F',
  exerciseRing: '#A6FF00',
  standRing: '#00F5EA',
  heartRose: '#FF2D55',
  workoutAmber: '#FF9F0A',
  glassSurface: 'rgba(255, 255, 255, 0.085)',
  glassSurfaceStrong: 'rgba(255, 255, 255, 0.14)',
  glassSpecularTop: 'rgba(255, 255, 255, 0.42)',
  glassSpecularBottom: 'rgba(255, 255, 255, 0.12)',
  glassInnerShadow: 'rgba(0, 0, 0, 0.45)',
  glassLensFill: 'rgba(255, 255, 255, 0.16)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(235, 235, 245, 0.65)',
  textMuted: 'rgba(235, 235, 245, 0.38)',
};

const DEFAULT_TABS: NavTabItem[] = [
  {
    id: 'summary',
    label: 'Summary',
    icon: '◎',
    accentColor: COLORS.moveRing,
  },
  {
    id: 'workouts',
    label: 'Workouts',
    icon: '⚡',
    accentColor: COLORS.exerciseRing,
    badgeCount: 2,
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: '✦',
    accentColor: COLORS.standRing,
  },
  {
    id: 'heart',
    label: 'Heart',
    icon: '♥',
    accentColor: COLORS.heartRose,
  },
  {
    id: 'profile',
    label: 'Sharing',
    icon: '◉',
    accentColor: COLORS.workoutAmber,
  },
];

// ============================================================================
// 1. REACT NATIVE LIQUID GLASS BUTTON COMPONENT
// ============================================================================

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  label,
  icon,
  onPress,
  variant = 'pill',
  tintColor = COLORS.exerciseRing,
  active = false,
  size = 56,
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const specularShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(glowAnim, {
      toValue: active ? 1 : 0,
      friction: 7,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [active, glowAnim]);

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(specularShift, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, specularShift]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(specularShift, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, specularShift]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    FlutterHybridBridge.notifyButtonPressed(label || icon || 'liquid_glass_btn', {
      variant,
      active: !active,
      timestamp: Date.now(),
    });
    onPress();
  }, [disabled, label, icon, variant, active, onPress]);

  const dynamicBorderColor = specularShift.interpolate({
    inputRange: [0, 1],
    outputRange: [
      active ? tintColor : COLORS.glassSpecularTop,
      '#FFFFFF',
    ],
  });

  const dynamicInnerGlow = specularShift.interpolate({
    inputRange: [0, 1],
    outputRange: [
      active ? `${tintColor}33` : COLORS.glassSurface,
      `${tintColor}55`,
    ],
  });

  const isOrb = variant === 'orb';
  const containerDimensions: ViewStyle = isOrb
    ? { width: size, height: size, borderRadius: size / 2 }
    : variant === 'compact'
    ? { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }
    : { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 28 };

  return (
    <Animated.View
      style={[
        styles.buttonShadowWrapper,
        {
          transform: [{ scale: scaleAnim }],
          shadowColor: active ? tintColor : '#000000',
        },
        style,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label || 'Liquid Glass Button'}
      >
        <Animated.View
          style={[
            styles.liquidButtonBase,
            containerDimensions,
            {
              backgroundColor: dynamicInnerGlow,
              borderColor: dynamicBorderColor,
            },
          ]}
        >
          {/* Top Specular Refraction Highlight (Apple Liquid Glass signature) */}
          <View
            pointerEvents="none"
            style={[
              styles.buttonTopSpecular,
              {
                borderRadius: isOrb ? size / 2 : 28,
              },
            ]}
          />

          {/* Chromatic Dispersion Rim Accent */}
          <View
            pointerEvents="none"
            style={[
              styles.buttonBottomRefraction,
              {
                borderRadius: isOrb ? size / 2 : 28,
                borderBottomColor: active ? tintColor : 'rgba(0, 245, 234, 0.28)',
              },
            ]}
          />

          {/* Content Row */}
          <View style={styles.buttonContentRow}>
            {icon ? (
              <Text
                style={[
                  styles.buttonIcon,
                  {
                    color: active ? tintColor : COLORS.textPrimary,
                    fontSize: isOrb ? 22 : 16,
                    marginRight: label ? 8 : 0,
                  },
                ]}
              >
                {icon}
              </Text>
            ) : null}
            {label ? (
              <Text
                style={[
                  styles.buttonLabel,
                  { color: active ? tintColor : COLORS.textPrimary },
                  textStyle,
                ]}
              >
                {label}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// 2. APPLE LIQUID GLASS NAVIGATION BAR COMPONENT
// ============================================================================

export const LiquidGlassNavBar: React.FC<LiquidGlassNavBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  onQuickActionPress,
  quickActionActive = false,
}) => {
  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex((t) => t.id === activeTab)),
    [tabs, activeTab]
  );

  // Dimensions for the floating capsule + detached orb layout (Apple iOS 26 style)
  const ORB_SIZE = 58;
  const ORB_GAP = 10;
  const HORIZONTAL_MARGIN = 16;
  const CAPSULE_PADDING = 6;
  const capsuleWidth = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2 - ORB_SIZE - ORB_GAP;
  const tabSlotWidth = (capsuleWidth - CAPSULE_PADDING * 2) / tabs.length;

  // Animated values for fluid lens morphing
  const translateX = useRef(new Animated.Value(activeIndex * tabSlotWidth)).current;
  const lensScaleX = useRef(new Animated.Value(1)).current;
  const lensScaleY = useRef(new Animated.Value(1)).current;
  const lensGlowOpacity = useRef(new Animated.Value(0.85)).current;
  const barFloatAnim = useRef(new Animated.Value(0)).current;

  // Subtle breathing refraction animation on the glass bar
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(barFloatAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(barFloatAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [barFloatAnim]);

  // Animate the Liquid Glass lens pill when activeTab changes
  useEffect(() => {
    const targetX = activeIndex * tabSlotWidth;

    Animated.parallel([
      // Glide lens horizontally with spring physics
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
      // Liquid squash-and-stretch morph during travel
      Animated.sequence([
        Animated.parallel([
          Animated.timing(lensScaleX, {
            toValue: 1.24,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(lensScaleY, {
            toValue: 0.88,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(lensGlowOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(lensScaleX, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.spring(lensScaleY, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.timing(lensGlowOpacity, {
            toValue: 0.78,
            duration: 240,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [activeIndex, tabSlotWidth, translateX, lensScaleX, lensScaleY, lensGlowOpacity]);

  const handleTabPress = useCallback(
    (tabId: FitnessTabId) => {
      FlutterHybridBridge.notifyTabSelected(tabId);
      onSelectTab(tabId);
    },
    [onSelectTab]
  );

  const currentTabObj = tabs[activeIndex] || tabs[0];

  return (
    <View style={styles.navBarOuterWrapper} pointerEvents="box-none">
      <View style={styles.navBarRow}>
        {/* MAIN LIQUID GLASS CAPSULE */}
        <View style={[styles.glassCapsuleOuter, { width: capsuleWidth }]}>
          {/* Layer 1: Deep Frosted Backdrop Tint */}
          <View style={styles.glassBackdropLayer} />

          {/* Layer 2: Ambient Color Bleed from Active Fitness Ring */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeAmbientBleed,
              {
                backgroundColor: currentTabObj.accentColor,
                opacity: lensGlowOpacity.interpolate({
                  inputRange: [0.7, 1],
                  outputRange: [0.1, 0.22],
                }),
                transform: [{ translateX }],
                width: tabSlotWidth,
              },
            ]}
          />

          {/* Layer 3: Top & Bottom Specular Glass Edge Highlights */}
          <View pointerEvents="none" style={styles.capsuleTopHighlight} />
          <View pointerEvents="none" style={styles.capsuleBottomRefraction} />

          {/* Layer 4: Morphing Liquid Glass Selection Pill ("The Lens") */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.liquidLensPill,
              {
                width: tabSlotWidth,
                borderColor: `${currentTabObj.accentColor}66`,
                transform: [
                  { translateX },
                  { scaleX: lensScaleX },
                  { scaleY: lensScaleY },
                ],
              },
            ]}
          >
            {/* Inner Lens Top Specular Glint */}
            <View style={styles.lensTopGlint} />
            {/* Inner Lens Colored Core Glow */}
            <View
              style={[
                styles.lensColorCore,
                { backgroundColor: `${currentTabObj.accentColor}24` },
              ]}
            />
          </Animated.View>

          {/* Layer 5: Interactive Tab Items */}
          <View style={styles.tabsRowContainer}>
            {tabs.map((tab) => {
              const isSelected = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => handleTabPress(tab.id)}
                  style={[styles.tabItemButton, { width: tabSlotWidth }]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={tab.label}
                >
                  <View style={styles.tabIconWrapper}>
                    <Text
                      style={[
                        styles.tabIconText,
                        {
                          color: isSelected ? tab.accentColor : COLORS.textSecondary,
                          transform: [{ scale: isSelected ? 1.15 : 0.96 }],
                        },
                      ]}
                    >
                      {tab.icon}
                    </Text>

                    {tab.badgeCount ? (
                      <View
                        style={[
                          styles.tabBadge,
                          { backgroundColor: COLORS.moveRing },
                        ]}
                      >
                        <Text style={styles.tabBadgeText}>{tab.badgeCount}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabLabelText,
                      {
                        color: isSelected ? COLORS.textPrimary : COLORS.textMuted,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* DETACHED FLOATING LIQUID GLASS ACTION BUTTON (Apple iOS 26 Action Orb) */}
        <LiquidGlassButton
          variant="orb"
          size={ORB_SIZE}
          icon={quickActionActive ? '✕' : '＋'}
          tintColor={COLORS.exerciseRing}
          active={quickActionActive}
          onPress={onQuickActionPress}
          accessibilityLabel="Quick Start Workout"
        />
      </View>
    </View>
  );
};

// ============================================================================
// 3. FITNESS TRACKER APP (SELF-CONTAINED SHOWCASE IN SAME FILE)
// ============================================================================

interface WorkoutPreset {
  id: string;
  title: string;
  subtitle: string;
  kcal: number;
  duration: string;
  color: string;
  icon: string;
}

const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: 'run',
    title: 'Outdoor Run',
    subtitle: 'GPS Pace & Vo2 Max Tracked',
    kcal: 420,
    duration: '35 min',
    color: COLORS.exerciseRing,
    icon: '🏃',
  },
  {
    id: 'hiit',
    title: 'HIIT Metabolic Blast',
    subtitle: 'Zone 4-5 Anaerobic Intervals',
    kcal: 380,
    duration: '25 min',
    color: COLORS.moveRing,
    icon: '🔥',
  },
  {
    id: 'cycle',
    title: 'Indoor Cycling',
    subtitle: 'Cadence & Power Zones',
    kcal: 510,
    duration: '45 min',
    color: COLORS.standRing,
    icon: '🚴',
  },
  {
    id: 'strength',
    title: 'Functional Strength',
    subtitle: 'Upper & Core Hypertrophy',
    kcal: 295,
    duration: '40 min',
    color: COLORS.workoutAmber,
    icon: '🏋️',
  },
];

export const FitnessTrackerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FitnessTabId>('summary');
  const [quickModalVisible, setQuickModalVisible] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPreset | null>(null);
  const [moveCalories, setMoveCalories] = useState(640);
  const [exerciseMinutes, setExerciseMinutes] = useState(42);
  const [standHours, setStandHours] = useState(10);
  const [liveHeartRate, setLiveHeartRate] = useState(118);

  const moveGoal = 750;
  const exerciseGoal = 45;
  const standGoal = 12;

  // Simulate live biometric pulse when a workout is active
  useEffect(() => {
    if (!activeWorkout) return;
    const timer = setInterval(() => {
      setMoveCalories((prev) => prev + 3);
      setLiveHeartRate((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(176, Math.max(112, prev + delta));
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [activeWorkout]);

  const handleStartWorkout = useCallback((workout: WorkoutPreset) => {
    setActiveWorkout(workout);
    setQuickModalVisible(false);
    setActiveTab('workouts');
  }, []);

  const handleBoostMetric = useCallback(() => {
    setMoveCalories((c) => Math.min(moveGoal + 250, c + 45));
    setExerciseMinutes((m) => Math.min(exerciseGoal + 30, m + 5));
    setStandHours((s) => Math.min(standGoal, s + 1));
  }, []);

  return (
    <SafeAreaView style={styles.appSafeArea}>
      <StatusBar barStyle="light-content" />

      {/* Ambient Glowing Background Orbs (makes Liquid Glass refraction pop as content scrolls) */}
      <View pointerEvents="none" style={styles.ambientBackgroundContainer}>
        <View
          style={[
            styles.ambientGlowBlob,
            {
              backgroundColor: COLORS.moveRing,
              top: 60,
              left: -50,
            },
          ]}
        />
        <View
          style={[
            styles.ambientGlowBlob,
            {
              backgroundColor: COLORS.exerciseRing,
              top: 320,
              right: -70,
            },
          ]}
        />
        <View
          style={[
            styles.ambientGlowBlob,
            {
              backgroundColor: COLORS.standRing,
              bottom: 30,
              left: 40,
            },
          ]}
        />
      </View>

      {/* Main Scrollable Viewport (scrolls under the floating Liquid Glass Nav Bar) */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerDateText}>SATURDAY, NOV 7</Text>
            <Text style={styles.headerTitleText}>
              {activeTab === 'summary' && 'Fitness Summary'}
              {activeTab === 'workouts' && 'Workouts & Sessions'}
              {activeTab === 'activity' && 'Daily Activity'}
              {activeTab === 'heart' && 'Cardio & Recovery'}
              {activeTab === 'profile' && 'Sharing & Awards'}
            </Text>
          </View>

          <LiquidGlassButton
            variant="compact"
            icon="⚡"
            label="+Log"
            tintColor={COLORS.exerciseRing}
            onPress={handleBoostMetric}
          />
        </View>

        {/* Active Live Workout Banner (if running) */}
        {activeWorkout ? (
          <View style={styles.liveWorkoutGlassBanner}>
            <View style={styles.liveWorkoutInfo}>
              <Text style={styles.liveBadge}>● LIVE WORKOUT</Text>
              <Text style={styles.liveWorkoutTitle}>
                {activeWorkout.icon} {activeWorkout.title}
              </Text>
              <Text style={styles.liveWorkoutMetrics}>
                {liveHeartRate} BPM  •  {moveCalories} KCAL
              </Text>
            </View>
            <LiquidGlassButton
              variant="compact"
              label="End"
              tintColor={COLORS.moveRing}
              active
              onPress={() => setActiveWorkout(null)}
            />
          </View>
        ) : null}

        {/* APPLE ACTIVITY RINGS HERO CARD */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Activity Rings</Text>
            <Text style={styles.cardSubtitle}>iOS Liquid Glass Edition</Text>
          </View>

          <View style={styles.ringsSectionRow}>
            {/* Concentric Rings Visual */}
            <View style={styles.concentricRingsContainer}>
              {/* Outer Move Ring */}
              <View
                style={[
                  styles.ringBase,
                  {
                    width: 156,
                    height: 156,
                    borderRadius: 78,
                    borderColor: `${COLORS.moveRing}33`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.ringProgressArc,
                    {
                      width: 156,
                      height: 156,
                      borderRadius: 78,
                      borderColor: COLORS.moveRing,
                      transform: [{ rotate: '45deg' }],
                    },
                  ]}
                />
              </View>

              {/* Middle Exercise Ring */}
              <View
                style={[
                  styles.ringBase,
                  {
                    width: 118,
                    height: 118,
                    borderRadius: 59,
                    borderColor: `${COLORS.exerciseRing}33`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.ringProgressArc,
                    {
                      width: 118,
                      height: 118,
                      borderRadius: 59,
                      borderColor: COLORS.exerciseRing,
                      transform: [{ rotate: '75deg' }],
                    },
                  ]}
                />
              </View>

              {/* Inner Stand Ring */}
              <View
                style={[
                  styles.ringBase,
                  {
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderColor: `${COLORS.standRing}33`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.ringProgressArc,
                    {
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderColor: COLORS.standRing,
                      transform: [{ rotate: '30deg' }],
                    },
                  ]}
                />
              </View>

              <Text style={styles.ringCenterPct}>
                {Math.round((moveCalories / moveGoal) * 100)}%
              </Text>
            </View>

            {/* Ring Breakdown Stats */}
            <View style={styles.ringStatsColumn}>
              <View style={styles.ringStatItem}>
                <Text style={[styles.ringStatLabel, { color: COLORS.moveRing }]}>
                  MOVE
                </Text>
                <Text style={styles.ringStatValue}>
                  {moveCalories}/{moveGoal}
                  <Text style={styles.ringStatUnit}> KCAL</Text>
                </Text>
              </View>

              <View style={styles.ringStatItem}>
                <Text style={[styles.ringStatLabel, { color: COLORS.exerciseRing }]}>
                  EXERCISE
                </Text>
                <Text style={styles.ringStatValue}>
                  {exerciseMinutes}/{exerciseGoal}
                  <Text style={styles.ringStatUnit}> MIN</Text>
                </Text>
              </View>

              <View style={styles.ringStatItem}>
                <Text style={[styles.ringStatLabel, { color: COLORS.standRing }]}>
                  STAND
                </Text>
                <Text style={styles.ringStatValue}>
                  {standHours}/{standGoal}
                  <Text style={styles.ringStatUnit}> HRS</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* INTERACTIVE LIQUID GLASS BUTTONS BAR IN CONTENT */}
        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>React Native Liquid Glass Buttons</Text>
          <Text style={styles.cardBodyText}>
            Press and hold any button below to test the specular highlight shift,
            chromatic edge refraction, and spring scale response.
          </Text>
          <View style={styles.demoButtonsRow}>
            <LiquidGlassButton
              icon="🏃"
              label="Start Run"
              tintColor={COLORS.exerciseRing}
              active={activeWorkout?.id === 'run'}
              onPress={() => handleStartWorkout(WORKOUT_PRESETS[0])}
            />
            <LiquidGlassButton
              icon="♥"
              label={`${liveHeartRate} BPM`}
              tintColor={COLORS.heartRose}
              active={activeTab === 'heart'}
              onPress={() => setActiveTab('heart')}
            />
          </View>
        </View>

        {/* WORKOUT PRESETS LIST */}
        <Text style={styles.sectionHeaderTitle}>Quick-Start Workouts</Text>
        {WORKOUT_PRESETS.map((workout) => {
          const isRunning = activeWorkout?.id === workout.id;
          return (
            <View key={workout.id} style={styles.workoutRowCard}>
              <View
                style={[
                  styles.workoutIconBadge,
                  { backgroundColor: `${workout.color}22` },
                ]}
              >
                <Text style={styles.workoutEmoji}>{workout.icon}</Text>
              </View>
              <View style={styles.workoutTextColumn}>
                <Text style={styles.workoutTitleText}>{workout.title}</Text>
                <Text style={styles.workoutSubText}>
                  {workout.duration} • {workout.kcal} KCAL • {workout.subtitle}
                </Text>
              </View>
              <LiquidGlassButton
                variant="compact"
                label={isRunning ? 'Active' : 'Go'}
                tintColor={workout.color}
                active={isRunning}
                onPress={() => handleStartWorkout(workout)}
              />
            </View>
          );
        })}

        {/* BIOMETRIC METRICS GRID */}
        <View style={styles.metricsGridRow}>
          <View style={[styles.glassCard, styles.metricHalfCard]}>
            <Text style={[styles.metricTag, { color: COLORS.standRing }]}>
              STEPS & DISTANCE
            </Text>
            <Text style={styles.metricBigNumber}>11,482</Text>
            <Text style={styles.metricSubLabel}>8.94 km covered today</Text>
          </View>

          <View style={[styles.glassCard, styles.metricHalfCard]}>
            <Text style={[styles.metricTag, { color: COLORS.heartRose }]}>
              VO₂ MAX CARDIO
            </Text>
            <Text style={styles.metricBigNumber}>54.2</Text>
            <Text style={styles.metricSubLabel}>mL/kg/min • High Fitness</Text>
          </View>
        </View>
      </ScrollView>

      {/* FLOATING APPLE LIQUID GLASS NAVIGATION BAR */}
      <LiquidGlassNavBar
        tabs={DEFAULT_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        quickActionActive={quickModalVisible}
        onQuickActionPress={() => setQuickModalVisible((v) => !v)}
      />

      {/* QUICK-START WORKOUT MODAL (Triggered by the Floating Liquid Glass Orb) */}
      <Modal
        visible={quickModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQuickModalVisible(false)}
        >
          <View style={styles.modalGlassSheet}>
            <View style={styles.modalTopHandle} />
            <Text style={styles.modalTitle}>Start a Workout</Text>
            <Text style={styles.modalSubtitle}>
              Select an activity to launch live heart-rate and ring tracking
            </Text>

            {WORKOUT_PRESETS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleStartWorkout(item)}
                style={styles.modalOptionRow}
              >
                <Text style={styles.modalOptionEmoji}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionTitle}>{item.title}</Text>
                  <Text style={styles.modalOptionMeta}>
                    {item.duration} • Target {item.kcal} KCAL
                  </Text>
                </View>
                <Text style={[styles.modalStartArrow, { color: item.color }]}>
                  Start →
                </Text>
              </Pressable>
            ))}

            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <LiquidGlassButton
                label="Close Sheet"
                icon="✕"
                tintColor={COLORS.moveRing}
                onPress={() => setQuickModalVisible(false)}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default FitnessTrackerApp;

// ============================================================================
// 4. FLUTTER HOST & HYBRID BRIDGE (DART CODE INCLUDED IN THIS SINGLE FILE)
// ============================================================================

/**
 * Complete Flutter host widget + MethodChannel bridge for embedding or pairing
 * the React Native Liquid Glass Button & Navigation Bar inside a Flutter app.
 */
export const FLUTTER_LIQUID_GLASS_HOST_DART = `
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class FlutterLiquidGlassFitnessHost extends StatefulWidget {
  const FlutterLiquidGlassFitnessHost({super.key});

  @override
  State<FlutterLiquidGlassFitnessHost> createState() =>
      _FlutterLiquidGlassFitnessHostState();
}

class _FlutterLiquidGlassFitnessHostState
    extends State<FlutterLiquidGlassFitnessHost> {
  static const MethodChannel _channel =
      MethodChannel('com.fitness.liquidglass/nav');

  String _activeTab = 'summary';
  String _lastButtonEvent = 'Ready';

  @override
  void initState() {
    super.initState();
    _channel.setMethodCallHandler((MethodCall call) async {
      if (call.method == 'onTabSelected') {
        setState(() => _activeTab = call.arguments as String);
      } else if (call.method == 'onButtonPressed') {
        setState(() => _lastButtonEvent = call.arguments.toString());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF05060A),
      body: Stack(
        children: [
          // Host Flutter Fitness View
          Center(
            child: Text(
              'Active Tab from RN Liquid Glass Bar: \$_activeTab\\nLast Button Event: \$_lastButtonEvent',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
          ),
          // Native PlatformView slot where the React Native LiquidGlassNavBar mounts
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24, left: 16, right: 16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(36),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
                  child: Container(
                    height: 68,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(36),
                      color: Colors.white.withOpacity(0.09),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.35),
                        width: 1.1,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
`;

// ============================================================================
// STYLESHEET (APPLE LIQUID GLASS & FITNESS TRACKER UI)
// ============================================================================

const styles = StyleSheet.create({
  appSafeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  ambientBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientGlowBlob: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 130, // Leaves room so content scrolls beneath the Liquid Glass Nav Bar
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerDateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerTitleText: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // Live Workout Banner
  liveWorkoutGlassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(166, 255, 0, 0.12)',
    borderColor: 'rgba(166, 255, 0, 0.45)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  liveWorkoutInfo: {
    flex: 1,
    marginRight: 12,
  },
  liveBadge: {
    color: COLORS.exerciseRing,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveWorkoutTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  liveWorkoutMetrics: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  // Glass Cards
  glassCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  cardBodyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 14,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Concentric Activity Rings
  ringsSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  concentricRingsContainer: {
    width: 164,
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBase: {
    position: 'absolute',
    borderWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringProgressArc: {
    position: 'absolute',
    borderWidth: 14,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringCenterPct: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  ringStatsColumn: {
    flex: 1,
    paddingLeft: 20,
    gap: 12,
  },
  ringStatItem: {
    marginBottom: 2,
  },
  ringStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ringStatValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  ringStatUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Workout List Cards
  sectionHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  workoutRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 22,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workoutIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  workoutEmoji: {
    fontSize: 22,
  },
  workoutTextColumn: {
    flex: 1,
    marginRight: 10,
  },
  workoutTitleText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  workoutSubText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  // Metrics Grid
  metricsGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  metricHalfCard: {
    flex: 1,
    marginBottom: 0,
  },
  metricTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  metricBigNumber: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  metricSubLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  // ==========================================================================
  // LIQUID GLASS BUTTON STYLES
  // ==========================================================================
  buttonShadowWrapper: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 10,
  },
  liquidButtonBase: {
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonTopSpecular: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
  },
  buttonBottomRefraction: {
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: 1.5,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontWeight: '700',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ==========================================================================
  // APPLE LIQUID GLASS NAVIGATION BAR STYLES
  // ==========================================================================
  navBarOuterWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 24 : 18,
    paddingHorizontal: 16,
  },
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassCapsuleOuter: {
    height: 68,
    borderRadius: 34,
    padding: 6,
    backgroundColor: 'rgba(18, 20, 28, 0.78)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 18,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  glassBackdropLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glassSurface,
  },
  activeAmbientBleed: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 6,
    borderRadius: 28,
  },
  capsuleTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  capsuleBottomRefraction: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(0, 245, 234, 0.28)',
  },
  liquidLensPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 28,
    backgroundColor: COLORS.glassLensFill,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  lensTopGlint: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  lensColorCore: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  tabsRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  tabItemButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 19,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -11,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabelText: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: 0.1,
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalGlassSheet: {
    backgroundColor: 'rgba(22, 25, 36, 0.96)',
    borderRadius: 32,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 16,
  },
  modalTopHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalOptionEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  modalOptionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOptionMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalStartArrow: {
    fontSize: 14,
    fontWeight: '800',
  },
});
