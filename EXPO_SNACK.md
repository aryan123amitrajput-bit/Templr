# Premium Liquid Glass Button — Expo Go SDK 58

## Open on your Android device

**[Open Liquid Glass directly in Expo Go](exp://bh3reky-anonymous-8081.exp.direct)**

Expo Go URL:

```text
exp://bh3reky-anonymous-8081.exp.direct
```

You can also scan `expo-go-sdk58-qr.png` with Expo Go. The server is live now and its public Android manifest reports `exposdk:58.0.0`.

**Temporary server:** this official Expo tunnel remains available while its hosting job is running, for up to 60 minutes from publication. The complete permanent SDK 58 project is in `liquid-glass-sdk58/` if the server needs to be restarted later.

## Why the earlier Snack showed an incompatibility error

Your installed Expo Go uses **SDK 58**. The first saved Snack used SDK 55, and Expo Go requires the Snack runtime to match its own SDK. Expo currently does not provide an SDK 58 Snack runtime, so republishing the Snack with an SDK 58 manifest does not solve physical-device compatibility. The direct SDK 58 Expo server above bypasses that Snack limitation; it is not a WebView or website.

## What is already configured

| Package                | Version   |
| ---------------------- | --------- |
| `expo`                 | `58.0.23` |
| `expo-blur`            | `~58.0.5` |
| `expo-linear-gradient` | `~58.0.3` |
| `expo-haptics`         | `~58.0.7` |
| `react`                | `19.3.0`  |
| `react-native`         | `0.88.1`  |

The project includes its lockfile and uses `BlurTargetView` plus `BlurView` for real Android backdrop blur on Android 12 and newer. Older devices retain the layered translucent fallback. Press/release springs, moving specular highlights, depth shading, refraction, and haptics are implemented with Expo Go-compatible APIs only.
