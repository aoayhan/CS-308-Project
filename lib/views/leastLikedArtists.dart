import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:io';


class LeastLikedArtistPage extends StatefulWidget {
  @override
  _LeastLikedArtistPageState createState() => _LeastLikedArtistPageState();
}

class _LeastLikedArtistPageState extends State<LeastLikedArtistPage> {
  String _leastLikedArtist = '';
  bool _isLoading = false;

 @override
  void initState() {
    super.initState();
    _fetchLeastLikedArtist();
  }

  Future<void> _fetchLeastLikedArtist() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Get the current user's email from Firebase
      User? user = FirebaseAuth.instance.currentUser;
      final userEmail = user?.email;

      if (userEmail == null) {
        throw Exception('No user signed in');
      }

      final uri = Uri.http('localhost:3000', '/api/get-least-liked-artist', {'userEmail': userEmail});

      final response = await http.get(uri);
      
      if (response.statusCode == 200) {
        // If server returns an OK response, parse the JSON
        final data = json.decode(response.body);
        setState(() {
          _leastLikedArtist = data['leastLikedArtist'] ?? 'No least liked artist found';
        });
      } else {
        // If the server did not return a 200 OK response,
        // then throw an exception.
        throw Exception('Failed to load least liked artist');
      }
    } catch (e) {
      print(e);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Least Liked Artist'),
      ),
      body: Center(
        child: _isLoading
            ? CircularProgressIndicator()
            : Text(_leastLikedArtist),
      ),
    );
  }
}
