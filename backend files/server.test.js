const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    runtransaction: jest.fn(),
    get: jest.fn()
  };

  
  // Mock Firebase Admin
  jest.mock('firebase-admin', () => ({
    firestore: jest.fn(() => mockFirestore),
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn()
    }
  }));
  jest.mock('node-fetch', () => jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({ access_token: 'mock-token', expires_in: 3600 })
  })));
  const request = require('supertest');
  const {app, intervalId }= require('/Users/berkebariscan/Desktop/backend308server/server.js'); // Adjust the path to your server file

 /* describe('/api/accept-friend-request', () => {
    const userEmail = 'user@example.com';
    const friendEmail = 'friend@example.com';
    const mockUserRef = { update: jest.fn() };
    const mockFriendRef = { update: jest.fn() };

    beforeEach(() => {
      mockFirestore.collection.mockClear();
      mockFirestore.doc.mockClear();
      mockFirestore.get.mockClear();
      mockFirestore.runTransaction.mockClear();
      
        mockFirestore.collection.mockReturnValue({
            doc: jest.fn().mockImplementation(email => {
                if (email === userEmail) {
                    return mockUserRef;
                } else if (email === friendEmail) {
                    return mockFriendRef;
                }
            }),
        });
        mockFirestore.runTransaction.mockImplementation(async (transactionFunction) => {
          const transactionMock = {
              get: jest.fn().mockResolvedValue({ exists: true }),
              update: jest.fn(),
              // ... other transaction methods you need to mock
          };
          await transactionFunction(transactionMock);
      });
    });

    test('should accept a friend request successfully', async () => {
        const response = await request(app).post('/api/accept-friend-request').send({ userEmail, friendEmail });
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Friend request accepted');
        // Here you can add more assertions to verify the transaction updates if needed
    });

    test('should handle the case where one or both users are not found', async () => {
        mockFirestore.runTransaction.mockImplementationOnce(async (transactionFunction) => {
            const transactionMock = {
                get: jest.fn().mockResolvedValueOnce({ exists: false }), // Simulate a user not found
                update: jest.fn(),
                // ... other transaction methods
            };
  
          const response = await request(app).post('/api/accept-friend-request').send({ userEmail, friendEmail });
          expect(response.statusCode).toBe(500);
          expect(response.text).toBe('One or both users not found');
      });
    });
    test('should handle transaction errors', async () => {
      mockFirestore.runTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

        const response = await request(app).post('/api/accept-friend-request').send({ userEmail, friendEmail });
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe('Transaction failed');
    });

    // You can add more tests for other edge cases if necessary
}); */

  describe('/api/view-friend-requests', () => {
    // Mock the Firestore data
    const mockUserDoc = {
        exists: true,
        data: () => ({
            pendingRequests: ['request1@example.com', 'request2@example.com']
        })
    };

    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        jest.clearAllMocks();
    });

    test('should return 200 and pending requests for an existing user', async () => {
        // Setup the mock Firestore user document
        mockFirestore.collection().doc().get.mockResolvedValue(mockUserDoc);

        const response = await request(app).get('/api/view-friend-requests').query({ userEmail: 'existinguser@example.com' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ pendingRequests: ['request1@example.com', 'request2@example.com'] });
    });

    test('should return 200 and empty array if no pending requests', async () => {
        // Setup the mock Firestore user document with no pending requests
        const mockUserDocNoRequests = {
            ...mockUserDoc,
            data: () => ({})
        };
        mockFirestore.collection().doc().get.mockResolvedValue(mockUserDocNoRequests);
        const response = await request(app).get('/api/view-friend-requests').query({ userEmail: 'norequests@example.com' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ pendingRequests: [] });
    });

    test('should return 404 if user not found', async () => {
        // Setup the mock Firestore user document to simulate non-existing user
        mockFirestore.collection().doc().get.mockResolvedValue({ exists: false });
        const response = await request(app).get('/api/view-friend-requests').query({ userEmail: 'nonexistinguser@example.com' });
        expect(response.statusCode).toBe(404);
    });

    test('should return 500 if an error occurs', async () => {
        // Setup the mock Firestore user document to throw an error
        mockFirestore.collection().doc().get.mockRejectedValue(new Error('Internal Server Error'));
      
        const response = await request(app).get('/api/view-friend-requests').query({ userEmail: 'error@example.com' });
        expect(response.statusCode).toBe(500);
    });

    // Add more tests if necessary
  });


  describe('/api/clear-group-top-songs', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock Firestore 'collection', 'doc', 'get', and 'update' methods
        mockFirestore.collection = jest.fn().mockReturnThis();
        mockFirestore.doc = jest.fn().mockReturnThis();
        mockFirestore.get = jest.fn();
        mockFirestore.update = jest.fn(() => Promise.resolve());
    });

    /*test('should return 200 and clear group top songs successfully', async () => {
        // Setup mock Firestore response for existing group
        const mockGroupDoc = {
            exists: true
        };
        mockFirestore.get.mockResolvedValue(mockGroupDoc);

        const response = await request(app).post('/api/clear-group-top-songs').send({
            groupName: 'TestGroup'
        });

        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Top rated songs, playlist link and recommended playlist link have been cleared from the group.');
        expect(mockFirestore.update).toHaveBeenCalledWith({ 
            topSongs: [],
            playlistLink: admin.firestore.FieldValue.delete(),
            recommendedPlaylistLink: admin.firestore.FieldValue.delete()
        });
    }); */

    test('should return 400 for missing groupName', async () => {
        const response = await request(app).post('/api/clear-group-top-songs').send({});
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('Missing required field: groupName');
    });

    test('should return 404 if friend group not found', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false }); // Group doesn't exist

        const response = await request(app).post('/api/clear-group-top-songs').send({
            groupName: 'NonexistentGroup'
        });
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Friend group not found');
    });

    // Add more tests as needed, such as error handling
});


  describe('/api/analyze-group-favorites', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock Firestore 'collection', 'doc', 'get', and 'update' methods
        mockFirestore.collection = jest.fn().mockReturnThis();
        mockFirestore.doc = jest.fn().mockReturnThis();
        mockFirestore.get = jest.fn();
        mockFirestore.update = jest.fn(() => Promise.resolve());
    });

    test('should return 200 and update group favorites successfully', async () => {
        // Setup mock Firestore responses
        const mockGroupDoc = {
            exists: true,
            data: () => ({ members: ['user1@example.com', 'user2@example.com'] })
        };
        const mockUserDoc = {
            exists: true,
            data: () => ({ ratings: [{ songName: 'Song1', rating: 5 }, { songName: 'Song2', rating: 4 }] })
        };
        mockFirestore.get
            .mockResolvedValueOnce(mockGroupDoc) // Group exists
            .mockResolvedValueOnce(mockUserDoc) // First user exists
            .mockResolvedValueOnce(mockUserDoc); // Second user exists

        const response = await request(app).post('/api/analyze-group-favorites').send({
            groupName: 'TestGroup'
        });

        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Group favorites analyzed and top songs added successfully');
        expect(mockFirestore.update).toHaveBeenCalled();
    });

    test('should return 400 for missing groupName', async () => {
        const response = await request(app).post('/api/analyze-group-favorites').send({});
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('Missing required field: groupName');
    });

    test('should return 404 if friend group not found', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false }); // Group doesn't exist

        const response = await request(app).post('/api/analyze-group-favorites').send({
            groupName: 'NonexistentGroup'
        });
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Friend group not found');
    });

    // Add more tests as needed, such as error handling or cases with no top songs
});


  describe('/api/create-friend-group', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock Firestore 'collection', 'doc', 'get', and 'set' methods
        mockFirestore.collection = jest.fn().mockReturnThis();
        mockFirestore.doc = jest.fn().mockReturnThis();
        mockFirestore.get = jest.fn();
        mockFirestore.set = jest.fn(() => Promise.resolve());
    });

    /*test('should return 201 and create friend group successfully', async () => {
        // Setup mock Firestore responses
        // User exists
        mockFirestore.get.mockResolvedValueOnce({ exists: true });
        // Group doesn't exist
        mockFirestore.get.mockResolvedValueOnce({ exists: false });
    
        const response = await request(app).post('/api/create-friend-group').send({
            userEmail: 'user@example.com',
            groupName: 'TestGroup'
        });
    
        expect(response.statusCode).toBe(201);
        expect(response.text).toBe(`Friend group 'TestGroup' created successfully`);
        expect(mockFirestore.set).toHaveBeenCalled();
    }); */

    test('should return 400 for missing required fields', async () => {
        const response = await request(app).post('/api/create-friend-group').send({
            userEmail: 'user@example.com'
        });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('Missing required fields: userEmail and groupName');
    });

    test('should return 404 if user not found', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false }); // User doesn't exist

        const response = await request(app).post('/api/create-friend-group').send({
            userEmail: 'nonexistent@example.com',
            groupName: 'TestGroup'
        });
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('User not found');
    });

    test('should return 409 if friend group already exists', async () => {
        mockFirestore.get
            .mockResolvedValueOnce({ exists: true }) // User exists
            .mockResolvedValueOnce({ exists: true }); // Group exists

        const response = await request(app).post('/api/create-friend-group').send({
            userEmail: 'user@example.com',
            groupName: 'ExistingGroup'
        });
        expect(response.statusCode).toBe(409);
        expect(response.text).toBe(`A friend group with the name 'ExistingGroup' already exists.`);
    });

    // Add more tests as needed, such as error handling
});


  describe('/api/top-songs-from-era', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock Firestore 'collection', 'where', 'orderBy', 'limit', and 'get' methods
        mockFirestore.collection = jest.fn().mockReturnThis();
        mockFirestore.where = jest.fn().mockReturnThis();
        mockFirestore.orderBy = jest.fn().mockReturnThis();
        mockFirestore.limit = jest.fn().mockReturnThis();
        mockFirestore.get = jest.fn();
    });

    test('should return 200 and a list of top songs from era', async () => {
        // Setup mock Firestore response for songs in the era
        const mockQuerySnapshot = {
            empty: false,
            forEach: jest.fn((callback) => {
                callback({ data: () => ({ songName: 'Song1', year: 2000, rating: 5 }) });
                callback({ data: () => ({ songName: 'Song2', year: 2001, rating: 4 }) });
            })
        };
        mockFirestore.get.mockResolvedValue(mockQuerySnapshot);

        const response = await request(app).get('/api/top-songs-from-era')
                                            .query({ userId: 'User1', startYear: '2000', endYear: '2010', limit: '5' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([{ songName: 'Song1', year: 2000, rating: 5 }, { songName: 'Song2', year: 2001, rating: 4 }]);
    });

    test('should return 400 for missing required fields', async () => {
        const response = await request(app).get('/api/top-songs-from-era')
                                            .query({ userId: 'User1', startYear: '2000', endYear: '2010' });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('All parameters are required');
    });

    test('should return 200 and an empty list if no songs match criteria', async () => {
        // Setup mock Firestore response for empty result
        mockFirestore.get.mockResolvedValue({ empty: true, forEach: jest.fn() });

        const response = await request(app).get('/api/top-songs-from-era')
                                            .query({ userId: 'User1', startYear: '1990', endYear: '1995', limit: '5' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
    });

    // Add more tests as needed, such as error handling
});


  describe('/api/update-rating', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock Firestore 'collection', 'where', 'get', and 'update' methods
        mockFirestore.collection = jest.fn().mockReturnThis();
        mockFirestore.where = jest.fn().mockReturnThis();
        mockFirestore.get = jest.fn();
        mockFirestore.update = jest.fn(() => Promise.resolve());
    });

    test('should return 200 and update rating successfully', async () => {
        // Setup mock Firestore response for existing song
        const mockQuerySnapshot = {
            empty: false,
            docs: [{ ref: { update: jest.fn(() => Promise.resolve()) } }]
        };
        mockFirestore.get.mockResolvedValue(mockQuerySnapshot);

        const response = await request(app).post('/api/update-rating').send({
            songName: 'Song1',
            userId: 'User1',
            artistName: 'Artist1',
            newRating: 4
        });
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Rating updated successfully');
    });

    test('should return 400 for missing required fields', async () => {
        const response = await request(app).post('/api/update-rating').send({
            userId: 'User1',
            newRating: 4
        });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('Song name, user ID, artist name, and new rating are required');
    });

    test('should return 404 if song not found', async () => {
        // Setup mock Firestore response for non-existent song
        mockFirestore.get.mockResolvedValue({ empty: true });

        const response = await request(app).post('/api/update-rating').send({
            songName: 'NonexistentSong',
            userId: 'User1',
            artistName: 'Artist1',
            newRating: 4
        });
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Song not found');
    });

    // Add more tests as needed, such as error handling
});


  describe('/api/rate-song', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock Firestore 'doc', 'get', 'update', and 'add' methods
        mockFirestore.doc = jest.fn().mockReturnThis();
        mockFirestore.get = jest.fn();
        mockFirestore.update = jest.fn(() => Promise.resolve());
        mockFirestore.collection = jest.fn().mockReturnThis();
        mockFirestore.add = jest.fn(() => Promise.resolve());
    });

    /*test('should return 200 and update rating successfully', async () => {
        // Setup mock Firestore response for existing song
        const mockSongDoc = {
            exists: true,
            data: () => ({ rating: 3 })
        };
        mockFirestore.get.mockResolvedValue(mockSongDoc);

        const response = await request(app).post('/api/rate-song').send({
            songId: 'song1',
            userId: 'user1',
            newRating: 5
        });
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Rating updated successfully');
        expect(mockFirestore.update).toHaveBeenCalled(); // Check if update was called
    }); */

    test('should return 400 for invalid input', async () => {
        const response = await request(app).post('/api/rate-song').send({
            songId: 'song1',
            userId: 'user1',
            newRating: 'invalid'
        });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('Invalid input');
    });

    test('should return 404 if song not found', async () => {
        // Setup mock Firestore response for non-existent song
        mockFirestore.get.mockResolvedValue({ exists: false });

        const response = await request(app).post('/api/rate-song').send({
            songId: 'nonexistentSong',
            userId: 'user1',
            newRating: 4
        });
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Song not found');
    });

    // Add more tests as needed, such as testing the addition of rating history
});

  describe('/api/get-user-friends', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock Firestore 'doc' and 'get' methods
        mockFirestore.doc = jest.fn().mockReturnThis();
        mockFirestore.get = jest.fn();
    });

    test('should return 200 and a list of friends for a valid user', async () => {
        // Setup mock Firestore response
        const mockUserDoc = {
            exists: true,
            data: () => ({ friends: ['friend1@example.com', 'friend2@example.com'] })
        };
        mockFirestore.get.mockResolvedValue(mockUserDoc);

        const response = await request(app).get('/api/get-user-friends?userEmail=user@example.com');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ friends: ['friend1@example.com', 'friend2@example.com'] });
    });

    test('should return 400 if userEmail is missing', async () => {
        const response = await request(app).get('/api/get-user-friends');
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('User email is required');
    });

    test('should return 404 if user not found', async () => {
        // Setup mock Firestore response for non-existent user
        mockFirestore.get.mockResolvedValue({ exists: false });

        const response = await request(app).get('/api/get-user-friends?userEmail=nonexistent@example.com');
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('User not found');
    });

    // Add more tests as needed
});

  describe('/api/addFriend', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    
        mockFirestore.doc = jest.fn().mockImplementation(path => {
            if (path === 'users/user@example.com') {
                return {
                    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ friends: [] }) })),
                    // Add other necessary methods like update if needed
                };
            }
            if (path === 'users/friend@example.com') {
                return {
                    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ friends: [] }) })),
                    // Add other necessary methods like update if needed
                };
            }
            // Handle other paths if necessary
            return {
                get: jest.fn(() => Promise.resolve({ exists: false })),
                // Add other necessary methods
            };
        });
    
        mockFirestore.batch = jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            commit: jest.fn()
        }));
        // Add other necessary mocks
    });

    /*test('should return 200 and add friend successfully', async () => {
        // Mock Firestore document references and methods
        const mockUserDoc = {
            exists: true,
            data: () => ({ friends: ['friend@example.com'] })
        };
        const mockFriendDoc = {
            exists: true,
            data: () => ({ friends: ['user@example.com'] })
        };
        mockFirestore.doc.mockImplementation(path => {
            if (path === 'users/user@example.com') return { get: () => Promise.resolve(mockUserDoc) };
            if (path === 'users/friend@example.com') return { get: () => Promise.resolve(mockFriendDoc) };
        });
        const mockBatch = {
            update: jest.fn().mockReturnThis(),
            commit: jest.fn()
        };
        mockFirestore.batch.mockReturnValue(mockBatch);

        const response = await request(app).post('/api/addFriend').send({
            userEmail: 'user@example.com',
            friendEmail: 'friend@example.com'
        });
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Friend added successfully');
        expect(mockBatch.update).toHaveBeenCalledTimes(2);
        expect(mockBatch.commit).toHaveBeenCalled();
    }); */

    test('should return 400 if userEmail or friendEmail is missing', async () => {
        const response = await request(app).post('/api/addFriend').send({
            userEmail: 'user@example.com'
        });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('Missing userEmail or friendEmail');
    });

    test('should return 404 if one or both users not found', async () => {
        mockFirestore.doc.mockImplementation(() => ({
            get: () => Promise.resolve({ exists: false })
        }));

        const response = await request(app).post('/api/addFriend').send({
            userEmail: 'nonexistent@example.com',
            friendEmail: 'friend@example.com'
        });
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('One or both users not found');
    });

    /* test('should return 409 if users are already friends', async () => {
        const mockUserDoc = {
            exists: true,
            data: () => ({ friends: ['friend@example.com'] })
        };
        const mockFriendDoc = {
            exists: true,
            data: () => ({ friends: ['user@example.com'] })
        };
        mockFirestore.doc.mockImplementation(path => {
            if (path === 'users/user@example.com') return { get: () => Promise.resolve(mockUserDoc) };
            if (path === 'users/friend@example.com') return { get: () => Promise.resolve(mockFriendDoc) };
        });

        const response = await request(app).post('/api/addFriend').send({
            userEmail: 'user@example.com',
            friendEmail: 'friend@example.com'
        });
        expect(response.statusCode).toBe(409);
        expect(response.text).toBe('Users are already friends');
    }); */

    // Add more tests as needed
});

  describe('/spotify-search', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    test('should return 200 and a list of simplified tracks for a valid query', async () => {
        // Setup mock fetch response for Spotify API
        const mockTracks = {
            tracks: {
                items: [
                    {
                        name: 'Song 1',
                        artists: [{ name: 'Artist 1' }],
                        album: { name: 'Album 1', release_date: '2020-01-01' }
                    },
                    {
                        name: 'Song 2',
                        artists: [{ name: 'Artist 2' }],
                        album: { name: 'Album 2', release_date: '2021-01-01' }
                    }
                ]
            }
        };
        const mockFetch = require('node-fetch');
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve(mockTracks)
        });

        const response = await request(app).get('/spotify-search?q=song');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([
            { songName: 'Song 1', artistName: 'Artist 1', albumName: 'Album 1', year: '2020' },
            { songName: 'Song 2', artistName: 'Artist 2', albumName: 'Album 2', year: '2021' }
        ]);
    });

    test('should return empty list if no tracks found', async () => {
        // Setup mock fetch response for empty Spotify result
        const mockFetch = require('node-fetch');
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({ tracks: { items: [] } })
        });

        const response = await request(app).get('/spotify-search?q=nonexistent');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
    });

    // Add more tests as needed
});

  describe('/api/view-songs', () => {
      beforeEach(() => {
          // Reset mocks before each test
          mockFirestore.collection.mockClear();
          mockFirestore.where.mockClear();
          mockFirestore.get.mockClear();
      });
  
      test('should return 200 and songs list for a valid user', async () => {
          // Setup mock Firestore response
          const mockSongs = [{ title: 'Song 1' }, { title: 'Song 2' }];
          mockFirestore.get.mockResolvedValue({
              empty: false,
              docs: mockSongs.map(song => ({ data: () => song }))
          });
  
          const response = await request(app).post('/api/view-songs').send({ userId: 'valid-user-id' });
          expect(response.statusCode).toBe(200);
          expect(response.body).toEqual(mockSongs);
      });
  
      test('should return 404 if no songs found', async () => {
          // Setup mock Firestore response for no songs
          mockFirestore.get.mockResolvedValue({
              empty: true,
              docs: []
          });
  
          const response = await request(app).post('/api/view-songs').send({ userId: 'nonexistent-user-id' });
          expect(response.statusCode).toBe(404);
      });
      test('should return 500 if there is a server error', async () => {
        // Setup mock Firestore to throw an error
        mockFirestore.get.mockRejectedValue(new Error('Server Error'));
    
        const response = await request(app).post('/api/view-songs').send({ userId: 'user-with-error' });
        expect(response.statusCode).toBe(500);
    });
  
      // Add more tests as needed
});

  
  afterAll(() => {
    clearInterval(intervalId);
  });