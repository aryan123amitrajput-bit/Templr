/**
 * Expo Snack — Android Liquid Glass Button
 *
 * Built for Expo Go SDK 58 with all dependencies configured in Expo Snack.
 *
 * Packages: expo-blur, expo-linear-gradient, expo-haptics.
 * React and react-native are already supplied by Snack. No other packages,
 * native builds, WebView, Reanimated, or SVG are required.
 */

import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurTargetView, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 64;
const BUTTON_RADIUS = BUTTON_HEIGHT / 2;

function AmbientOrb({ color, size, style }) {
  const layers = [1, 0.82, 0.64, 0.46, 0.28];
  const opacities = [0.025, 0.035, 0.05, 0.075, 0.12];

  return (
    <View
      pointerEvents="none"
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {layers.map((scale, index) => {
        const layerSize = size * scale;
        return (
          <View
            key={scale}
            style={{
              position: "absolute",
              width: layerSize,
              height: layerSize,
              borderRadius: layerSize / 2,
              backgroundColor: color,
              opacity: opacities[index],
            }}
          />
        );
      })}
    </View>
  );
}

function Background() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#02030A", "#090B18", "#050711", "#020309"]}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AmbientOrb color="#755CFF" size={350} style={styles.violetOrb} />
      <AmbientOrb color="#00C8E8" size={320} style={styles.cyanOrb} />
      <AmbientOrb color="#F04E9B" size={260} style={styles.roseOrb} />

      {/* These soft ribbons sit behind the lens, making its blur and
          refractive color separation visible rather than decorative. */}
      <LinearGradient
        colors={[
          "rgba(112,85,255,0)",
          "rgba(112,85,255,0.30)",
          "rgba(78,205,255,0.34)",
          "rgba(78,205,255,0)",
        ]}
        locations={[0, 0.28, 0.68, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.lightRibbon, styles.primaryRibbon]}
      />
      <LinearGradient
        colors={[
          "rgba(255,72,151,0)",
          "rgba(255,72,151,0.19)",
          "rgba(116,99,255,0.16)",
          "rgba(116,99,255,0)",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.lightRibbon, styles.secondaryRibbon]}
      />

      <View style={styles.vignette} />
    </View>
  );
}

function LiquidGlassButton({ blurTarget, onConfirm }) {
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => press.stopAnimation();
  }, [press]);

  const handlePressIn = useCallback(() => {
    Animated.spring(press, {
      toValue: 1,
      damping: 18,
      stiffness: 430,
      mass: 0.45,
      useNativeDriver: true,
    }).start();
  }, [press]);

  const handlePressOut = useCallback(() => {
    Animated.spring(press, {
      toValue: 0,
      damping: 13,
      stiffness: 270,
      mass: 0.55,
      useNativeDriver: true,
    }).start();
  }, [press]);

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.965],
  });
  const translateY = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });
  const highlightX = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const highlightOpacity = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const innerLightOpacity = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.42],
  });

  return (
    <Animated.View
      style={[styles.buttonShadow, { transform: [{ scale }, { translateY }] }]}
    >
      <View pointerEvents="none" style={styles.ambientButtonGlow} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Confirm"
        accessibilityHint="Activates the confirmation action"
        hitSlop={8}
        onPress={onConfirm}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        {/* A gradient behind the inset lens creates a true variable-opacity
            rim without putting an opaque rectangle over the blurred glass. */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.82)",
            "rgba(255,255,255,0.22)",
            "rgba(157,211,255,0.10)",
            "rgba(255,255,255,0.34)",
            "rgba(255,255,255,0.62)",
          ]}
          locations={[0, 0.28, 0.57, 0.82, 1]}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.88, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.glassClip}>
          {/* SDK 58 uses a BlurTargetView for real Android backdrop blur.
              The SDK 31+ method avoids expensive legacy rendering on older
              devices, where these gradients provide the fallback instead. */}
          <BlurView
            blurTarget={blurTarget}
            intensity={48}
            tint="dark"
            blurReductionFactor={2}
            blurMethod={
              Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined
            }
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.16)",
              "rgba(224,239,255,0.075)",
              "rgba(132,166,207,0.035)",
              "rgba(255,255,255,0.065)",
            ]}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0.05, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Offset chromatic bands mimic light bending through the curved
              edges of a lens. Only transforms/opacity are animated. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.refractionLayer,
              {
                opacity: innerLightOpacity,
                transform: [{ translateX: highlightX }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(162,220,255,0.28)",
                "rgba(255,255,255,0.05)",
                "rgba(186,154,255,0.20)",
                "rgba(255,255,255,0)",
              ]}
              locations={[0, 0.25, 0.52, 0.78, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.27)",
              "rgba(255,255,255,0.075)",
              "rgba(255,255,255,0)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topInternalLight}
          />

          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(3,7,17,0)",
              "rgba(3,7,17,0.08)",
              "rgba(3,7,17,0.25)",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.bottomDepth}
          />

          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.20)",
              "rgba(255,255,255,0.025)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.leftRefraction}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0)",
              "rgba(141,206,255,0.025)",
              "rgba(176,220,255,0.17)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.rightRefraction}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.specularStreak,
              {
                opacity: highlightOpacity,
                transform: [{ translateX: highlightX }, { rotate: "-9deg" }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.48)",
                "rgba(255,255,255,0.08)",
                "rgba(255,255,255,0)",
              ]}
              locations={[0, 0.38, 0.72, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View pointerEvents="none" style={styles.smallSpecular} />

          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0)",
              "rgba(181,226,255,0.38)",
              "rgba(255,255,255,0.48)",
              "rgba(255,255,255,0)",
            ]}
            locations={[0, 0.35, 0.62, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.bottomCaustic}
          />
        </View>

        {/* Fine independent edge lights retain the polished rim at small
            sizes, even when Android uses the no-blur fallback. */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.76)",
            "rgba(255,255,255,0.20)",
            "rgba(255,255,255,0)",
          ]}
          locations={[0, 0.3, 0.72, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.topEdgeLight}
        />

        <View style={styles.labelContainer} pointerEvents="none">
          <Text style={styles.label}>Confirm</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function App() {
  const blurTarget = useRef(null);

  const handleConfirm = useCallback(() => {
    // Haptics can be unavailable in an emulator or with system haptics off.
    // Catching keeps confirmation safe on those devices.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#02030A" />
      <View style={styles.screen}>
        <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
          <Background />
        </BlurTargetView>
        <View style={styles.content}>
          <LiquidGlassButton
            blurTarget={blurTarget}
            onConfirm={handleConfirm}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#02030A",
  },
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#02030A",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  orb: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  violetOrb: {
    top: "7%",
    left: -150,
    transform: [{ scaleY: 1.2 }],
  },
  cyanOrb: {
    right: -145,
    bottom: "8%",
    transform: [{ scaleY: 1.25 }],
  },
  roseOrb: {
    left: "38%",
    bottom: -120,
  },
  lightRibbon: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 430,
    height: 150,
    borderRadius: 75,
  },
  primaryRibbon: {
    transform: [
      { translateX: -215 },
      { translateY: -110 },
      { rotate: "-17deg" },
    ],
  },
  secondaryRibbon: {
    width: 360,
    height: 110,
    opacity: 0.75,
    transform: [{ translateX: -165 }, { translateY: 5 }, { rotate: "19deg" }],
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 70,
    borderColor: "rgba(0,0,0,0.15)",
  },
  buttonShadow: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: "rgba(255,255,255,0.025)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.48,
    shadowRadius: 22,
    elevation: 18,
  },
  ambientButtonGlow: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: -12,
    height: 30,
    borderRadius: 20,
    backgroundColor: "rgba(93,183,255,0.10)",
    shadowColor: "#65CFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  pressable: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    overflow: "hidden",
  },
  glassClip: {
    position: "absolute",
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
    borderRadius: BUTTON_RADIUS - 1,
    overflow: "hidden",
  },
  refractionLayer: {
    position: "absolute",
    top: 8,
    right: -16,
    bottom: 7,
    left: -16,
    borderRadius: BUTTON_RADIUS,
  },
  topInternalLight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  bottomDepth: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 29,
  },
  leftRefraction: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    width: 28,
  },
  rightRefraction: {
    position: "absolute",
    top: 4,
    right: 0,
    bottom: 4,
    width: 28,
  },
  specularStreak: {
    position: "absolute",
    top: 6,
    left: 25,
    width: 103,
    height: 12,
    borderRadius: 8,
  },
  smallSpecular: {
    position: "absolute",
    top: 8,
    right: 29,
    width: 29,
    height: 5,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.32)",
    transform: [{ rotate: "12deg" }],
  },
  bottomCaustic: {
    position: "absolute",
    left: 31,
    right: 31,
    bottom: 1,
    height: 1.5,
    borderRadius: 2,
  },
  topEdgeLight: {
    position: "absolute",
    top: 0.6,
    left: 28,
    right: 28,
    height: 1.2,
    borderRadius: 2,
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.32)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
