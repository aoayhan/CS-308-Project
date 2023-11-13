import 'package:flutter/material.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:supotify/views/homePage.dart';
import 'package:supotify/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
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
                  labelText: 'Username',
                  border: OutlineInputBorder(),
                ),
                controller: _emailTextController,
               /* validator: (String? value) {
                                  return (value!.isEmpty)
                                      ? 'Username'
                                      : null;
                                },*/
              ),
            ),
            const SizedBox(height: 16),
           
             Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
                controller: _passwordTextController,
               /* validator: (String? value) {
                                  return (value!.length < 6)
                                      ? 'Your password must have at least 6 characters'
                                      : null;
                                },*/
                obscureText: true, // Hide the password input
              ),
            ),

            const SizedBox(height: 16),
            
             Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Confirm Password',
                  border: OutlineInputBorder(),
                ),
                controller: _passwordTextController2,
                /*validator: (String? value) {
                                  return (value!.length < 6)
                                      ? 'Your password must have at least 6 characters'
                                      : null;
                                },*/
                obscureText: true, // Hide the password input
              ),
            ),

            const SizedBox(height: 24),

            /* ElevatedButton(
      onPressed: () {
        Navigator.push(context, 
        MaterialPageRoute(builder: (context) => const signupPage())); // Add your login logic here
      },
      child: const Text('Sign Up'),
      
    ),*/

            firebaseUIButton(context, "Sign Up", () {
                  FirebaseAuth.instance
                      .createUserWithEmailAndPassword(
                          email: _emailTextController.text,
                          password: _passwordTextController.text)
                      .then((value) {
                    print("Created New Account");
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => homePage()));
                  }).onError((error, stackTrace) {
                    print("Error ${error.toString()}");
                  }
                  );
                }
                )
          ],
        ),),
        ),
        
        
      ),
    );
  }
}