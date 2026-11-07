/**
 * LiquidGlassFitnessNavBar.tsx
 *
 * Self-contained React Native (TSX) implementation of the Apple Liquid Glass
 * Navigation Bar, Liquid Glass Button (`LiquidGlassButton`), and Fitness Tracker
 * App, paired with the Flutter `liquid_glass_renderer` hybrid MethodChannel bridge
 * (`see also: ./liquid_glass_fitness_navbar.dart`).
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type FitnessTabId = 'summary' | 'workouts' | 'activity' | 'heart' | 'sharing';

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

/**
 * Sends button & tab events to the Flutter `liquid_glass_renderer` host
 * (`com.fitness.liquidglass/nav`) when mounted in a hybrid Flutter + RN app.
 */
class FlutterLiquidGlassBridge {
  private static channel = NativeModules?.FlutterLiquidGlassChannel;

  static notifyTabSelected(tabId: FitnessTabId) {
    if (this.channel?.onTabSelected) {
      this.channel.onTabSelected(tabId);
    }
  }

  static notifyButtonPressed(buttonId: string, payload?: Record<string, unknown>) {
    if (this.channel?.onButtonPressed) {
      this.channel.onButtonPressed({ buttonId, ...payload });
    }
  }
}

const COLORS = {
  bgDeep: '#05060A',
  bgCard: 'rgba(22, 24, 36, 0.74)',
  moveRing: '#FA114F',
  exerciseRing: '#A6FF00',
  standRing: '#00F5EA',
  heartRose: '#FF2D55',
  sharingAmber: '#FF9F0A',
  glassSurface: 'rgba(255, 255, 255, 0.09)',
  glassSpecularTop: 'rgba(255, 255, 255, 0.45)',
  glassLensFill: 'rgba(255, 255, 255, 0.16)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(235, 235, 245, 0.65)',
  textMuted: 'rgba(235, 235, 245, 0.40)',
};

const DEFAULT_TABS: NavTabItem[] = [
  { id: 'summary', label: 'Summary', icon: '◎', accentColor: COLORS.moveRing },
  {
    id: 'workouts',
    label: 'Workouts',
    icon: '⚡',
    accentColor: COLORS.exerciseRing,
    badgeCount: 2,
  },
  { id: 'activity', label: 'Activity', icon: '✦', accentColor: COLORS.standRing },
  { id: 'heart', label: 'Heart', icon: '♥', accentColor: COLORS.heartRose },
  { id: 'sharing', label: 'Sharing', icon: '◉', accentColor: COLORS.sharingAmber },
];

// ============================================================================
// 1. REACT NATIVE LIQUID GLASS BUTTON
// ============================================================================

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  label,
  icon,
  onPress,
  variant = 'pill',
  tintColor = COLORS.exerciseRing,
  active = false,
  size = 60,
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const specularShift = useRef(new Animated.Value(0)).current;

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
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, specularShift]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(specularShift, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, specularShift]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    FlutterLiquidGlassBridge.notifyButtonPressed(label || icon || 'liquid_btn', {
      variant,
      active: !active,
    });
    onPress();
  }, [disabled, label, icon, variant, active, onPress]);

  const borderColor = specularShift.interpolate({
    inputRange: [0, 1],
    outputRange: [active ? tintColor : COLORS.glassSpecularTop, '#FFFFFF'],
  });

  const surfaceTint = specularShift.interpolate({
    inputRange: [0, 1],
    outputRange: [
      active ? `${tintColor}33` : COLORS.glassSurface,
      `${tintColor}55`,
    ],
  });

  const isOrb = variant === 'orb';
  const boxStyle: ViewStyle = isOrb
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
            boxStyle,
            { backgroundColor: surfaceTint, borderColor },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.buttonTopSpecular,
              { borderRadius: isOrb ? size / 2 : 28 },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.buttonBottomRefraction,
              {
                borderRadius: isOrb ? size / 2 : 28,
                borderBottomColor: active ? tintColor : 'rgba(0, 245, 234, 0.30)',
              },
            ]}
          />
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
// 2. APPLE LIQUID GLASS NAVIGATION BAR (REACT NATIVE)
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

  const ORB_SIZE = 60;
  const ORB_GAP = 10;
  const HORIZONTAL_MARGIN = 16;
  const CAPSULE_PADDING = 6;
  const capsuleWidth = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2 - ORB_SIZE - ORB_GAP;
  const tabSlotWidth = (capsuleWidth - CAPSULE_PADDING * 2) / tabs.length;

  const translateX = useRef(new Animated.Value(activeIndex * tabSlotWidth)).current;
  const lensScaleX = useRef(new Animated.Value(1)).current;
  const lensScaleY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetX = activeIndex * tabSlotWidth;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 16,
        stiffness: 185,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(lensScaleX, {
            toValue: 1.22,
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
        ]),
        Animated.parallel([
          Animated.spring(lensScaleX, {
            toValue: 1,
            friction: 5,
            tension: 125,
            useNativeDriver: true,
          }),
          Animated.spring(lensScaleY, {
            toValue: 1,
            friction: 5,
            tension: 125,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [activeIndex, tabSlotWidth, translateX, lensScaleX, lensScaleY]);

  const currentTab = tabs[activeIndex] || tabs[0];

  return (
    <View style={styles.navBarOuterWrapper} pointerEvents="box-none">
      <View style={styles.navBarRow}>
        <View style={[styles.glassCapsuleOuter, { width: capsuleWidth }]}>
          <View style={styles.glassBackdropLayer} />
          <View pointerEvents="none" style={styles.capsuleTopHighlight} />
          <View pointerEvents="none" style={styles.capsuleBottomRefraction} />

          {/* Sliding Liquid Glass Loupe Pill */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.liquidLensPill,
              {
                width: tabSlotWidth,
                borderColor: `${currentTab.accentColor}66`,
                transform: [
                  { translateX },
                  { scaleX: lensScaleX },
                  { scaleY: lensScaleY },
                ],
              },
            ]}
          >
            <View style={styles.lensTopGlint} />
            <View
              style={[
                styles.lensColorCore,
                { backgroundColor: `${currentTab.accentColor}26` },
              ]}
            />
          </Animated.View>

          <View style={styles.tabsRowContainer}>
            {tabs.map((tab) => {
              const isSelected = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    FlutterLiquidGlassBridge.notifyTabSelected(tab.id);
                    onSelectTab(tab.id);
                  }}
                  style={[styles.tabItemButton, { width: tabSlotWidth }]}
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
                      <View style={styles.tabBadge}>
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

        {/* Detached Floating Liquid Glass Action Button */}
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
// 3. COMPLETE FITNESS TRACKER APP
// ============================================================================

export const FitnessTrackerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FitnessTabId>('summary');
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [moveKcal, setMoveKcal] = useState(640);
  const [exerciseMin, setExerciseMin] = useState(42);
  const [standHrs, setStandHrs] = useState(10);

  return (
    <SafeAreaView style={styles.appSafeArea}>
      <StatusBar barStyle="light-content" />

      {/* Ambient Glowing Blobs Behind the Liquid Glass Bar */}
      <View pointerEvents="none" style={styles.ambientBackgroundContainer}>
        <View
          style={[
            styles.ambientGlowBlob,
            { backgroundColor: COLORS.moveRing, top: 70, left: -50 },
          ]}
        />
        <View
          style={[
            styles.ambientGlowBlob,
            { backgroundColor: COLORS.exerciseRing, top: 330, right: -60 },
          ]}
        />
        <View
          style={[
            styles.ambientGlowBlob,
            { backgroundColor: COLORS.standRing, bottom: 25, left: 40 },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerDateText}>SATURDAY, NOV 7</Text>
            <Text style={styles.headerTitleText}>Fitness Summary</Text>
          </View>
          <LiquidGlassButton
            variant="compact"
            icon="⚡"
            label="+Log Ring"
            tintColor={COLORS.exerciseRing}
            onPress={() => {
              setMoveKcal((v) => v + 35);
              setExerciseMin((v) => v + 4);
              setStandHrs((v) => Math.min(12, v + 1));
            }}
          />
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>Activity Rings</Text>
          <View style={styles.ringsRow}>
            <View style={styles.ringColumn}>
              <Text style={[styles.ringLabel, { color: COLORS.moveRing }]}>
                MOVE
              </Text>
              <Text style={styles.ringValue}>{moveKcal}/750 KCAL</Text>
              <Text style={[styles.ringLabel, { color: COLORS.exerciseRing }]}>
                EXERCISE
              </Text>
              <Text style={styles.ringValue}>{exerciseMin}/45 MIN</Text>
              <Text style={[styles.ringLabel, { color: COLORS.standRing }]}>
                STAND
              </Text>
              <Text style={styles.ringValue}>{standHrs}/12 HRS</Text>
            </View>
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>React Native Liquid Glass Buttons</Text>
          <View style={styles.demoButtonsRow}>
            <LiquidGlassButton
              icon="🏃"
              label="Outdoor Run"
              tintColor={COLORS.exerciseRing}
              onPress={() => setActiveTab('workouts')}
            />
            <LiquidGlassButton
              icon="♥"
              label="122 BPM"
              tintColor={COLORS.heartRose}
              onPress={() => setActiveTab('heart')}
            />
          </View>
        </View>
      </ScrollView>

      <LiquidGlassNavBar
        tabs={DEFAULT_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        quickActionActive={quickSheetOpen}
        onQuickActionPress={() => setQuickSheetOpen((v) => !v)}
      />

      <Modal
        visible={quickSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickSheetOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQuickSheetOpen(false)}
        >
          <View style={styles.modalGlassSheet}>
            <Text style={styles.cardTitle}>Quick-Start Workout</Text>
            <View style={{ marginTop: 14 }}>
              <LiquidGlassButton
                label="Close"
                tintColor={COLORS.moveRing}
                onPress={() => setQuickSheetOpen(false)}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default FitnessTrackerApp;

const styles = StyleSheet.create({
  appSafeArea: { flex: 1, backgroundColor: COLORS.bgDeep },
  ambientBackgroundContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  ambientGlowBlob: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.16,
  },
  scrollView: { flex: 1 },
  scrollContentContainer: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 20 : 12,
    paddingBottom: 130,
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
    marginTop: 2,
  },
  glassCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 12,
  },
  ringsRow: { flexDirection: 'row', alignItems: 'center' },
  ringColumn: { gap: 4 },
  ringLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginTop: 6 },
  ringValue: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  demoButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
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
  buttonBottomRefraction: { ...StyleSheet.absoluteFillObject, borderBottomWidth: 1.5 },
  buttonContentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonIcon: { fontWeight: '700' },
  buttonLabel: { fontSize: 14, fontWeight: '700' },
  navBarOuterWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 24 : 18,
    paddingHorizontal: 16,
  },
  navBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glassCapsuleOuter: {
    height: 68,
    borderRadius: 34,
    padding: 6,
    backgroundColor: 'rgba(18, 20, 28, 0.78)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  glassBackdropLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.glassSurface },
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
  },
  lensColorCore: { ...StyleSheet.absoluteFillObject, borderRadius: 28 },
  tabsRowContainer: { flexDirection: 'row', alignItems: 'center', height: '100%' },
  tabItemButton: { height: '100%', alignItems: 'center', justifyContent: 'center' },
  tabIconWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  tabIconText: { fontSize: 19, fontWeight: '700' },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -11,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: COLORS.moveRing,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  tabLabelText: { fontSize: 10.5, marginTop: 3 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalGlassSheet: {
    backgroundColor: 'rgba(22, 25, 36, 0.96)',
    borderRadius: 32,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
