import 'package:flutter/material.dart';
import 'package:supotify/views/signupPage.dart';
import 'package:supotify/views/homePage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool _rememberMe = false;
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

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: TextField(
                decoration: InputDecoration(
                  labelText: 'Username',
                  border: OutlineInputBorder(),
                ),
              ),
            ),

            const SizedBox(height: 16),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: TextField(
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
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
           
            ElevatedButton(
              onPressed: () {
               Navigator.push(context, 
               MaterialPageRoute(builder: (context) => const homePage())); // Add your login logic here
              },
              child: const Text('Log In'),
            ),
            const SizedBox(height: 8),
            
  
            const Text("Don't have an account?",),
            
     const SizedBox(width: 7,),

             ElevatedButton(
      onPressed: () {
        Navigator.push(context, 
        MaterialPageRoute(builder: (context) => const signupPage())); // Add your login logic here
      },
      child: const Text('Sign Up'),
      
    ),
    
  

          ],
        ),
      ),
    );
  }
}