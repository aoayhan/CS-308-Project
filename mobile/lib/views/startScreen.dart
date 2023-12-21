import 'package:flutter/material.dart';
import 'package:supotify/views/loginPage.dart';
import 'package:supotify/views/signupPage.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:supotify/views/addSongs.dart';
import 'package:supotify/views/addSongs2.dart';
class startScreen extends StatelessWidget {
  const startScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 70, 68, 68),
      body: Center(
        child: Column(
          
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('Welcome to SUpotify',
            style: TextStyle(color: Colors.green,fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 50,),

            firebaseUIButton(context, "Home", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => const SongAddPage2()));
                 
                }),
            const SizedBox(height: 35,),

            firebaseUIButton(context, "Login", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => const LoginPage()));
                 
                }),

            const SizedBox(height: 35,),

           firebaseUIButton(context, "Sign Up", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => const signupPage()));
                 
                }),
    

    
          ],
        ),
      ),
    );
  }
}