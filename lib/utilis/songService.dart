import 'dart:convert';
import 'package:http/http.dart' as http;

class SongService {
  Future<List<dynamic>> recommendSongs(String userEmail) async {
    var url = Uri.parse('http://localhost:3000/api/recommend-songs');
    // Add your logic to pass userEmail as a parameter or within headers, as required by your API.
    var response = await http.get(url);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      // Handle errors or return an empty list
      return [];
    }
  }
}