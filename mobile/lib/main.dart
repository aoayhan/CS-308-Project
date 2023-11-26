import 'package:flutter/material.dart';
import 'package:supotify/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:supotify/views/startScreen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';



void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
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