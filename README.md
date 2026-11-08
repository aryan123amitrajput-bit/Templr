# daylight — simple to-do list

A calm, uncluttered daily task list with add, complete, delete, task filters, progress tracking, optional reminders, and local persistence.

## Native Android app

The Flutter app source is in [`flutter_app/`](flutter_app/). The Android build workflow creates a release APK on GitHub whenever this branch changes. Download `app-release.apk` from the repository's **Releases** page, install it on Android, and then open daylight. Android may ask you to allow installs from your browser. This is a native install (not a web preview); it is not an Expo-style instant launch and requires a one-time APK install.

The app stores tasks locally using SharedPreferences. For local development, install Flutter and Android Studio, then run `flutter pub get` and `flutter run` from `flutter_app/`.

## Web preview development

```sh
npm install
npm run dev -- --host 0.0.0.0
```

For a production bundle, run `npm run build`.
