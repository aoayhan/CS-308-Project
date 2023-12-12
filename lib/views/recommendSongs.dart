import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:supotify/main.dart';
import 'package:firebase_core/firebase_core.dart';
class SongService {
  Future<List<dynamic>> recommendSongs(String userEmail) async {
    var url = Uri.parse('http://localhost:3000/api/recommend-songs?userEmail=$userEmail');
var response = await http.get(url);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      // Handle errors or return an empty list
      return [];
    }
  }
}

class RecommendSongsPage extends StatefulWidget {
  @override
  _RecommendSongsPageState createState() => _RecommendSongsPageState();
}

class _RecommendSongsPageState extends State<RecommendSongsPage> {
  // Initialize recommendedSongs with an empty list
  Future<List<dynamic>> recommendedSongs = Future.value([]);
  final FirebaseAuth _auth = FirebaseAuth.instance;
  @override
  void initState() {
    super.initState();
    fetchRecommendedSongs();
  }

  void fetchRecommendedSongs() async {
    String? userEmail = await getUserId();
    if (userEmail != null) {
      recommendedSongs = SongService().recommendSongs(userEmail);
      setState(() {}); // Trigger a rebuild to use the updated future
    }
  }

  Future<String?> getUserId() async {
    User? user = FirebaseAuth.instance.currentUser;
    return user?.email; // Returns null if no user is signed in
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Recommended Songs'),
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
      body: FutureBuilder<List<dynamic>>(
        future: recommendedSongs,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return CircularProgressIndicator();
          } else if (snapshot.hasError) {
            return Text('Error: ${snapshot.error}');
          } else if (snapshot.hasData) {
            return ListView.builder(
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                var song = snapshot.data![index];
                return ListTile(
                  title: Text(song['songName']),
                  subtitle: Text('${song['artistName']} - ${song['albumName']}'),
                );
              },
            );
          } else {
            return Text('No recommendations available.');
          }
        },
      ),
    );
  }
}