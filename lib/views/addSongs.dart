import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class SongAddPage extends StatefulWidget {
  const SongAddPage({Key? key}) : super(key: key);

  @override
  _SongAddPageState createState() => _SongAddPageState();
}

class _SongAddPageState extends State<SongAddPage> {
  final TextEditingController songNameController = TextEditingController();
  final TextEditingController artistNameController = TextEditingController();
  List<Song> songs = [];
  List<Song> searchResults = [];

  // Replace these with your actual Spotify API credentials
  final String clientId = 'bf75c821e4df4ebf9808a680b5c702a4';
  final String clientSecret = '6679207e99094bb7a84eaf0d9d745089';

  Future<void> addSong() async {
    final String songName = songNameController.text;
    final String artistName = artistNameController.text;

    if (songName.isNotEmpty && artistName.isNotEmpty) {
      setState(() {
        songs.add(Song(songName, artistName));
        songNameController.clear();
        artistNameController.clear();
      });
    }
  }

  Future<String> getAccessToken() async {
    final response = await http.post(
      Uri.parse('https://accounts.spotify.com/api/token'),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + base64Encode(utf8.encode('$clientId:$clientSecret')),
      },
      body: 'grant_type=client_credentials',
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = json.decode(response.body);
      return data['access_token'];
    } else {
      throw Exception('Failed to get Spotify token: ${response.statusCode}');
    }
  }

  Future<void> searchSongs(String query) async {
    searchResults.clear();

    if (query.isEmpty) {
      print('Empty search query. Please enter a search term.');
      return;
    }

    try {
      final accessToken = await getAccessToken();

      // Print the Spotify API request URL for debugging
      print('Spotify API Request: https://api.spotify.com/v1/search?q=$query&type=track');

      final response = await http.get(
        Uri.parse('https://api.spotify.com/v1/search?q=$query&type=track'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        final List<dynamic> tracks = data['tracks']['items'];

        for (final track in tracks) {
          final String songName = track['name'];
          final String artistName = track['artists'][0]['name'];
          searchResults.add(Song(songName, artistName));
        }

        // Print the number of search results for debugging
        print('Number of search results: ${searchResults.length}');
      } else {
        // Print detailed error information for debugging
        print('Failed to search songs. Status code: ${response.statusCode}');
        print('Response body: ${response.body}');
        throw Exception('Failed to search songs');
      }
    } catch (e) {
      // Print any exceptions that might occur
      print('Error during song search: $e');
    }
    // Update the UI by calling setState
    setState(() {});
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home Page'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: <Widget>[
            TextField(
              controller: songNameController,
              decoration: const InputDecoration(labelText: 'Song Name'),
            ),
            TextField(
              controller: artistNameController,
              decoration: const InputDecoration(labelText: 'Artist Name'),
            ),
            ElevatedButton(
              onPressed: addSong,
              child: const Text('Add Song'),
            ),
            TextField(
              onChanged: (query) {
                searchSongs(query);
              },
              decoration: const InputDecoration(labelText: 'Search Songs'),
            ),
            Expanded(
              child: searchResults.isNotEmpty
                  ? ListView.builder(
                itemCount: searchResults.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    title: Text(searchResults[index].name),
                    subtitle: Text(searchResults[index].artist),
                  );
                },
              )
                  : Center(
                child: Text('No results found for the given search query.'),
              ),
            ),

          ],
        ),
      ),
    );
  }
}

class Song {
  final String name;
  final String artist;

  Song(this.name, this.artist);
}


