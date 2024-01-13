import 'package:flutter/material.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:supotify/main.dart';
import 'package:supotify/views/addsongkurtarma.dart';
import 'package:supotify/views/recommendSongs.dart';
import 'package:supotify/views/addSongs.dart';
import 'package:supotify/views/friendList.dart';
import 'package:supotify/views/addSongs2.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:supotify/views/createGroup.dart';
import 'package:supotify/views/artistPopularity.dart';
import 'package:supotify/views/songArtistData.dart';

class homePage extends StatefulWidget {
  const homePage({super.key});

  @override
  State<homePage> createState() => _homePageState();
}

class _homePageState extends State<homePage> {
   final FirebaseAuth _auth = FirebaseAuth.instance;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      //backgroundColor: const Color.fromARGB(255, 70, 68, 68),
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
            onPressed: () {
              _auth.signOut();
              // Perform logout logic here
              // For example, navigate to the login page
              Navigator.of(context).pop(); // Assuming you want to go back to the previous page
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Center(
        child: Column(
          
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('Welcome to SUpotify',
            style: TextStyle(color: Colors.green,fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 50,),

            firebaseUIButton(context, "Songs", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) =>  UserSongs()));
                 
                }),
            const SizedBox(height: 35,),

            firebaseUIButton(context, "Friends", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => const FriendManagementPage()));
                 
                }),

            const SizedBox(height: 35,),

           firebaseUIButton(context, "Recommendation", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => RecommendSongsPage()));
                 
                }),

           const SizedBox(height: 35,),

           firebaseUIButton(context, "Groups", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => CreateGroupPage()));
                 
                }),

                 const SizedBox(height: 10,),

           firebaseUIButton(context, "pop", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => homePage2()));
                 
                }),
    
    

    
          ],
        ),
      ),
    );
  }
}