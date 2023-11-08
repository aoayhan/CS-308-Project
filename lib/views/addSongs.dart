import 'package:flutter/material.dart';

class SongAddPage extends StatefulWidget {
  @override
  _SongAddPageState createState() => _SongAddPageState();
}

class _SongAddPageState extends State<SongAddPage> {
  final TextEditingController songNameController = TextEditingController();
  final TextEditingController artistNameController = TextEditingController();
  List<Song> songs = [];
  List<Song> searchResults = []; // Arama sonuçlarını saklamak için bir liste

  void addSong() {
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

  void searchSongs(String query) {
    searchResults.clear(); // Her arama öncesinde sonuçları temizle
    for (Song song in songs) {
      if (song.name.contains(query) || song.artist.contains(query)) {
        searchResults.add(song);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Spotify Clone'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: <Widget>[
            TextField(
              controller: songNameController,
              decoration: InputDecoration(labelText: 'Song Name'),
            ),
            TextField(
              controller: artistNameController,
              decoration: InputDecoration(labelText: 'Artist Name'),
            ),
            ElevatedButton(
              onPressed: addSong,
              child: Text('Add Song'),
            ),
            TextField(
              onChanged: (query) {
                searchSongs(query);
              },
              decoration: InputDecoration(labelText: 'Search Songs'),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: searchResults.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    title: Text(searchResults[index].name),
                    subtitle: Text(searchResults[index].artist),
                  );
                },
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