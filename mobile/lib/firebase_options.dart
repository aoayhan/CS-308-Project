// File generated by FlutterFire CLI.
// ignore_for_file: lines_longer_than_80_chars, avoid_classes_with_only_static_members
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// Example:
/// ```dart
/// import 'firebase_options.dart';
/// // ...
/// await Firebase.initializeApp(
///   options: DefaultFirebaseOptions.currentPlatform,
/// );
/// 



class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDdOI7OFmwajeufUvbp7I0_QbOKLK0whr4',
    appId: '1:351363273489:web:0d0d6bd36e77b4c28772b0',
    messagingSenderId: '351363273489',
    projectId: 'cs308fire',
    authDomain: 'cs308fire.firebaseapp.com',
    databaseURL: 'https://cs308fire-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'cs308fire.appspot.com',
    measurementId: 'G-0LVPP6YBVR',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBrV_jK1BwEooFIzztNIVmTcSccl8O8gn4',
    appId: '1:351363273489:android:a2277103d0f1fe608772b0',
    messagingSenderId: '351363273489',
    projectId: 'cs308fire',
    databaseURL: 'https://cs308fire-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'cs308fire.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBeuJKaav7C5aFchINFx4YciZBlAe0lZg0',
    appId: '1:351363273489:ios:db2d87212a50599a8772b0',
    messagingSenderId: '351363273489',
    projectId: 'cs308fire',
    databaseURL: 'https://cs308fire-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'cs308fire.appspot.com',
    iosBundleId: 'com.example.supotify',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyBeuJKaav7C5aFchINFx4YciZBlAe0lZg0',
    appId: '1:351363273489:ios:a50b6c9ff50f46168772b0',
    messagingSenderId: '351363273489',
    projectId: 'cs308fire',
    databaseURL: 'https://cs308fire-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: 'cs308fire.appspot.com',
    iosBundleId: 'com.example.supotify.RunnerTests',
  );

  
}
