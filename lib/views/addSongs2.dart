import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io' show File;
import 'package:supotify/reusable_widgets/reusable_widget.dart';
import 'package:supotify/views/addSongs.dart';

class AddSongPage2 extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Spotify Search',
      
      theme: ThemeData(
        primarySwatch: Colors.green,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: SearchPage(),
    );
  }
}

class SearchPage extends StatefulWidget {
  @override
  _SearchPageState createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _songNameController = TextEditingController();
  final TextEditingController _artistController = TextEditingController();
  final TextEditingController _albumController = TextEditingController();
  final TextEditingController _yearController = TextEditingController();
  List<SimplifiedTrack> _searchResults = [];
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<void> searchSong(String query) async {
    final url = 'http://localhost:3000/spotify-search?q=${Uri.encodeComponent(query)}';
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      setState(() {
        _searchResults = data.map((e) => SimplifiedTrack.fromJson(e)).toList();
      });
    } else {
      throw Exception('Failed to load songs');
    }
  }

  Future<void> addSong(SimplifiedTrack track, int rating) async {
    final User? user = _auth.currentUser;
    final String? userId = user?.email;

    if (userId == null) {
      throw Exception('User not logged in');
    }

    final url = 'http://localhost:3000/api/add-song';
    final response = await http.post(
      Uri.parse(url),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(<String, dynamic>{
        'songName': track.songName,
        'album': track.albumName,
        'artist': track.artistName,
        'year': track.year,
        'rating': rating,
        'userId': userId,
      }),
    );

    if (response.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Song added successfully')),
      );
    } else {
      throw Exception('Failed to add song: ${response.body}');
    }
  }

  void showRatingDialog(SimplifiedTrack track) {
    final _ratingController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Rate ${track.songName}'),
          content: TextField(
            controller: _ratingController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              hintText: 'Enter a rating from 1 to 10',
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: Text('Submit'),
              onPressed: () {
                final rating = int.tryParse(_ratingController.text);
                if (rating != null && rating > 0 && rating <= 10) {
                  addSong(track, rating);
                  Navigator.of(context).pop();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Please enter a valid rating')),
                  );
                }
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> uploadBatchSongs(File file) async {
    try {
      final url = 'http://localhost:3000/api/add-batch-songs';
      final request = http.MultipartRequest('POST', Uri.parse(url))
        ..files.add(
          await http.MultipartFile.fromBytes(
            'songsFile',
            await file.readAsBytes(),
            filename: 'songsFile.json',
          ),
        );

      final response = await http.Response.fromStream(await request.send());

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Songs added successfully')),
        );
      } else {
        throw Exception('Failed to add batch songs: ${response.body}');
      }
    } catch (error) {
      print('Error uploading batch songs: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error uploading batch songs')),
      );
    }
  }

  Future<void> _pickAndUploadFile() async {
    final FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );

    if (result != null) {
      final file = File(result.files.single.path!);
      await uploadBatchSongs(file);
    }
  }

  Future<void> addSongByInput() async {
  final songName = _songNameController.text;
  final artist = _artistController.text;
  final album = _albumController.text;
  final year = _yearController.text;

  if (songName.isEmpty || artist.isEmpty || album.isEmpty || year.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Please fill in all fields')),
    );
    return;
  }

  final User? user = _auth.currentUser;
  final String? userId = user?.email;

  if (userId == null) {
    throw Exception('User not logged in');
  }

  final url = 'http://localhost:3000/api/add-song';
  final response = await http.post(
    Uri.parse(url),
    headers: <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: jsonEncode(<String, dynamic>{
      'songName': songName,
      'album': album,
      'artist': artist,
      'year': year,
      'userId': userId,
    }),
  );

  if (response.statusCode == 201) {
    // If the song is added successfully, show the rating dialog
    final SimplifiedTrack track = SimplifiedTrack(
      songName: songName,
      artistName: artist,
      albumName: album,
      year: year,
    );
    showRatingDialog(track);
  } else {
    throw Exception('Failed to add song: ${response.body}');
  }
}

 Future<void> deleteSong(String songName, String artistName) async {
    final User? user = _auth.currentUser;
    final String? userId = user?.email;

    if (userId == null) {
      throw Exception('User not logged in');
    }

    final url = 'http://localhost:3000/api/delete-song';
    final response = await http.delete(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json; charset=UTF-8'},
      body: jsonEncode({
        'songName': songName,
        'artist': artistName,
        'userId': userId,
      }),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Song deleted successfully')),
      );
    } else {
      throw Exception('Failed to delete song: ${response.body}');
    }
  }

Future<void> deleteSongsByAlbum(String albumName) async {
    final url = 'http://localhost:3000/api/delete-songs-by-album';
    final response = await http.delete(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json; charset=UTF-8'},
      body: jsonEncode({'album': albumName}),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('All songs in the album deleted successfully')),
      );
    } else {
      throw Exception('Failed to delete songs: ${response.body}');
    }
  }
  
  Future<void> deleteSongsByArtist(String artistName) async {
    final User? user = _auth.currentUser;
    final String? userEmail = user?.email;

    if (userEmail == null) {
      throw Exception('User not logged in');
    }

    final url = 'http://localhost:3000/api/delete-songs-by-artist';
    final response = await http.delete(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json; charset=UTF-8'},
      body: jsonEncode({
        'artist': artistName,
        'userEmail': userEmail,
      }),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('All songs by the artist deleted successfully')),
      );
    } else {
      throw Exception('Failed to delete songs: ${response.body}');
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Flutter Spotify Search'),
        actions: <Widget>[
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 8.0), // Adjust padding as needed
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(context,
                    MaterialPageRoute(builder: (context) => UserSongs()));
              },
              style: ElevatedButton.styleFrom(
                primary: Colors.green, // Button color
                onPrimary: Colors.white, // Text color
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: Text(
                'Your Songs',
                style: TextStyle(fontSize: 14), // Adjust font size as needed
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              _pickAndUploadFile(); // You can replace this with your desired action
            },
            
            child: Text('Upload JSON'),
          ),
          
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                TextField(
                  controller: _songNameController,
                  decoration: InputDecoration(
                    labelText: 'Song Name',
                  ),
                ),
                TextField(
                  controller: _artistController,
                  decoration: InputDecoration(
                    labelText: 'Artist',
                  ),
                ),
                TextField(
                  controller: _albumController,
                  decoration: InputDecoration(
                    labelText: 'Album',
                  ),
                ),
                TextField(
                  controller: _yearController,
                  decoration: InputDecoration(
                    labelText: 'Year',
                  ),
                ),
                Row(
            children: [
              ElevatedButton(
                onPressed: addSongByInput,
                child: Text('Add Song'),
              ),
              SizedBox(width: 8), // Spacing between the buttons
              ElevatedButton(
                onPressed: () {
                  final songName = _songNameController.text;
                  final artist = _artistController.text;
                  if (songName.isNotEmpty && artist.isNotEmpty) {
                    deleteSong(songName, artist);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Please enter song name and artist')),
                    );
                  }
                },
                child: Text('Remove Song'),
                style: ElevatedButton.styleFrom(
                  primary: Colors.red, // Button color for delete
                ),
              ),
              SizedBox(width: 8),
               ElevatedButton(
            onPressed: () {
              final albumName = _albumController.text;
              if (albumName.isNotEmpty) {
                deleteSongsByAlbum(albumName);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Please enter an album name')),
                );
              }
            },
            child: Text('Remove Album'),
            style: ElevatedButton.styleFrom(
              primary: Colors.red,
            ),
          ),
          SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  final artistName = _artistController.text;
                  if (artistName.isNotEmpty && _albumController.text.isEmpty && _songNameController.text.isEmpty && _yearController.text.isEmpty) {
                    deleteSongsByArtist(artistName);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Please enter only the artist name')),
                    );
                  }
                },
                child: Text('Remove Artist'),
                style: ElevatedButton.styleFrom(
                  primary: Colors.red,
                ),
              ),
          
            ],
          ),
                
                 /*firebaseUIButton(context, "My Songs", () {
                  
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => UserSongs()));
                 
                }),*/
              ],
            ),
          ),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: 'Search for a song',
              suffixIcon: IconButton(
                icon: Icon(Icons.search),
                onPressed: () => searchSong(_searchController.text),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _searchResults.length,
              itemBuilder: (context, index) {
                final track = _searchResults[index];
                return ListTile(
                  title: Text(track.songName),
                  subtitle: Text('${track.artistName} - ${track.albumName}'),
                  trailing: IconButton(
                    icon: Icon(Icons.add),
                    onPressed: () {
                      showRatingDialog(track);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class SimplifiedTrack {
  final String songName;
  final String artistName;
  final String albumName;
  final String year;

  SimplifiedTrack({
    required this.songName,
    required this.artistName,
    required this.albumName,
    required this.year,
  });

  factory SimplifiedTrack.fromJson(Map<String, dynamic> json) {
    return SimplifiedTrack(
      songName: json['songName'],
      artistName: json['artistName'],
      albumName: json['albumName'],
      year: json['year'],
    );
  }
}
