import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class FriendManagementPage extends StatefulWidget {
  const FriendManagementPage({Key? key}) : super(key: key);

  @override
  _FriendManagementPageState createState() => _FriendManagementPageState();
}

class _FriendManagementPageState extends State<FriendManagementPage> {
  final TextEditingController friendEmailController = TextEditingController();

  Future<String?> getUserId() async {
  User? user = FirebaseAuth.instance.currentUser;

  if (user != null) {
    // User is signed in
    return user.email;
  } else {
    // No user is signed in
    return null;
  }
}

  Future<void> addFriend(String friendEmail) async {
    String? userEmail = await getUserId();

    if (userEmail == null || friendEmail.isEmpty) {
      // Handle error: user is not logged in or friendEmail is not provided
      return;
    }

    var url = Uri.parse('http://localhost:3000/api/addFriend');
    var response = await http.post(
      url,
      headers: <String, String>{
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'userEmail': userEmail,
        'friendEmail': friendEmail,
      }),
    );

    if (response.statusCode == 200) {
      // Friend added successfully
    } else {
      // Handle error
    }
  }

  Future<void> deleteFriend() async {
    String? userEmail = await getUserId();
    final String friendEmail = friendEmailController.text;

    if (userEmail == null || friendEmail.isEmpty) {
      // Handle error
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/deleteFriend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userEmail': userEmail, 'friendEmail': friendEmail}),
      );

      if (response.statusCode == 200) {
        // Friend deleted successfully
      } else {
        // Handle failure
      }
    } catch (error) {
      // Handle the error
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Friend Management'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: friendEmailController,
              decoration: const InputDecoration(labelText: 'Friend Email'),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: () => addFriend(friendEmailController.text),
                  child: const Text('Add Friend'),
                ),
                ElevatedButton(
                  onPressed: deleteFriend,
                  child: const Text('Delete Friend'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}