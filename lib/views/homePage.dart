import 'package:flutter/material.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
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
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
            onPressed: () {
              _auth.signOut();
              Navigator.of(context).pop();
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'Welcome to SUpotify',
              style: TextStyle(
                color: Colors.green,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Expanded(
                  child: _buildSectionButton(
                    context,
                    "Songs",
                    UserSongs(),
                    Icons.music_note,
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: _buildSectionButton(
                    context,
                    "Friends",
                    const FriendManagementPage(),
                    Icons.people,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Expanded(
                  child: _buildSectionButton(
                    context,
                    "Recommendation",
                    RecommendSongsPage(),
                    Icons.star,
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: _buildSectionButton(
                    context,
                    "Groups",
                    CreateGroupPage(),
                    Icons.group,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildSectionButton(
              context,
              "Pop",
              homePage2(),
              Icons.star_outline,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionButton(
    BuildContext context,
    String text,
    Widget page,
    IconData iconData,
  ) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.green, // Adjust the color as needed
        borderRadius: BorderRadius.circular(10),
      ),
      child: TextButton(
        onPressed: () {
          Navigator.push(
              context, MaterialPageRoute(builder: (context) => page));
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              iconData,
              size: 40,
              color: Colors.white,
            ),
            const SizedBox(height: 10),
            Text(
              text,
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
