import 'dart:convert';
import 'dart:io' show File;
import 'dart:html' as html;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:file_picker/file_picker.dart';

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
  List<Song> userSongList = [];

  final String clientId = 'bf75c821e4df4ebf9808a680b5c702a4';
  final String clientSecret = '6679207e99094bb7a84eaf0d9d745089';

  late User? currentUser;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final CollectionReference userSongCollection =
      FirebaseFirestore.instance.collection('user_songs');

  Future<void> addSong() async {
    final String songName = songNameController.text;
    final String artistName = artistNameController.text;
    final String albumName = albumNameController.text;
    final String yearName = yearNameController.text;

    if (songName.isNotEmpty &&
        artistName.isNotEmpty &&
        albumName.isEmpty &&
        yearName.isEmpty) {
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
        'Authorization':
            'Basic ${base64Encode(utf8.encode('$clientId:$clientSecret'))}',
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

      print(
          'Spotify API Request: https://api.spotify.com/v1/search?q=$query&type=track');

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
              track['album']['release_date'].substring(0, 4);
          searchResults.add(Song(songName, artistName));
        }

        print('Number of search results: ${searchResults.length}');
      } else {
        print('Failed to search songs. Status code: ${response.statusCode}');
        print('Response body: ${response.body}');
        throw Exception('Failed to search songs');
      }
    } catch (e) {
      print('Error during song search: $e');
    }

    setState(() {});
  }

  Future<void> fetchUserSongs() async {
    try {
      final querySnapshot = await userSongCollection
          .where('userId', isEqualTo: currentUser!.uid)
          .get();
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
    final documentReference =
        await userSongCollection.where('name', isEqualTo: song.name).get();

    for (final doc in documentReference.docs) {
      await doc.reference.delete();
    }

    await fetchUserSongs();
  }

  void addToUserList(Song selectedSong) async {
    setState(() {
      userSongList.add(selectedSong);
    });

    await userSongCollection.add({
      'userId': currentUser!.uid,
      'name': selectedSong.name,
      'artist': selectedSong.artist,
    });

    await fetchUserSongs();
  }

  Future<void> addSongsFromJsonFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );

      if (result != null) {
        if (kIsWeb) {
          final html.File file = html.File([result.files.single.bytes!], result.files.single.name);

          final html.FileReader reader = html.FileReader();
          reader.readAsText(file);

          await reader.onLoad.first;

          final String contents = reader.result as String;
          List<dynamic> songsData = json.decode(contents);

          for (var songData in songsData) {
            final String songName = songData['name'];
            final String artistName = songData['artist'];
            final String albumName = songData['album'] ?? '';
            final String yearName = songData['year'].toString() ?? '';
            final String rating = songData['rating'].toString() ?? '';

            addToUserList(Song(songName, artistName));
          }
        } else {
          File file = File(result.files.single.path!);
          String contents = await file.readAsString();
          List<dynamic> songsData = json.decode(contents);

          for (var songData in songsData) {
            final String songName = songData['name'];
            final String artistName = songData['artist'];
            final String albumName = songData['album'] ?? '';
            final String yearName = songData['year'].toString() ?? '';
            final String rating = songData['rating'].toString() ?? '';

            addToUserList(Song(songName, artistName));
          }
        }
      }
    } catch (e) {
      print('Error adding songs from JSON file: $e');
    }
  }

  Future<void> _signIn() async {
  try {
    // Check if there's already a signed-in user
    if (_auth.currentUser != null) {
      currentUser = _auth.currentUser;
      print('User already signed in: ${currentUser!.uid}');
      await fetchUserSongs(); // Fetch user songs after signing in
    } else {
      // No user signed in, proceed with sign-in
      UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: "example@example.com", // Replace with the user's email
        password: "password123", // Replace with the user's password
      );

      currentUser = userCredential.user;
      print('Signed in: ${currentUser!.uid}');
      await fetchUserSongs(); // Fetch user songs after signing in
    }
  } catch (e) {
    print('Failed to sign in: $e');
    // Handle the error or retry the sign-in if needed
  }
}



  @override
  void initState() {
    super.initState();
    _signIn();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home Page'),
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
                      child: Text(
                          'No results found for the given search query.'),
                    ),
            ),
            ElevatedButton(
              onPressed: () {
                addSongsFromJsonFile();
              },
              child: const Text('Add JSON File'),
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
