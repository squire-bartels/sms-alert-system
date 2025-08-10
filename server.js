const express = require('express'); // Importing the Express framework
const path = require('path'); // Importing the path module to handle file paths
const axios = require('axios'); // Importing Axios to make HTTP requests
const bodyParser = require('body-parser'); // Importing body-parser to handle incoming request bodies
const app = express(); // Initializing the Express application
const cors = require('cors'); // Initializing the Cross Origin Resource Sharing(cors) application
const rateLimit = require('express-rate-limit'); // Importing rate limiting middleware
const Joi = require('joi'); // Importing Joi for input validation
const port = process.env.PORT || 3000; // Setting the port number for the server (default to 3000)

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Middleware to parse incoming URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to allow specific routes
const corsOptions = {
    origin: 'https://your-trusted-domain.com', // Replace with your trusted domain
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

if (!ARKESEL_API_KEY) {
    console.error('Missing ARKESEL_API_KEY environment variable');
    process.exit(1); // Exit the application if API key is missing
}

// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Validation schema for incoming requests
const smsSchema = Joi.object({
    classSelect: Joi.array().items(Joi.string().min(10).max(15)).required(), // Validate phone numbers
    message: Joi.string().min(1).max(160).required(), // Validate message length
});

// POST route to handle sending SMS
app.post('/send-sms', async (req, res) => {
    const { error, value } = smsSchema.validate(req.body); // Validate request body

    if (error) {
        return res.status(400).json({ error: error.details[0].message }); // Respond with validation error
    }

    const { classSelect, message } = value; // Extract validated data

    try {
        // Sending SMS to all selected phone numbers using Promise.all
        const responses = await Promise.all(
            classSelect.map(phoneNumber => 
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
            res.status(200).json({ message: 'SMS sent successfully to all recipients' });
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
