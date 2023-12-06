import 'package:flutter/material.dart';
import 'package:supotify/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:supotify/views/startScreen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';



void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

void saveUserId(String userId) async {
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  await prefs.setString('userId', userId);
}

Future<String?> getUserId() async {
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  return prefs.getString('userId');
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SUpotify',
      theme: ThemeData(
        primarySwatch: Colors.green, // You can choose your own color
      ),
      home: const startScreen(),
      
    );
  }
}