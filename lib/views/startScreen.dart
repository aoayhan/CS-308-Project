import 'package:flutter/material.dart';
import 'package:supotify/views/loginPage.dart';
import 'package:supotify/views/signupPage.dart';
import 'package:supotify/views/homePage.dart';

class startScreen extends StatelessWidget {
  const startScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 70, 68, 68),
      body: Center(
        child: Column(
          
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('Welcome to SUpotify',
            style: TextStyle(color: Colors.green,fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 50,),

            ElevatedButton(
              onPressed: () {
               Navigator.push(context, 
               MaterialPageRoute(builder: (context) => const homePage())); // Add your login logic here
              },
              child: const Text('Home Page'),
            ),
            SizedBox(height: 35,),

            ElevatedButton(
              onPressed: () {
               Navigator.push(context, 
               MaterialPageRoute(builder: (context) => const LoginPage())); // Add your login logic here
              },
              child: const Text('Log In'),
            ),

            SizedBox(height: 35,),

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