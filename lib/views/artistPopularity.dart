import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

// Define a class for Top Artist
class TopArtist {
  final String artist;
  final int count;

  TopArtist({required this.artist, required this.count});

  factory TopArtist.fromJson(Map<String, dynamic> json) {
    return TopArtist(
      artist: json['artist'],
      count: json['count'],
    );
  }
}

// Create a Stateful Widget for the Top Artist Page
class TopArtistPage extends StatefulWidget {
  const TopArtistPage({super.key});

  @override
  _TopArtistPageState createState() => _TopArtistPageState();
}

class _TopArtistPageState extends State<TopArtistPage> {
  late Future<List<TopArtist>> topArtists;

  @override
  void initState() {
    super.initState();
    topArtists = fetchTopArtists();
  }

  // Function to fetch the top artists from your API
  Future<List<TopArtist>> fetchTopArtists() async {
    final response = await http.get(Uri.parse('http://localhost:3000/api/artist-popularity'));

    if (response.statusCode == 200) {
      List<dynamic> artistsJson = json.decode(response.body);
      return artistsJson.map((json) => TopArtist.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load artists');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Top Artists'),
      ),
      body: Center(
        child: FutureBuilder<List<TopArtist>>(
          future: topArtists,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            } else if (snapshot.hasError) {
              return Text("Error: ${snapshot.error}");
            } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const Text('No data available');
            } else {
              // Use a ListView to display each artist
              return ListView.builder(
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) {
                  TopArtist artist = snapshot.data![index];
                  return ListTile(
                    title: Text(artist.artist),
                    subtitle: Text('Songs: ${artist.count}'),
                  );
                },
              );
            }
          },
        ),
      ),
    );
  }
}
