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

4) Spotify API Setup:
  Create a Spotify Developer account and register your application to get your Client ID and Client Secret.
  Update the server.js file with your Spotify credentials.

5) Download Multer:
  Download Multer for file upload capabilities, use:

     npm install multer
  
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
