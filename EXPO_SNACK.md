# Premium Liquid Glass Button — Android

## Open the finished Expo Snack

**[Open Premium Liquid Glass Button in Expo Snack](https://snack.expo.dev/IaW4nq-falIDeqy_QtyNy?platform=android)**

The Snack is already created and saved with the complete `App.js`, Expo SDK 55, Android preview, and all required dependencies. There is nothing to copy or install manually. Choose **Run on device** in Snack and scan the QR code with Expo Go.

The repository's `App.js` is a readable source copy; the saved Snack is the ready-to-run deliverable.

## Dependencies already configured

| Package                | SDK 55-compatible version |
| ---------------------- | ------------------------- |
| `expo-blur`            | `~55.0.18`                |
| `expo-linear-gradient` | `~55.0.18`                |
| `expo-haptics`         | `~55.0.18`                |

React and React Native are supplied by the Snack runtime. No Reanimated, SVG, WebView, custom native module, or development build is needed.

## What is implemented

- A real React Native `Pressable`, sized **220 × 64 px** with a 32 px pill radius.
- `BlurTargetView` and `BlurView` using Expo SDK 55's native Android blur implementation.
- The `dimezisBlurViewSdk31Plus` blur method on Android 12 and newer, avoiding the expensive legacy blur path on older devices.
- A complete translucent lens fallback when native blur is unavailable, with the same layout and interaction.
- Layered lens tint, chromatic refraction, internal highlights, depth shading, a variable-opacity rim, and specular accents.
- Native-driver press scale, highlight movement, opacity changes, and spring release; no perpetual animations.
- Success haptic feedback on activation, safely ignored when haptics are unavailable.
- A dark gradient background with violet, cyan, and rose lighting behind the glass.
