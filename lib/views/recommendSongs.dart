import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

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

  Future<List<String>> fetchRecommendedFriendsSongs() async {
    final User? user = _auth.currentUser;
    final String? userEmail = user?.email;

    List<String> recommendationsList = [];

    if (userEmail != null) {
      final url = 'http://localhost:3000/api/recommend-friends-songs?userEmail=$userEmail';
      try {
        final response = await http.get(Uri.parse(url));
        if (response.statusCode == 200) {
          List<String> lines = response.body.split('\n');
          for (String line in lines) {
            // Process each line
            if (line.isNotEmpty) {
              recommendationsList.add(line);
            }
          }
        } else {
          print('Failed to load friends\' top songs');
        }
      } catch (e) {
        print('Error: $e');
      }
    }

    return recommendationsList;
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
              Navigator.of(context).pop();
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: ListView(
        children: [
          FutureBuilder<List<dynamic>>(
            future: recommendedSongs,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).primaryColor),
                  ),
                );
              } else if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
                return ExpansionTile(
                  title: const Text('Your Recommendations'),
                  children: snapshot.data!
                      .map<Widget>((song) => ListTile(
                            title: Text(song['songName']),
                            subtitle: Text('${song['artistName']} - ${song['albumName']}'),
                          ))
                      .toList(),
                );
              } else {
                return const ListTile(title: Text('No personal recommendations available.'));
              }
            },
          ),
          FutureBuilder<List<String>>(
            future: fetchRecommendedFriendsSongs(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).primaryColor),
                  ),
                );
              } else if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
                return ExpansionTile(
                  title: const Text("Friends' Recommendations"),
                  children: snapshot.data!
                      .map<Widget>((line) => Text(line))
                      .toList(),
                );
              } else {
                return const ListTile(title: Text("No friends' recommendations available."));
              }
            },
          ),
        ],
      ),
    );
  }
}
