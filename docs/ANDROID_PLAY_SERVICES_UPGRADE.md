What I changed

- Forced a single Google Play Services Location version (21.3.0) by setting
  ext.playServicesVersion and ext.playServicesLocationVersion in
  `android/build.gradle`, and added a `resolutionStrategy` in
  `android/app/build.gradle` to pin `com.google.android.gms:play-services-location`.

Why

- You hit this runtime crash:
  IncompatibleClassChangeError: Found interface com.google.android.gms.location.FusedLocationProviderClient, but class was expected
  This happens when different AARs or libraries were compiled against different
  versions of Play Services where the FusedLocationProviderClient type changed
  between versions. Forcing a single version resolves the mismatch.

How to test locally (Android)

1. Clean Gradle & Android build caches:

```powershell
cd android; .\gradlew clean; cd ..
```

2. Reinstall the app on your device/emulator (this ensures native libs are rebuilt):

```powershell
npx expo run:android --variant debug
```

Or, if you use a custom dev client / EAS builds, you must rebuild the dev-client
with EAS so native dependency versions are recompiled.

3. Run the app and exercise the map/address flow that calls `react-native-geolocation-service`.

If crash persists

- Check `android/app/build/outputs/logs/manifest-merger-debug-report.txt` for which
  `play-services-location` versions were merged.
- Try bumping the version to the one other dependencies expect (modify both
  `playServicesVersion` and `playServicesLocationVersion` in `android/build.gradle`).
- If you need help debugging dependency trees, run:

```powershell
cd android; .\gradlew :app:dependencies --configuration debugRuntimeClasspath
```

Notes

- This change is low risk: it only pins dependency versions for resolving
  transitive conflicts. If other modules require a newer Play Services API,
  bump the version consistently in `android/build.gradle`.

Maps API key (required for Google Maps)

- Add your Google Maps Android API key to either `android/gradle.properties` or `android/local.properties` as:

  MAPS_API_KEY=YOUR_API_KEY_HERE

- Then rebuild the app so the manifest placeholder is replaced:

```powershell
cd android; .\gradlew clean; cd ..
npx expo run:android --variant debug
```

- If you are using EAS or a custom dev client, add the property to your build configuration or use environment secrets before rebuilding the native client.
