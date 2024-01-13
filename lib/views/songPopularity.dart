import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class FavoriteSong {
  final String title;
  final int year;
  final double rating;

  FavoriteSong({required this.title, required this.year, required this.rating});

  factory FavoriteSong.fromJson(Map<String, dynamic> json) {
    return FavoriteSong(
      title: json['title'],
      year: json['year'],
      rating: json['rating'].toDouble(),
    );
  }
}

class FavoriteSongsPage extends StatefulWidget {
  @override
  _FavoriteSongsPageState createState() => _FavoriteSongsPageState();
}

class _FavoriteSongsPageState extends State<FavoriteSongsPage> {
  late Future<Map<int, FavoriteSong>> favoriteSongs;

  @override
  void initState() {
    super.initState();
    favoriteSongs = fetchFavoriteSongs();
  }

  Future<Map<int, FavoriteSong>> fetchFavoriteSongs() async {
     User? user = FirebaseAuth.instance.currentUser;
  if (user == null || user.email == null) {
    throw Exception('No user logged in');
  }

  // Construct the URL with query parameters
  final Uri url = Uri.http('localhost:3000', '/api/favorite-song-per-year', {'userEmail': user.email});

  final response = await http.get(url);

    if (response.statusCode == 200) {
      Map<int, FavoriteSong> songsByYear = {};
      Map<String, dynamic> jsonData = json.decode(response.body);
      jsonData.forEach((key, value) {
        songsByYear[int.parse(key)] = FavoriteSong.fromJson(value);
      });
      return songsByYear;
    } else {
      print('Request failed with status: ${response.statusCode}.');
      print('Response body: ${response.body}');
      throw Exception('Failed to load favorite songs, status code: ${response.statusCode}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Favorite Songs by Year'),
      ),
      body: FutureBuilder<Map<int, FavoriteSong>>(
        future: favoriteSongs,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return CircularProgressIndicator();
          } else if (snapshot.hasError) {
            return Text("Error: ${snapshot.error}");
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Text('No favorite songs available');
          } else {
            return ListView.builder(
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                int year = snapshot.data!.keys.elementAt(index);
                FavoriteSong song = snapshot.data![year]!;
                return ListTile(
                  title: Text(song.title),
                  subtitle: Text('Year: ${song.year}, Rating: ${song.rating}'),
                );
              },
            );
          }
        },
      ),
    );
  }
}
