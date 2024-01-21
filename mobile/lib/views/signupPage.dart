import 'package:flutter/material.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:supotify/views/addSongs.dart';
import 'package:firebase_auth/firebase_auth.dart';

class signupPage extends StatefulWidget {
  const signupPage({super.key});

  @override
  State<signupPage> createState() => _signupPageState();
}

class _signupPageState extends State<signupPage> {
  final signupFormKey = GlobalKey<FormState>();
  final TextEditingController _passwordTextController = TextEditingController();
  final TextEditingController _passwordTextController2 = TextEditingController();
  final TextEditingController _emailTextController = TextEditingController();

  String _errorText = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign Up'),
      ),
      body: Builder(
        builder: (context) => SingleChildScrollView(
          child: Form(
            key: signupFormKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                const SizedBox(height: 24),
                const Text(
                  'Create an Account',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: TextFormField(
                    decoration: const InputDecoration(
                      icon: Icon(Icons.person),
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                    ),
                    controller: _emailTextController,
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: TextFormField(
                    decoration: const InputDecoration(
                      icon: Icon(Icons.key),
                      labelText: 'Password',
                      border: OutlineInputBorder(),
                    ),
                    controller: _passwordTextController,
                    obscureText: true,
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: TextFormField(
                    decoration: const InputDecoration(
                      icon: Icon(Icons.key),
                      labelText: 'Confirm Password',
                      border: OutlineInputBorder(),
                    ),
                    controller: _passwordTextController2,
                    obscureText: true,
                  ),
                ),
                const SizedBox(height: 24),
                if (_errorText.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(
                      _errorText,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                firebaseUIButton(context, "Sign Up", () {
                  FirebaseAuth.instance
                      .createUserWithEmailAndPassword(
                          email: _emailTextController.text,
                          password: _passwordTextController.text)
                      .then((value) {
                    print("Created New Account");
                    Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const SongAddPage()));
                  }).catchError((error) {
                    setState(() {
                      _errorText = _getErrorText(error.code);
                    });
                    print("Error ${error.toString()}");
                  });
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getErrorText(String errorCode) {
    switch (errorCode) {
      case 'invalid-email':
        return 'The email address is badly formatted';
      case 'weak-password':
        return 'The password is too weak';
      default:
        return 'Sign up failed. Please try again.';
    }
  }
}
