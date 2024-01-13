import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// Model for FriendGroup
class FriendGroup {
  final String name;
  final List<String> members;

  FriendGroup({required this.name, required this.members});

  factory FriendGroup.fromJson(Map<String, dynamic> json) {
    return FriendGroup(
      name: json['name'],
      members: List<String>.from(json['members']),
    );
  }
}

// Service for fetching group data
class GroupService {
  Future<List<FriendGroup>> fetchUserGroups() async {
  User? user = FirebaseAuth.instance.currentUser;
  String userEmail = user?.email ?? '';
  print("User email: $userEmail");

  if (userEmail.isEmpty) {
    throw Exception('User email is not available');
  }

  var url = Uri.http('localhost:3000', '/api/user-friend-groups', {'userEmail': userEmail});
  var response = await http.get(url);

  // Print the full response
  print('Response status: ${response.statusCode}');
  print('Response body: ${response.body}');

  if (response.statusCode == 200) {
    List<dynamic> groupsJson = json.decode(response.body);
    return groupsJson.map((json) => FriendGroup.fromJson(json)).toList();
  } else {
    throw Exception('Failed to load groups: ${response.body}');
  }
}

}

// UserGroupsPage Widget
class UserGroupsPage extends StatefulWidget {
  @override
  _UserGroupsPageState createState() => _UserGroupsPageState();
}

class _UserGroupsPageState extends State<UserGroupsPage> {
  late Future<List<FriendGroup>> futureGroups;

  @override
  void initState() {
    super.initState();
    futureGroups = GroupService().fetchUserGroups();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Groups'),
      ),
      body: FutureBuilder<List<FriendGroup>>(
        future: futureGroups,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            } else if (snapshot.hasData) {
              return ListView.builder(
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    title: Text(snapshot.data![index].name),
                    subtitle: Text('Members: ${snapshot.data![index].members.join(', ')}'),
                  );
                },
              );
            }
          }
          return Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}


