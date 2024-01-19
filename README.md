## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.
# Prerequisites for backend:
Node.js

NPM (Node Package Manager)

A Firebase account and a configured Firebase project

A spotify developer account with Client ID and Client Secret

1) Use 'npm install' to install node modules.

2) Firebase Configuration:
  Set up your Firebase project and download the configuration file.
  Place the Firebase config file in the project directory.
  Use:

    npm install firebase

3) Spotify API Setup:
  Create a Spotify Developer account and register your application to get your Client ID and Client Secret.
  Update the server.js file with your Spotify credentials.

4) Download Multer:
  Download Multer for file upload capabilities, use:

     npm install multer
   
5) Download passport for spotify:
  We use passport for spotify authentication.

     npm install passport passport-spotify

6) Download express:
   
     npm install express-session
   
7) Install CORS:
   If cors is not installed on your device, use:
   
     npm install cors
   
Run 'node server.js'


# Prerequisites for mobile:

1) Install flutter
2) Install Android Studio and Visual Studio
3) Open login, sign in, homepage and addSongs.dart files
4) Run: flutter run lib/main.dart on terminal to open application for visualizations.
5) Press 'r' on terminal to see the changed code. 
6) Firebase Configuration
Configure the Firebase project and obtain the configuration file.
Position the Firebase configuration file in the project directory.
7) Spotify API Setup
Register for a Spotify Developer account and create an application to acquire the Client ID and Client Secret.
Modify the addSongs.dart file by inserting your Spotify credentials.

# API Documentation

## Add a Song

* Endpoint: POST /api/add-song
* Description: Add a song to the database along with Spotify track details.
* Request Parameters:
    * songName (string): Name of the song.
    * album (string): Name of the album.
    * artist (string): Name of the artist.
    * year (number): Release year of the song.
    * rating (number, optional): User-assigned rating for the song (default is null).
    * userId (string): ID of the user adding the song.
* Response Codes:
    * 201 Created: Song added successfully.
    * 400 Bad Request: Missing required song details or user ID.
    * 404 Not Found: Spotify track not found for the specified song.
    * 409 Conflict: Song already exists in the database.
    * 500 Internal Server Error: An error occurred while adding the song to Firestore.
* Response Body:
    * Success: "Song added successfully with Spotify track ID"
    * Failure: Error message describing the issue.
  
## Delete a Song

* Endpoint: DELETE /api/delete-song
* Description: Delete a song from the database and update user ratings.
* Request Parameters:
    * songName (string): Name of the song.
    * artist (string): Name of the artist.
    * userId (string): ID of the user deleting the song.
* Response Codes:
    * 200 OK: Song deleted successfully and user ratings updated.
    * 400 Bad Request: Song name, artist, and user ID are required.
    * 404 Not Found: Song or user not found.
    * 500 Internal Server Error: An error occurred while deleting the song.
* Response Body:
    * Success: "Song deleted successfully and ratings updated"
    * Failure: Error message describing the issue.
 
## Spotify Search

* Endpoint: GET /spotify-search
* Description: Search for songs on Spotify and retrieve simplified information.
* Query Parameters:
    * q (string): The search query for songs.
* Response Codes:
    * 200 OK: Successful Spotify search.
    * 500 Internal Server Error: An error occurred during the Spotify search.
* Response Body:
    * Success: Array of simplified tracks, each containing songName, artistName, albumName, and year.
    * Failure: Error message describing the issue.
  
## Search for Songs in Database

* Endpoint: GET /api/search-song
* Description: Search for songs in the database by name.
* Query Parameters:
    * name (string): The search query for song names.
* Response Codes:
    * 200 OK: Successful song search in the database.
    * 400 Bad Request: Song name is required.
    * 404 Not Found: No songs found with the specified name.
    * 500 Internal Server Error: An error occurred during the song search.
* Response Body:
    * Success: Array of songs matching the search query.
    * Failure: Error message describing the issue.
  
## View User Songs

* Endpoint: POST /api/view-songs
* Description: Retrieve songs associated with a specific user.
* Request Parameters:
    * userId (string): ID of the user for whom songs are to be retrieved.
* Response Codes:
    * 200 OK: Songs retrieved successfully.
    * 404 Not Found: No songs found for the specified user.
    * 500 Internal Server Error: An error occurred while fetching user songs.
* Response Body:
    * Success: Array of songs associated with the specified user.
    * Failure: Error message describing the issue.
 
      
## Recommend Friends' Songs

* Endpoint: GET /api/recommend-friends-songs
* Description: Get song recommendations based on the top-rated songs of user's friends.
* Query Parameters:
    * userEmail (string): Email of the user for whom friend song recommendations are to be generated.
* Response Codes:
    * 200 OK: Friend song recommendations generated successfully.
    * 404 Not Found: User not found or user has no friends to get recommendations from.
    * 500 Internal Server Error: An error occurred while generating friend song recommendations.
* Response Body:
    * Success: String containing structured friend song recommendations.
    * Failure: Error message describing the issue.


