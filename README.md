# daylight — simple to-do list

A calm, uncluttered daily task list with add, complete, delete, task filters, progress tracking, optional reminders, and local persistence.

## Preview the native app while developing

The Flutter app source is in [`flutter_app/`](flutter_app/). Install Flutter and Android Studio, connect an Android phone with USB debugging enabled (or start an emulator), then run:

```sh
cd flutter_app
flutter pub get
flutter run
```

Flutter builds and installs a **debug** app on the first run. Keep it open while editing: save in Android Studio/VS Code or press `r` in the running terminal for hot reload. You don't need to build a release APK for each change. Use `R` for a hot restart when a change needs a full app restart.

## Install the native Android app

When you're happy with the preview, install the APK from the [GitHub release](https://github.com/aryan123amitrajput-bit/Templr/releases/tag/daylight-v1.0.0), or scan the [Android install QR](daylight-android-install.png). Android may ask you to allow installation from your browser. The release-build workflow is manual; preview edits won't automatically create another APK.

The app stores tasks locally using SharedPreferences.

## Web preview development

```sh
npm install
npm run dev -- --host 0.0.0.0
```

For a production bundle, run `npm run build`.
