// script.js

// Dummy admin credentials (you should replace this with a secure method)
const adminCredentials = {
    username: 'admin', // Username for admin login
    password: 'password123' // Password for admin login
};

// Data containing phone numbers for each class
const classData = {
    "BTECH_COMPUTER_SCIENCE_CLASS": [ // Phone numbers for BTECH Computer Science class
       

    ],
    "HND_COMPUTER_SCIENCE_CLASS": [ // Phone number for HND Computer Science class
       
    ]
};

// Event listener for the login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission

    const username = document.getElementById('username').value; // Get the entered username
    const password = document.getElementById('password').value; // Get the entered password

    // Check if entered credentials match the dummy admin credentials
    if (username === adminCredentials.username && password === adminCredentials.password) {
        // If credentials are correct, hide the login container and show the admin container
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-container').style.display = 'block';
    } else {
        // If credentials are incorrect, show an alert
        alert('Invalid credentials');
    }
});

// Event listener for the SMS form submission
document.getElementById('smsForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission

    const classType = document.getElementById('classSelect').value; // Get selected class type from the dropdown
    const message = document.getElementById('message').value; // Get the message input

    // Show confirmation dialog before sending the SMS
    showConfirmationDialog(classType, message);
});

// Function to show the confirmation dialog before sending the SMS
function showConfirmationDialog(classType, message) {
    const dialog = document.createElement('div'); // Create a new div for the confirmation dialog
    dialog.className = 'confirmation-dialog'; // Set the class name for styling
    dialog.innerHTML = `
        <h2>Confirm Send SMS</h2>
        <p>Are you sure you want to send the following message to the selected class?</p>
        <p><strong>Class:</strong> ${classType}</p>
        <p><strong>Message:</strong> ${message}</p>
        <div class="buttons">
            <button class="confirm">Yes, Send</button>
            <button class="cancel">Cancel</button>
        </div>
    `;

    document.body.appendChild(dialog); // Append the dialog to the body

    // Event listener for the "Yes, Send" button
    dialog.querySelector('.confirm').addEventListener('click', function() {
        const formattedClassType = classType.replace(/\s+/g, '_').toUpperCase(); // Format class type by replacing spaces with underscores and converting to uppercase
        const classSelect = classData[formattedClassType]; // Retrieve phone numbers based on the formatted class type

        console.log('Class Select:', classSelect); // Log to check the selected class numbers
        console.log('Message:', message); // Log to check the message content

        if (classSelect && message) {
            // If class selection and message are valid, send the SMS
            sendSMS(classSelect, message);
        } else {
            // If either is missing, show an alert
            alert('Class selection or message is missing');
        }
        document.body.removeChild(dialog); // Remove the dialog after sending or canceling
    });

    // Event listener for the "Cancel" button
    dialog.querySelector('.cancel').addEventListener('click', function() {
        document.body.removeChild(dialog); // Remove the dialog if canceled
    });

    dialog.style.display = 'block'; // Display the confirmation dialog
}

// Function to send the SMS by making a POST request to the server
function sendSMS(classSelect, message) {
    fetch('/send-sms', {
        method: 'POST', // HTTP method to send data
        headers: {
            'Content-Type': 'application/json', // Setting content type to JSON
        },
        body: JSON.stringify({ classSelect, message }), // Send the selected class and message as JSON
    })
    .then(response => response.json()) // Parse the response as JSON
    .then(data => {
        document.getElementById('response').innerText = data.message; // Display the server response message
        console.log('Response from server:', data); // Log the response from the server
    })
    .catch((error) => {
        console.error('Error:', error); 
    });
}
