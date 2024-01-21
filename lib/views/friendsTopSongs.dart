import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class FriendsTopSongsPage extends StatefulWidget {
  final String friendEmail;

  const FriendsTopSongsPage({Key? key, required this.friendEmail}) : super(key: key);

  @override
  _FriendsTopSongsPageState createState() => _FriendsTopSongsPageState();
}

class _FriendsTopSongsPageState extends State<FriendsTopSongsPage> {
  List<dynamic> topSongs = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    if (widget.friendEmail.isNotEmpty) {
      fetchTopSongs();
    }
  }

  Future<void> fetchTopSongs() async {
  try {
    final response = await http.get(
      Uri.parse('http://localhost:3000/api/get-friends-top-songs?userEmail=${widget.friendEmail}'),
    );

    print("API Response: ${response.body}");

    if (response.statusCode == 200) {
      setState(() {
        topSongs = json.decode(response.body);
        print("Parsed Songs: $topSongs");
        isLoading = false;
      });
    } else {
      throw Exception('Failed to load songs');
    }
  } catch (e) {
    setState(() {
      isLoading = false;
    });
    print(e.toString());
    // Optionally, show an error message
  }
}


  @override
  Widget build(BuildContext context) {
    if (widget.friendEmail.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('No friend email provided')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.friendEmail}\'s Top Songs'),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: topSongs.length,
              itemBuilder: (context, index) {
                var song = topSongs[index]['songs'];
                return ListView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: song.length,
                    itemBuilder: (context, songIndex) {
                      return ListTile(
                        title: Text(song[songIndex]['name'] ?? 'Unknown Song'),
                        subtitle: Text('${song[songIndex]['artist']} (${song[songIndex]['year']})'),
                      );
                    },
                );
              },
            ),
    );
  }
}
