document.getElementById('send-request-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const receiverId = document.getElementById('receiver-id').value;
    // Add logic to send request to server
});

document.getElementById('view-friends-button').addEventListener('click', async () => {
    // Add logic to fetch and display friends
});

document.getElementById('view-requests-button').addEventListener('click', async () => {
    // Add logic to fetch and display pending requests
});

document.getElementById('accept-request-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const senderId = document.getElementById('sender-id').value;
    // Add logic to accept request
});
