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
ionic cordova build --release android
```

3 - Assine o apk
```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../keys/play-store-nucleo.keystore platforms/android/build/outputs/apk/android-x86-release-unsigned.apk nucleo
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../keys//play-store-nucleo.keystore platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk nucleo
rm -rf ./RELEASE
mkdir -p RELEASE
mv -f platforms/android/build/outputs/apk/android-x86-release-unsigned.apk ./RELEASE/android-x86-release-unsigned.apk
mv -f platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk ./RELEASE/android-armv7-release-unsigned.apk
```

4 - Gere o APK final
```
rm -rf ./UPLOAD
mkdir -p UPLOAD
zipalign -v 4 ./RELEASE/android-x86-release-unsigned.apk ./UPLOAD/new_version-x86.apk
zipalign -v 4 ./RELEASE/android-armv7-release-unsigned.apk ./UPLOAD/new_version-armv7.apk
open ./UPLOAD
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
ionic cordova build ios --release
```

3 - Abra o projeto pelo XCode, e faça o Archive e Publish
```
open platforms/ios/RoupaLivre.xcodeproj
```

4 - Volte os plugins removidos
```
cordova plugin add cordova-plugin-console
```
