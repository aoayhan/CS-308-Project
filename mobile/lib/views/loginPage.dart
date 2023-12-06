import 'package:flutter/material.dart';
import 'package:supotify/views/homePage.dart';
import 'package:supotify/views/signupPage.dart';
import 'package:supotify/views/addSongs.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:supotify/views/empty.dart';
import 'package:supotify/views/startScreen.dart';
import 'package:supotify/views/addSongs2.dart';
import 'package:supotify/views/friendList.dart';
import 'package:supotify/views/recommendSongs.dart';
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final loginFormKey = GlobalKey<FormState>();
  final TextEditingController _passwordTextController = TextEditingController();
  final TextEditingController _emailTextController = TextEditingController();
  bool _rememberMe = false;
  String _errorText = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
      ),
      body: Builder(
        builder: (context) => SingleChildScrollView(
          child: Form(
            key: loginFormKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                const SizedBox(height: 20,),
                const Text(
                  'Welcome to SUpotify',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
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
                    obscureText: true, // Hide the password input
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Text("Remember me",),
                    Checkbox(
                      value: _rememberMe,
                      onChanged: (bool? value) {
                        setState(() {
                          _rememberMe = value ?? false;
                        });
                      },
                      activeColor: Colors.greenAccent,
                    ),
                    const SizedBox(width: 20,),
                  ],
                ),
                if (_errorText.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(
                      _errorText,
                      style: TextStyle(color: Colors.red),
                    ),
                  ),
                firebaseUIButton(context, "Sign In", () async {
                  try {
                    UserCredential userCredential =
                        await FirebaseAuth.instance.signInWithEmailAndPassword(
                      email: _emailTextController.text,
                      password: _passwordTextController.text,
                    );
                    
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => RecommendSongsPage()),
                    );
                  } catch (error) {
                    setState(() {
                      _errorText = _getSignInErrorText(error);
                    });
                    print("Error during sign-in: $error");
                  }
                }),
                const SizedBox(height: 8),
                const Text("Don't have an account?",),
                const SizedBox(width: 7,),
                firebaseUIButton(context, "Sign Up", () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const signupPage()),
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getSignInErrorText(dynamic error) {
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'invalid-email':
          return 'The email address is badly formatted';
        case 'user-not-found':
        case 'wrong-password':
          return 'Invalid email or password. Please check your credentials.';
        default:
          return 'Sign-in failed. Please try again.';
      }
    } else {
      return 'Sign-in failed. Please try again.';
    }
  }
}
