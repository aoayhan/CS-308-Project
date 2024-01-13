import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:convert';
import 'package:supotify/views/addSongs2.dart';
import 'package:supotify/reusable_widgets/reusable_widget.dart';
class UserSongs extends StatefulWidget {
  @override
  _UserSongsPageState createState() => _UserSongsPageState();
}

class _UserSongsPageState extends State<UserSongs> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  List<dynamic> userSongs = [];
  List<dynamic> friendsTopSongs = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchUserSongs();
    _fetchFriendsTopSongs();
  }

  Future<void> _fetchUserSongs() async {
    final User? user = _auth.currentUser;
    final String? userId = user?.email;

    if (userId != null) {
      final url = 'http://localhost:3000/api/view-songs';
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId}),
      );
      if (response.statusCode == 200) {
        setState(() {
          userSongs = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load songs. Please try again later.';
          _isLoading = false;
        });
      }
    } else {
      setState(() {
        _errorMessage = 'No user signed in.';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchFriendsTopSongs() async {
    final User? user = _auth.currentUser;
    final String? userEmail = user?.email;

    if (userEmail != null) {
      final url = 'http://localhost:3000/api/get-friends-top-songs?userEmail=$userEmail';
      try {
        final response = await http.get(Uri.parse(url));
        if (response.statusCode == 200) {
          setState(() {
            friendsTopSongs = json.decode(response.body);
          });
        } else {
          print('Failed to load friends\' top songs');
        }
      } catch (e) {
        print('Error: $e');
      }
    }
  }

  Future<void> _updateSongRating(String songName, String artistName, double newRating) async {
    final User? user = _auth.currentUser;
    final String? userId = user?.email;

    if (userId != null) {
      final url = 'http://localhost:3000/api/update-rating';
      try {
        final response = await http.post(
          Uri.parse(url),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
            'songName': songName,
            'userId': userId,
            'artistName': artistName,
            'newRating': newRating,
          }),
        );
        if (response.statusCode == 200) {
          print('Rating updated successfully');
          _fetchUserSongs(); // Refresh the song list
        } else {
          print('Failed to update rating');
        }
      } catch (e) {
        print('Error: $e');
      }
    }
  }

  Future<void> _deleteSong(String songName, String artistName) async {
    final User? user = _auth.currentUser;
    final String? userId = user?.email;

    if (userId != null) {
      final url = 'http://localhost:3000/api/delete-song';
      try {
        final response = await http.delete(
          Uri.parse(url),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
            'songName': songName,
            'artist': artistName,
            'userId': userId,
          }),
        );
        if (response.statusCode == 200) {
          print('Song deleted successfully');
          _fetchUserSongs(); // Refresh the song list
        } else {
          print('Failed to delete song');
        }
      } catch (e) {
        print('Error: $e');
      }
    }
  }

  void _showRatingDialog(String songName, String artistName, double? currentRating) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Select a Rating'),
          content: SingleChildScrollView(
            child: ListBody(
              children: List.generate(10, (index) => index + 1).map((rating) {
                return GestureDetector(
                  child: Text('$rating'),
                  onTap: () {
                    Navigator.of(context).pop(); // Close the dialog
                    _updateSongRating(songName, artistName, rating.toDouble());
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      //backgroundColor: const Color.fromARGB(255, 70, 68, 68),
      appBar: AppBar(
        title: Text('Your Songs and Friends\' Top Songs'),
        actions: <Widget>[
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 8.0), // Adjust padding as needed
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(context,
                    MaterialPageRoute(builder: (context) => SearchPage()));
              },
              style: ElevatedButton.styleFrom(
                primary: Colors.green, // Button color
                onPrimary: Colors.white, // Text color
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: Text(
                'Add-Delete Songs',
                style: TextStyle(fontSize: 14), // Adjust font size as needed
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
              ? Center(child: Text(_errorMessage))
              : ListView(
                  children: [
                    ExpansionTile(
                      title: Text('Your Songs'),
                      children: userSongs.map<Widget>((song) {
                        return ListTile(
                          title: Text(song['name']),
                          subtitle: Text('${song['artist']} - ${song['album']}'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: Icon(Icons.delete),
                                onPressed: () => _deleteSong(song['name'], song['artist']),
                              ),
                              TextButton(
                                child: Text(song['rating']?.toString() ?? 'Not Rated'),
                                onPressed: () => _showRatingDialog(
                                  song['name'], 
                                  song['artist'], 
                                  song['rating']?.toDouble(),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    ...friendsTopSongs.map((friend) => ExpansionTile(
                          title: Text('Top songs of ${friend['friendEmail']}'),
                          children: friend['songs'].map<Widget>((song) => ListTile(
                                title: Text(song['name']),
                                subtitle: Text('${song['artist']} - ${song['album']}'),
                              )).toList(),
                        )),
                  ],
                ),
    );
  }
}
