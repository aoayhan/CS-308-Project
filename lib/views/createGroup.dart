import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'viewGroups.dart';
import 'dart:convert';

class CreateGroupPage extends StatefulWidget {
  const CreateGroupPage({super.key});

  @override
  _CreateGroupPageState createState() => _CreateGroupPageState();
}

class _CreateGroupPageState extends State<CreateGroupPage> {
  final _formKey = GlobalKey<FormState>();
  String groupName = '';
  String friendEmail = '';
  late Future<FirebaseApp> _initialization;

  @override
  void initState() {
    super.initState();
    _initialization = Firebase.initializeApp();
  }


  Future<void> createGroup(String userEmail, String groupName) async {
  var url = Uri.parse('http://localhost:3000/api/create-friend-group');

  var response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'userEmail': userEmail,
      'groupName': groupName,
    }),
  );

  print('Response status: ${response.statusCode}');
  print('Response body: ${response.body}');

  if (response.statusCode == 201) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Group created successfully')));
  } else {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create group: ${response.body}')));
  }
}

Future<void> addFriendToGroup(String userEmail, String groupName, String friendEmail) async {
    var url = Uri.parse('http://localhost:3000/api/add-friends-to-group');
    var response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'userEmail': userEmail,
        'groupName': groupName,
        'friendEmails': [friendEmail], // Pass friendEmail as an array
      }),
    );

    // Handle response...
  }

  Future<void> removeFriendFromGroup(String userEmail, String groupName, String friendEmail) async {
  var url = Uri.parse('http://localhost:3000/api/remove-friends-from-group');
  var response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'userEmail': userEmail,
      'groupName': groupName,
      'memberEmails': [friendEmail], // Pass friendEmail as an array
    }),
  );

  // Handle response...
  if (response.statusCode == 200) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Friend removed successfully')));
  } else {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to remove friend: ${response.body}')));
  }
}

 @override
Widget build(BuildContext context) {
  return FutureBuilder(
    future: _initialization,
    builder: (context, snapshot) {
      // Check if the future is complete
      if (snapshot.connectionState == ConnectionState.done) {
        return buildCreateGroupForm();
      }

      // If the future is still running, show a loading indicator
      if (snapshot.hasError) {
        return const Center(child: Text('Error initializing Firebase'));
      }

      return const Center(child: CircularProgressIndicator());
    },
  );
}

Widget buildCreateGroupForm() {
  User? user = FirebaseAuth.instance.currentUser;
  String userEmail = user?.email ?? '';
  final addGroupFormKey = GlobalKey<FormState>();  // Separate form key for group creation
  final addFriendFormKey = GlobalKey<FormState>(); // Separate form key for adding/removing friend
  String addFriendGroupName = '';  // Variable for group name in add/remove friend form

  return Scaffold(
    //backgroundColor: const Color.fromARGB(255, 70, 68, 68),
    appBar: AppBar(
      title: const Text('Group Operations'),
      actions: <Widget>[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0), // Adjust padding as needed
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(context,
                    MaterialPageRoute(builder: (context) => const UserGroupsPage()));
              },
              style: ElevatedButton.styleFrom(
                foregroundColor: Colors.white, backgroundColor: Colors.green, // Text color
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'View Your Songs',
                style: TextStyle(fontSize: 14), // Adjust font size as needed
              ),
            ),
          ),
        ],
    ),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          // Section for Creating Group
          const Text(
            'Create Group',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          Form(
            key: addGroupFormKey,
            child: Column(
              children: [
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Group Name'),
                  onSaved: (value) {
                    groupName = value!;
                  },
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Please enter a group name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    if (addGroupFormKey.currentState!.validate()) {
                      addGroupFormKey.currentState!.save();
                      createGroup(userEmail, groupName);
                    }
                  },
                  child: const Text('Create Group'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),

          // Section for Adding/Removing Friend
          const Text(
            'Manage Group Members',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          Form(
            key: addFriendFormKey,
            child: Column(
              children: [
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Group Name'),
                  onSaved: (value) {
                    addFriendGroupName = value!;
                  },
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Please enter the group name';
                    }
                    return null;
                  },
                ),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Friend Email'),
                  onSaved: (value) {
                    friendEmail = value!;
                  },
                  validator: (value) {
                    if (value!.isEmpty || !value.contains('@')) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          if (addFriendFormKey.currentState!.validate()) {
                            addFriendFormKey.currentState!.save();
                            addFriendToGroup(userEmail, addFriendGroupName, friendEmail);
                          }
                        },
                        child: const Text('Add Friend'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          if (addFriendFormKey.currentState!.validate()) {
                            addFriendFormKey.currentState!.save();
                            removeFriendFromGroup(userEmail, addFriendGroupName, friendEmail);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red, // Button color for remove
                        ),
                        child: const Text('Remove Friend'),
                      ),
                    ),
                    
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}


}

