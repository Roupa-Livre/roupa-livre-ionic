# App Roupa Livre IONIC #

### Como efetuar o deploy ###

* Google Play Store
* Apple App Store

Procedimentos a partir de um UNIX/MAC

### Google Play Store ###

1. Remova plugins que podem conflitar:
```
cordova plugin rm cordova-plugin-console
```

2. Compile para Release
```
cordova build --release android
```

4. Assine o apk
```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore /Users/henriquerangel/Dropbox/nucleo235/DEV/google/play-store-nucleo.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk nucleo
```

5. Gere o APK final
```play
~/Library/Developer/Xamarin/android-sdk-macosx/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk ~/Downloads/roupa-livre/new_version.apk
```

6. Volte os plugins removidos
```
cordova plugin add cordova-plugin-console
```