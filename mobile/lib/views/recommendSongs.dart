import 'package:flutter/material.dart';
import 'package:supotify/utilis/songServices.dart';// Import the service file

class RecommendSongsPage extends StatefulWidget {
  const RecommendSongsPage({super.key});

  @override
  _RecommendSongsPageState createState() => _RecommendSongsPageState();
}

class _RecommendSongsPageState extends State<RecommendSongsPage> {
  late Future<List<dynamic>> recommendedSongs;

  @override
  void initState() {
    super.initState();
    // Replace 'user@email.com' with the actual method to retrieve the user's email.
    recommendedSongs = SongService().recommendSongs('user@email.com');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recommended Songs'),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: recommendedSongs,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const CircularProgressIndicator();
          } else if (snapshot.hasError) {
            return Text('Error: ${snapshot.error}');
          } else if (snapshot.hasData) {
            return ListView.builder(
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                var song = snapshot.data![index];
                return ListTile(
                  title: Text(song['songName']),
                  subtitle: Text('${song['artistName']} - ${song['albumName']}'),
                );
              },
            );
          } else {
            return const Text('No recommendations available.');
          }
        },
      ),
    );
  }
}