# Carnaval Nazaré Paulista #

### Como efetuar o deploy ###

* Google Play Store
* Apple App Store

### Google Play Store ###

1. Remova plugins que podem conflitar:
```
cordova plugin rm cordova-plugin-console
```

2. Compile para Release
```
cordova build --release android
```

3.  Gere a key, caso nao tenha
```
keytool -genkey -v -keystore nucleo235_carnaval.keystore -alias nucleo_235_carnaval -keyalg RSA -keysize 2048 -validity 10000
```

4. Assine o apk
```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore nucleo235_carnaval.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk nucleo_235_carnaval
```

5. Gere o APK final
```
~/Library/Developer/Xamarin/android-sdk-macosx/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk [new_name.apk]
```

6. Volte os plugins removidos
```
cordova plugin add cordova-plugin-console
```