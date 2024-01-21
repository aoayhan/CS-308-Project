import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io' show File;
import 'package:supotify/views/addSongs.dart';

class AddSongPage2 extends StatelessWidget {
  const AddSongPage2({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Spotify Search',
      
      theme: ThemeData(
        primarySwatch: Colors.green,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const SearchPage(),
    );
  }
}

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  _SearchPageState createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _songNameController = TextEditingController();
  final TextEditingController _artistController = TextEditingController();
  final TextEditingController _albumController = TextEditingController();
  final TextEditingController _yearController = TextEditingController();
 final GlobalKey<FormState> _formKey = GlobalKey<FormState>(); // Form key
 final TextEditingController _artistRatingController = TextEditingController();
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

    const url = 'http://localhost:3000/api/add-song';
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
        const SnackBar(content: Text('Song added successfully')),
      );
    } else {
      throw Exception('Failed to add song: ${response.body}');
    }
  }

  void showRatingDialog(SimplifiedTrack track) {
    final ratingController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Rate ${track.songName}'),
          content: TextField(
            controller: ratingController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: 'Enter a rating from 1 to 10',
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Submit'),
              onPressed: () {
                final rating = int.tryParse(ratingController.text);
                if (rating != null && rating > 0 && rating <= 10) {
                  addSong(track, rating);
                  Navigator.of(context).pop();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a valid rating')),
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
      const url = 'http://localhost:3000/api/add-batch-songs';
      final request = http.MultipartRequest('POST', Uri.parse(url))
        ..files.add(
          http.MultipartFile.fromBytes(
            'songsFile',
            await file.readAsBytes(),
            filename: 'songsFile.json',
          ),
        );

      final response = await http.Response.fromStream(await request.send());

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Songs added successfully')),
        );
      } else {
        throw Exception('Failed to add batch songs: ${response.body}');
      }
    } catch (error) {
      print('Error uploading batch songs: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error uploading batch songs')),
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
      const SnackBar(content: Text('Please fill in all fields')),
    );
    return;
  }

  final User? user = _auth.currentUser;
  final String? userId = user?.email;

  if (userId == null) {
    throw Exception('User not logged in');
  }

  const url = 'http://localhost:3000/api/add-song';
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

    const url = 'http://localhost:3000/api/delete-song';
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
        const SnackBar(content: Text('Song deleted successfully')),
      );
    } else {
      throw Exception('Failed to delete song: ${response.body}');
    }
  }

Future<void> deleteSongsByAlbum(String albumName) async {
    const url = 'http://localhost:3000/api/delete-songs-by-album';
    final response = await http.delete(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json; charset=UTF-8'},
      body: jsonEncode({'album': albumName}),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All songs in the album deleted successfully')),
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

    const url = 'http://localhost:3000/api/delete-songs-by-artist';
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
        const SnackBar(content: Text('All songs by the artist deleted successfully')),
      );
    } else {
      throw Exception('Failed to delete songs: ${response.body}');
    }
  }

Future<void> submitArtistRating(int rating) async {
  final artistName = _artistController.text;
  final User? user = _auth.currentUser;
  final String? userId = user?.email;

  if (artistName.isEmpty || userId == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Please enter the artist name')),
    );
    return;
  }

  const url = 'http://localhost:3000/api/rate-artist';
  try {
    final response = await http.post(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json; charset=UTF-8'},
      body: jsonEncode({
        'artist': artistName,
        'rating': rating,
        'userId': userId,
      }),
    );

    if (response.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Artist rated successfully')),
      );
    } else {
      throw Exception('Failed to rate artist: ${response.body}');
    }
  } catch (error) {
    print('Error rating artist: $error');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Error rating artist')),
    );
  }
}


 void rateArtist() {
  final TextEditingController ratingController = TextEditingController();
  showDialog(
    context: context,
    builder: (context) {
      return AlertDialog(
        title: const Text('Rate Artist'),
        content: TextField(
          controller: ratingController,
          decoration: const InputDecoration(hintText: "Enter a rating (1-10)"),
          keyboardType: TextInputType.number,
        ),
        actions: <Widget>[
          TextButton(
            child: const Text('Cancel'),
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
          TextButton(
            child: const Text('Submit'),
            onPressed: () async {
              final rating = int.tryParse(ratingController.text);
              if (rating != null && rating >= 1 && rating <= 10) {
                // Call the function to send the rating to the server
                await submitArtistRating(rating);
                Navigator.of(context).pop();
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a valid rating')),
                );
              }
            },
          ),
        ],
      );
    },
  );
}


 @override
  Widget build(BuildContext context) {
    double halfScreenWidth = MediaQuery.of(context).size.width / 1.2;
    return Scaffold(
      //backgroundColor: const Color.fromARGB(255, 70, 68, 68),
      appBar: AppBar(
        title: const Text('Flutter Spotify Search'),
        actions: <Widget>[
          ElevatedButton(
            onPressed: () {
              Navigator.push(context,
                  MaterialPageRoute(builder: (context) => const UserSongs()));
            },
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text(
              'Your Songs',
              style: TextStyle(fontSize: 14),
            ),
          ),
          ElevatedButton(
            onPressed: _pickAndUploadFile,
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text('Upload JSON'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                
                Row(
              children: [
                SizedBox(
                  width: halfScreenWidth,
                  child: TextFormField(
                    controller: _songNameController,
                    decoration: const InputDecoration(
                      icon: Icon(Icons.music_note),
                      labelText: 'Song Name',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter the song name';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                SizedBox(
                  width: halfScreenWidth,
                  child: TextFormField(
                    controller: _artistController,
                    decoration: const InputDecoration(
                      icon: Icon(Icons.person),
                      labelText: 'Artist',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter the artist name';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                SizedBox(
                  width: halfScreenWidth,
                  child: TextFormField(
                    controller: _albumController,
                    decoration: const InputDecoration(
                      icon: Icon(Icons.album),
                      labelText: 'Album',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter the album name';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                SizedBox(
                  width: halfScreenWidth,
                  child: TextFormField(
                    controller: _yearController,
                    decoration: const InputDecoration(
                      icon: Icon(Icons.calendar_today),
                      labelText: 'Year',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter the year';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
                const SizedBox(height: 16),
                Row(
  children: [
    ElevatedButton(
      onPressed: addSongByInput,
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
      child: const Text('Add Song'),
    ),
    const SizedBox(width: 8),
    ElevatedButton(
      onPressed: () {
        final albumName = _albumController.text;
        if (albumName.isNotEmpty) {
          deleteSongsByAlbum(albumName);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enter an album name')),
          );
        }
      },
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
      child: const Text('Remove Album'),
    ),
    const SizedBox(width: 8),
    ElevatedButton(
      onPressed: () {
        final artistName = _artistController.text;
        if (artistName.isNotEmpty) {
          deleteSongsByArtist(artistName);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enter an artist name')),
          );
        }
      },
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
      child: const Text('Remove Artist'),
    ),
    const SizedBox(width: 8),
    ElevatedButton(
      onPressed: rateArtist,
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
      child: const Text('Rate Artist'),
    ),
  ],
),

                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    labelText: 'Search for a song',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: () => searchSong(_searchController.text),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _searchResults.length,
                  itemBuilder: (context, index) {
                    final track = _searchResults[index];
                    return ListTile(
                      title: Text(track.songName),
                      subtitle: Text('${track.artistName} - ${track.albumName}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: () {
                          showRatingDialog(track);
                        },
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
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

 /* SizedBox(width: 8), // Spacing between the buttons
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
              ),*/