const express = require('express'); // Importing the Express framework
const path = require('path'); // Importing the path module to handle file paths
const axios = require('axios'); // Importing Axios to make HTTP requests
const app = express(); // Initializing the Express application
const cors = require('cors'); // Initializing the Cross Origin Resource Sharing(cors) application
const rateLimit = require('express-rate-limit'); // Importing rate limiting middleware
const Joi = require('joi'); // Importing Joi for input validation
const port = process.env.PORT || 3000; // Setting the port number for the server (default to 3000)

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to parse incoming URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Middleware to allow specific routes
const corsOptions = {
    origin: process.env.TRUSTED_DOMAIN || 'http://localhost:3000', // Use environment variable
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware for rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
});
app.use(limiter);

// Your Arkesel API key for sending SMS (stored as an environment variable)
const ARKESEL_API_KEY = process.env.ARKESEL_API_KEY;

// Admin credentials (should be stored securely in environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change this!

if (!ARKESEL_API_KEY) {
    console.error('Missing ARKESEL_API_KEY environment variable');
    process.exit(1); // Exit the application if API key is missing
}

// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Phone number data for classes (in production, this should be in a database)
const classPhoneNumbers = {
    "Btech computer science class": [
        "+233123456789",
        "+233234567890",
        "+233345678901"
    ],
    "HND computer science class": [
        "+233456789012",
        "+233567890123",
        "+233678901234"
    ]
};

// Authentication validation schema
const authSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
});

// SMS validation schema for incoming requests
const smsSchema = Joi.object({
    classSelect: Joi.string().valid(...Object.keys(classPhoneNumbers)).required(),
    message: Joi.string().min(1).max(160).required(),
});

// Route to serve the main index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication endpoint
app.post('/auth/login', async (req, res) => {
    const { error, value } = authSchema.validate(req.body);
    
    if (error) {
        return res.status(400).json({ error: 'Invalid input', details: error.details[0].message });
    }
    
    const { username, password } = value;
    
    // Simple authentication (in production, use proper password hashing)
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // In production, use JWT tokens or proper session management
        res.status(200).json({ 
            success: true, 
            message: 'Authentication successful',
            sessionId: Date.now().toString() // Simple session ID for demo
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get available classes endpoint
app.get('/api/classes', (req, res) => {
    res.json({
        classes: Object.keys(classPhoneNumbers)
    });
});
// POST route to handle sending SMS
app.post('/send-sms', async (req, res) => {
    const { error, value } = smsSchema.validate(req.body); // Validate request body

    if (error) {
        return res.status(400).json({ error: error.details[0].message }); // Respond with validation error
    }

    const { classSelect, message } = value; // Extract validated data
    const phoneNumbers = classPhoneNumbers[classSelect]; // Get phone numbers for selected class

    if (!phoneNumbers || phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'No phone numbers found for selected class' });
    }

    try {
        // Sending SMS to all phone numbers in the selected class using Promise.all
        const responses = await Promise.all(
            phoneNumbers.map(phoneNumber => 
                axios.post('https://sms.arkesel.com/api/v2/sms/send', {
                    sender: 'ATUCSG2', // Your sender ID (replace as necessary)
                    message,
                    recipients: [phoneNumber]
                }, {
                    headers: {
                        'api-key': ARKESEL_API_KEY // Setting the API key in the request headers
                    }
                })
            )
        );

        // Check if all SMS were sent successfully
        const allSuccessful = responses.every(response => response.data.status === 'success');

        if (allSuccessful) {
            // If all SMS were sent successfully, send a success response
            res.status(200).json({ 
                message: `SMS sent successfully to all ${phoneNumbers.length} recipients in ${classSelect}`,
                recipientCount: phoneNumbers.length
            });
        } else {
            // If some SMS failed, send an error response with details
            res.status(500).json({ error: 'Failed to send SMS to some recipients', details: responses });
        }
    } catch (error) {
        // Handle any errors that occurred during the SMS sending process
        res.status(500).json({ error: 'An error occurred while sending the SMS', details: error.message });
    }
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
