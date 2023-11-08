import 'package:flutter/material.dart';
import 'package:supotify/views/signupPage.dart';
import 'package:supotify/views/homePage.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool _rememberMe = false;
  String? _errorText;
  final String expectedUsername = 'your_username';
  final String expectedPassword = 'your_password';

  TextEditingController usernameController = TextEditingController();
  TextEditingController passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'Welcome to SUpotify',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: TextField(
                controller: usernameController,
                decoration: const InputDecoration(
                  labelText: 'Username',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: TextField(
                controller: passwordController,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Text("Remember me"),
                Checkbox(
                  value: _rememberMe,
                  onChanged: (bool? value) {
                    setState(() {
                      _rememberMe = value ?? false;
                    });
                  },
                  activeColor: Colors.greenAccent,
                ),
                const SizedBox(width: 20),
              ],
            ),
            ElevatedButton(
              onPressed: () {
                if (usernameController.text == expectedUsername &&
                    passwordController.text == expectedPassword) {
                  // Successful login, navigate to the home page
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const homePage()),
                  );
                } else {
                  // Incorrect login, show an error message
                  setState(() {
                    _errorText =
                        "The username or password you entered is incorrect.";
                  });
                }
              },
              child: const Text('Log In'),
            ),
            const SizedBox(height: 8),
            Text(_errorText ?? "", style: const TextStyle(color: Colors.red)),
            const Text("Don't have an account?"),
            const SizedBox(
              width: 7,
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const signupPage(),
                  ),
                );
              },
              child: const Text('Sign Up'),
            ),
          ],
        ),
      ),
    );
  }
}
