import 'package:flutter/material.dart';
import 'package:supotify/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:supotify/views/startScreen.dart';
import 'package:shared_preferences/shared_preferences.dart';



void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

Future<String?> getUserId() async {
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  return prefs.getString('userId');
}

void saveUserId(String userId) async {
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  await prefs.setString('userId', userId);
}
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SUpotify',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSwatch(primarySwatch: Colors.green).copyWith(background: const Color.fromARGB(255, 70, 68, 68)),
      ),
      home: const startScreen(),
      
    );
  }
}