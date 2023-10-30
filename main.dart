import 'package:flutter/material.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  // ignore: library_private_types_in_public_api
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  TextEditingController searchController = TextEditingController();
  bool isSearchEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Your SUpotify Clone'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Welcome to SUpotify',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 20), // Add spacing

            // Username Input Field
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Username',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(height: 16), // Add spacing

            // Password Input Field
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
              ),
            ),

            const SizedBox(height: 16), // Add spacing

            // Remember Me Checkbox and Text
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Checkbox(value: false, onChanged: (value) {}),
                const Text('Remember me'),
              ],
            ),

            const SizedBox(height: 16), // Add spacing

            // Log In Button
            ElevatedButton(
              onPressed: () {
                // Handle the Log In action
              },
              child: const Text('Log in'),
            ),

            const SizedBox(height: 16), // Add spacing

            // Sign Up Text
            GestureDetector(
              onTap: () {
                // Handle the Sign Up action
              },
              child: const Text(
                "Don't have an account? Sign up.",
                style: TextStyle(
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
