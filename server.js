const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const app = express();
const port = 3000;

// Twilio credentials (replace with your own)
const accountSid = 'AC5680494c830dab26e978951e75fa8d22';
const authToken = 'bc34795541a8dded98f93d81fccf8e66';
const client = new twilio(accountSid, authToken);



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/send-sms', (req, res) => {
    const { classSelect, message } = req.body;

    // Define the classes and their associated phone numbers
    const classes = {
        'Btech computer science class': ['+233245645343', '+233203889973'],
        'HND computer science class': ['+1122334455', '+5566778899']
    };

    const phoneNumbers = classes[classSelect];

    if (phoneNumbers && message) {
        phoneNumbers.forEach(number => {
            client.messages.create({
                body: message,
                from: '+14242066389', // Replace with your Twilio number
                to: number
            }).then((message) => console.log(message.sid));
        });

        res.json({ message: 'SMS sent successfully!' });
    } else {
        res.status(400).json({ message: 'Invalid class selection or message' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
