import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:cloud_firestore/cloud_firestore.dart';

class SongAddPage2 extends StatefulWidget {
  const SongAddPage2({Key? key}) : super(key: key);

  @override
  _SongAddPageState2 createState() => _SongAddPageState2();
}

class _SongAddPageState2 extends State<SongAddPage2> {
  final TextEditingController songNameController = TextEditingController();
  final TextEditingController artistNameController = TextEditingController();
  final TextEditingController albumNameController = TextEditingController();
  final TextEditingController yearNameController = TextEditingController();
  List<Song> songs = [];
  List<Song> searchResults = [];

  // Replace these with your actual Spotify API credentials
  final String clientId = 'bf75c821e4df4ebf9808a680b5c702a4';
  final String clientSecret = '6679207e99094bb7a84eaf0d9d745089';

  final CollectionReference songsCollection =
      FirebaseFirestore.instance.collection('songs');

  Future<void> addSongToFirebase() async {
    final String songName = songNameController.text;
    final String artistName = artistNameController.text;
    final String albumName = albumNameController.text;
    final String yearName = yearNameController.text;

    if (songName.isNotEmpty &&
        artistName.isNotEmpty &&
        albumName.isNotEmpty &&
        yearName.isNotEmpty) {
      // Add the song to Firebase Firestore
      await songsCollection.add({
        'id': UniqueKey().toString(), // Generating a unique identifier for the song
        'name': songName,
        'performers': artistName.split(','),
        'album': albumName,
        'year': yearName,
        'edit': 'Original', // Assuming a default edit/version
      });

      // Clear text controllers after adding the song
      songNameController.clear();
      artistNameController.clear();
      albumNameController.clear();
      yearNameController.clear();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Song added to Firebase')),
      );
    }
  }

  Future<String> getAccessToken() async {
    final response = await http.post(
      Uri.parse('https://accounts.spotify.com/api/token'),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ${base64Encode(utf8.encode('$clientId:$clientSecret'))}',
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
          final String songId = track['id']; // Unique identifier for the song
          final String songName = track['name'];
          final List<String> performers = List<String>.from(track['artists'].map((artist) => artist['name']));
          final String albumName = track['album']['name'];
          final String yearName = track['album']['release_date'].substring(0, 4);
          final String editName = track['type']; // Assuming 'type' provides information about the edit/version
          searchResults.add(Song(songId, songName, performers, albumName, yearName, editName));
        }

        // Fetch songs from Firebase and add them to the search results
        final QuerySnapshot firebaseSongs = await songsCollection.get();
        for (var doc in firebaseSongs.docs) {
          final String songId = doc['id'];
          final String songName = doc['name'];
          final List<String> performers = List<String>.from(doc['performers']);
          final String albumName = doc['album'];
          final String yearName = doc['year'];
          final String editName = doc['edit'];
          searchResults.add(Song(songId, songName, performers, albumName, yearName, editName));
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

  void removeSong(String songId) async {
    try {
      // Remove the song from Firebase
      await songsCollection.doc(songId).delete();

      // Remove the song from the search results
      searchResults.removeWhere((song) => song.songId == songId);

      // Update the UI by calling setState
      setState(() {});

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Song removed from Firebase')),
      );
    } catch (e) {
      print('Error during song removal: $e');
    }
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
              decoration: const InputDecoration(labelText: 'Artist Name (comma-separated for multiple artists)'),
            ),
            TextField(
              controller: albumNameController,
              decoration: const InputDecoration(labelText: 'Album Name'),
            ),
            TextField(
              controller: yearNameController,
              decoration: const InputDecoration(labelText: 'Year'),
            ),
            ElevatedButton(
              onPressed: addSongToFirebase,
              child: const Text('Add Song to Firebase'),
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
                        final Song currentSong = searchResults[index];

                        return ListTile(
                          title: Text(currentSong.name),
                          subtitle: Text(
                            'Artist: ${currentSong.performers.join(', ')}\nAlbum: ${currentSong.album}',
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ElevatedButton(
                                onPressed: () {
                                  // Call a function to remove the song
                                  removeSong(currentSong.songId);
                                },
                                child: const Text('Remove'),
                              ),
                            ],
                          ),
                        );
                      },
                    )
                  : const Center(
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
  final String songId;
  final String name;
  final List<String> performers;
  final String album;
  final String year;
  final String edit;

  Song(this.songId, this.name, this.performers, this.album, this.year, this.edit);
}
