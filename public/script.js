// script.js

// Dummy admin credentials (you should replace this with a secure method)
const adminCredentials = {
    username: 'admin',
    password: 'password123'
};

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === adminCredentials.username && password === adminCredentials.password) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-container').style.display = 'block';
    } else {
        alert('Invalid credentials');
    }
});

document.getElementById('smsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const classSelect = document.getElementById('classSelect').value;
    const message = document.getElementById('message').value;

    // Show confirmation dialog
    showConfirmationDialog(classSelect, message);
});

function showConfirmationDialog(classSelect, message) {
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
        <h2>Confirm Send SMS</h2>
        <p>Are you sure you want to send the following message to the selected class?</p>
        <p><strong>Class:</strong> ${classSelect}</p>
        <p><strong>Message:</strong> ${message}</p>
        <div class="buttons">
            <button class="confirm">Yes, Send</button>
            <button class="cancel">Cancel</button>
        </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('.confirm').addEventListener('click', function() {
        sendSMS(classSelect, message);
        document.body.removeChild(dialog);
    });

    dialog.querySelector('.cancel').addEventListener('click', function() {
        document.body.removeChild(dialog);
    });

    dialog.style.display = 'block';
}

function sendSMS(classSelect, message) {
    fetch('/send-sms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classSelect, message }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').innerText = data.message;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
