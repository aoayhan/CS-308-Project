import 'package:flutter/material.dart';
import 'package:supotify/views/signupPage.dart';
import 'package:supotify/views/homePage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final loginFormKey = GlobalKey<FormState>();
  final TextEditingController _passwordTextController = TextEditingController();
  final TextEditingController _passwordTextController2 = TextEditingController();
  final TextEditingController _emailTextController = TextEditingController();
  bool _rememberMe = false;
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
            SizedBox(height: 20,),
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
               /* validator: (String? value) {
                                  return (value!.isEmpty)
                                      ? 'Username'
                                      : null;
                                },*/
              ),
            ),
            const SizedBox(height: 16),

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
               /* validator: (String? value) {
                                  return (value!.length < 6)
                                      ? 'Your password must have at least 6 characters'
                                      : null;
                                },*/
                obscureText: true, // Hide the password input
              ),
            ),

            const SizedBox(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                
                const Text("Remember me",),
                Checkbox(value:  _rememberMe,
                 onChanged: (bool? value){
                  setState(() {
                    _rememberMe = value ?? false;
                  });
                  
                 },
                 activeColor: Colors.greenAccent,),

                 const SizedBox(width: 20,),
              ],
              
            ),
           
             firebaseUIButton(context, "Sign In", () {
                  FirebaseAuth.instance
                      .signInWithEmailAndPassword(
                          email: _emailTextController.text,
                          password: _passwordTextController.text)
                      .then((value) {
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => homePage()));
                  }).onError((error, stackTrace) {
                    print("Error ${error.toString()}");
                  });
                }),

            const SizedBox(height: 8),
            
  
            const Text("Don't have an account?",),
            
     const SizedBox(width: 7,),

              firebaseUIButton(context, "Sign Up", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => signupPage()));
                  
                }),

    
    
  

          ],
        ),
          ),
          

        ),
        
      ),
    );
  }
}