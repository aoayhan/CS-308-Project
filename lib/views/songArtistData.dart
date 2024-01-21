import 'package:flutter/material.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:supotify/views/artistPopularity.dart';
import 'package:supotify/views/songPopularity.dart';
import 'package:supotify/views/leastLikedArtists.dart';

class homePage2 extends StatefulWidget {
  const homePage2({super.key});

  @override
  State<homePage2> createState() => _homePageState2();
}

class _homePageState2 extends State<homePage2> {
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
            const Text('Data',
            style: TextStyle(color: Colors.green,fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 50,),

           

           firebaseUIButton(context, "Popular Artists", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => const TopArtistPage()));
                 
                }),

                     const SizedBox(height: 10,),

           firebaseUIButton(context, "Popular Songs", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => FavoriteSongsPage()));
                 
                }),
              const SizedBox(height: 10,),

           firebaseUIButton(context, "least liked Artists", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => LeastLikedArtistPage()));
                 
                }),
    

    
          ],
        ),
      ),
    );
  }
}