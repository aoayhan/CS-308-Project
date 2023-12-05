const admin = require('firebase-admin');
const serviceAccount = require('./cs308fire-firebase-adminsdk-3258q-016c92bbad.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();
const auth = admin.auth();

async function migrateUsers() {
  try {
    // List all users
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;

    for (const user of users) {
      // Add user to Firestore
      const userEmail = user.email || '';
      const userDocRef = firestore.collection('users').doc(userEmail);

      await userDocRef.set({
        email: userEmail
        // Add other user properties here
      });
    }

    console.log('All users have been migrated to Firestore');
  } catch (error) {
    console.error('Error migrating users:', error);
  }
}

migrateUsers();
