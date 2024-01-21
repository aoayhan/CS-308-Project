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
  final FirebaseAuth _auth = FirebaseAuth.instance;
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

  Future<void> sendFriendRequest() async {
    User? user = FirebaseAuth.instance.currentUser;
    String? userEmail = user?.email;
    String friendEmail = friendEmailController.text.trim();

    if (userEmail == null || userEmail.isEmpty) {
      print('User is not logged in.');
      return;
    }

    if (friendEmail.isEmpty) {
      print('Friend email is empty.');
      return;
    }

    try {
      var url = Uri.parse('http://localhost:3000/api/send-friend-request');
      var response = await http.post(
        url,
        headers: <String, String>{
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'fromUserEmail': userEmail,
          'toUserEmail': friendEmail,
        }),
      );

      if (response.statusCode == 200) {
        print('Friend request sent successfully');
        friendEmailController.clear();
      } else {
        print('Error sending friend request. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error sending friend request: $error');
    }
  }

  Future<void> deleteFriend() async {
    String? userEmail = await getUserId();
    final String friendEmail = friendEmailController.text;

    if (userEmail == null || friendEmail.isEmpty) {
      print('User is not logged in or friendEmail is empty.');
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/deleteFriend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userEmail': userEmail, 'friendEmail': friendEmail}),
      );

      if (response.statusCode == 200) {
        _loadFriends();
        friendEmailController.clear();
      } else {
        print('Error deleting friend. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error deleting friend: $error');
    }
  }

  List<String> friendsList = [];
  List<String> friendRequests = [];

  Future<void> _loadFriends() async {
    String? userEmail = await getUserId();

    if (userEmail == null) {
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('http://localhost:3000/api/get-user-friends?userEmail=$userEmail'),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        setState(() {
          friendsList = List<String>.from(data['friends']);
        });
      } else {
        print('Error loading friends. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error loading friends: $error');
    }
  }

  Future<void> viewFriendRequests() async {
    String? userEmail = await getUserId();

    if (userEmail == null) {
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('http://localhost:3000/api/view-friend-requests?userEmail=$userEmail'),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        setState(() {
          friendRequests = List<String>.from(data['pendingRequests'] ?? []);
        });
      } else {
        print('Error viewing friend requests. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error viewing friend requests: $error');
    }
  }

  Future<void> acceptFriendRequest(String friendEmail) async {
    String? userEmail = await getUserId();

    if (userEmail == null) {
      return;
    }

    try {
      var url = Uri.parse('http://localhost:3000/api/accept-friend-request');
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
        print('Friend request accepted successfully');
        _loadFriends();
        viewFriendRequests();
      } else {
        print('Error accepting friend request. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error accepting friend request: $error');
    }
  }

  Future<void> rejectFriendRequest(String friendEmail) async {
    String? userEmail = await getUserId();

    if (userEmail == null) {
      return;
    }

    try {
      var url = Uri.parse('http://localhost:3000/api/reject-friend-request');
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
        print('Friend request rejected successfully');
        _loadFriends();
        viewFriendRequests();
      } else {
        print('Error rejecting friend request. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error rejecting friend request: $error');
    }
  }

  @override
  void initState() {
    super.initState();
    _loadFriends();
    viewFriendRequests();
  }

    @override
  Widget build(BuildContext context) {
    return Scaffold(
      //backgroundColor: const Color.fromARGB(255, 70, 68, 68),
      appBar: AppBar(
        title: const Text('Friend Management'),
        actions: [
          IconButton(
            onPressed: () {
              showModalBottomSheet(
                context: context,
                builder: (BuildContext context) {
                  return Container(
                    height: 200,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Text(
                          'Friend Requests:',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(
                          height: 120,
                          child: ListView.builder(
                            itemCount: friendRequests.length,
                            itemBuilder: (context, index) {
                              final friendRequest = friendRequests[index];
                              return ListTile(
                                title: Text(friendRequest),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: Icon(Icons.check),
                                      onPressed: () => acceptFriendRequest(friendRequest),
                                    ),
                                    IconButton(
                                      icon: Icon(Icons.close),
                                      onPressed: () => rejectFriendRequest(friendRequest),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
            icon: Icon(Icons.notifications),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const SizedBox(height: 20),
            
            TextFormField(
              controller: friendEmailController,
              decoration: const InputDecoration(
                icon: Icon(Icons.email),
                labelText: 'Friend Email',
                border: OutlineInputBorder(),
              ),
            ),
            
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: () => sendFriendRequest(),
                  child: const Text('Send Friend Request'),
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: deleteFriend,
                  child: const Text('Delete Friend'),
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Friends List:',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Column(
              children: friendsList.map((friend) => Text(friend)).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
