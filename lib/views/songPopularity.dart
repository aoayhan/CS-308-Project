import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class FavoriteSongsPage extends StatefulWidget {
  @override
  _FavoriteSongsPageState createState() => _FavoriteSongsPageState();
}

class _FavoriteSongsPageState extends State<FavoriteSongsPage> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  Map<String, dynamic> _favoriteSongs = {};
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchFavoriteSongs();
  }

  Future<void> _fetchFavoriteSongs() async {
    setState(() {
      _isLoading = true;
    });

    User? user = _auth.currentUser;
    final userEmail = user?.email;

    if (userEmail == null) {
      print("User email is null");
      setState(() => _isLoading = false);
      return; // Exit if email is null
    }

    final uri = Uri.http('localhost:3000', '/api/favorite-song-per-year', {'userEmail': userEmail});

    try {
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is Map<String, dynamic>) {
          setState(() {
            _favoriteSongs = data;
            _isLoading = false;
          });
        } else {
          print("Data format is not as expected: ${response.body}");
          setState(() => _isLoading = false);
        }
      } else {
        print('Failed to load favorite songs, Status code: ${response.statusCode}, Body: ${response.body}');
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print('Error fetching favorite songs: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Favorite Songs by Year'),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : (_favoriteSongs.isNotEmpty
              ? ListView.builder(
                  itemCount: _favoriteSongs.keys.length,
                  itemBuilder: (context, index) {
                    String year = _favoriteSongs.keys.elementAt(index);
                    var song = _favoriteSongs[year];
                    return ListTile(
                      title: Text(song['title'] ?? 'Unknown Title'),
                      subtitle: Text('Year: $year, Rating: ${song['rating'] ?? 'N/A'}'),
                    );
                  },
                )
              : Center(child: Text("No favorite songs found."))),
    );
  }
}
