import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';

class SongAddPage extends StatefulWidget {
  const SongAddPage({Key? key}) : super(key: key);

  @override
  _SongAddPageState createState() => _SongAddPageState();
}

class _SongAddPageState extends State<SongAddPage> {
  final TextEditingController songNameController = TextEditingController();
  final TextEditingController artistNameController = TextEditingController();
  final TextEditingController albumNameController = TextEditingController();
  final TextEditingController yearNameController = TextEditingController();

  List<Song> songs = [];
  List<Song> searchResults = [];
  List<Song> userSongList = []; // List to store the user's selected songs

  // Replace these with your actual Spotify API credentials
  final String clientId = 'bf75c821e4df4ebf9808a680b5c702a4';
  final String clientSecret = '6679207e99094bb7a84eaf0d9d745089';

  // Reference to the Firestore collection
  final CollectionReference userSongCollection =
      FirebaseFirestore.instance.collection('user_songs');

  Future<void> addSong() async {
    final String songName = songNameController.text;
    final String artistName = artistNameController.text;
    final String albumName = albumNameController.text;
    final String yearName = yearNameController.text;

    if (songName.isNotEmpty && artistName.isNotEmpty && albumName.isEmpty && yearName.isEmpty) {
      setState(() {
        songs.add(Song(songName, artistName));
        songNameController.clear();
        artistNameController.clear();
        albumNameController.clear();
        yearNameController.clear();
      });
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
          final String songName = track['name'];
          final String artistName = track['artists'][0]['name'];
          final String albumName = track['album']['name'];
          final String yearName = track['album']['release_date'].substring(0, 4);
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

  Future<void> fetchUserSongs() async {
    try {
      final querySnapshot = await userSongCollection.get();
      final List<Song> userSongs = querySnapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return Song(data['name'], data['artist']);
      }).toList();

      setState(() {
        userSongList = userSongs;
      });
    } catch (e) {
      print('Error fetching user songs: $e');
    }
  }

  void removeUserSong(Song song) async {
    // Find the document reference for the song in Firebase
    final documentReference =
        await userSongCollection.where('name', isEqualTo: song.name).get();

    // Delete the song from Firebase
    for (final doc in documentReference.docs) {
      await doc.reference.delete();
    }

    // Fetch updated user songs
    await fetchUserSongs();
  }

  // Function to add a selected song to the user's list and send it to Firebase
  void addToUserList(Song selectedSong) async {
    setState(() {
      userSongList.add(selectedSong);
    });

    // Add the user's song list to Firebase
    await userSongCollection.add({
      'name': selectedSong.name,
      'artist': selectedSong.artist,
    });

    // Fetch updated user songs
    await fetchUserSongs();
  }

  @override
  void initState() {
    super.initState();
    fetchUserSongs();
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
            Expanded(
              child: userSongList.isNotEmpty
                  ? ListView.builder(
                      itemCount: userSongList.length,
                      itemBuilder: (context, index) {
                        final Song currentSong = userSongList[index];

                        return ListTile(
                          title: Text(currentSong.name),
                          subtitle: Text(currentSong.artist),
                          // Add a button to remove the song from the user's list
                          trailing: ElevatedButton(
                            onPressed: () {
                              removeUserSong(currentSong);
                            },
                            child: const Text('Remove'),
                          ),
                        );
                      },
                    )
                  : const Center(
                      child: Text('No songs found.'),
                    ),
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
                          subtitle: Text(currentSong.artist),
                          // Add a button to add the song to the user's list
                          trailing: ElevatedButton(
                            onPressed: () {
                              addToUserList(currentSong);
                            },
                            child: const Text('Add to List'),
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
  final String name;
  final String artist;

  Song(this.name, this.artist);
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MaterialApp(
    home: SongAddPage(),
  ));
}
