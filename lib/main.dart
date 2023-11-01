import 'package:flutter/material.dart';
import 'package:supotify/views/loginPage.dart';
import 'package:supotify/views/signupPage.dart';

void main() {
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
      home: const LoginPage(),
    );
  }
}