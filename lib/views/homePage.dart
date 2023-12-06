import 'package:flutter/material.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:supotify/main.dart';
import 'package:supotify/views/recommendSongs.dart';
import 'package:supotify/views/addSongs.dart';
import 'package:supotify/views/friendList.dart';

class homePage extends StatefulWidget {
  const homePage({super.key});

  @override
  State<homePage> createState() => _homePageState();
}

class _homePageState extends State<homePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                        MaterialPageRoute(builder: (context) => const SongAddPage()));
                 
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
    

    
          ],
        ),
      ),
    );
  }
}