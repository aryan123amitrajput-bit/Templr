# Liquid Glass Button — Expo Snack (Android)

`App.js` is the complete, standalone Snack entry point. It does not depend on the rest of this repository.

## Run in Expo Snack

1. Open [https://snack.expo.dev/](https://snack.expo.dev/) and use **Expo SDK 54** for the `experimentalBlurMethod` API used by this example.
2. Replace the Snack's entire `App.js` with this repository's `App.js`.
3. Open **Dependencies** in the lower-right panel and add exactly:
   - `expo-blur`
   - `expo-linear-gradient`
   - `expo-haptics`
4. Let Snack select the SDK-compatible version of each package. React and React Native are already included; do not add Reanimated, SVG, a WebView package, or any native blur library.
5. Select **Android**, then scan the QR code with Expo Go on an Android device.

Equivalently, the Snack dependency entries can use SDK-compatible wildcard versions:

```json
{
  "dependencies": {
    "expo-blur": "*",
    "expo-linear-gradient": "*",
    "expo-haptics": "*"
  }
}
```

## Implementation notes

- The control is a real React Native `Pressable`, sized **220 × 64 px** with a 32 px pill radius.
- `expo-blur` supplies backdrop blur. Android blur is experimental and is enabled with `experimentalBlurMethod="dimezisBlurView"`; physical-device results depend on the Android version and GPU.
- If native backdrop blur is unavailable or disabled, the translucent lens gradients, edge refraction, depth shading, and polished rim remain visible. No runtime fallback component or extra package is needed.
- All press, release, highlight-shift, and opacity animations use the native driver. The release uses a spring and there are no perpetual animations.
- `expo-haptics` provides a success haptic on activation. Its promise is caught so devices with haptics disabled still work normally.
- Everything runs in Expo Go. There are no custom native modules, DOM/CSS styles, or WebViews.
