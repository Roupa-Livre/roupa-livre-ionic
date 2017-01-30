# App Roupa Livre IONIC #

### Como efetuar o deploy ###

* Google Play Store
* Apple App Store

Procedimentos a partir de um UNIX/MAC

### Google Play Store ###

1 - Remova plugins que podem conflitar:
```
cordova plugin rm cordova-plugin-console
```

2 - Compile para Release
```
cordova build --release android
```

3 - Assine o apk
```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore /Developer/keystores/roupa-livre/play-store-nucleo.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk nucleo
```

4 - Gere o APK final
```
rm -f ~/Downloads/roupa-livre/new_version.apk
~/Library/Developer/Xamarin/android-sdk-macosx/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk ~/Downloads/roupa-livre/new_version.apk
```

5 - Volte os plugins removidos
```
cordova plugin add cordova-plugin-console
```

### iOS ###

1 - Remova plugins que podem conflitar:
```
cordova plugin rm cordova-plugin-console
```

2 - Compile para Release
```
ionic build ios --release
```

3 - Abra o projeto pelo XCode, e faça o Archive e Publish
```
open platforms/ios/RoupaLivre.xcodeproj
```

4 - Volte os plugins removidos
```
cordova plugin add cordova-plugin-console
```