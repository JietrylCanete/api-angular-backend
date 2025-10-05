// server.js
require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');

// Basic middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Cors configuration
app.use(cors({
    origin: [
      'http://localhost:4200', 
      'http://localhost:3000', 
      'https://api-angular-backend.onrender.com',
      'https://api-angular-frontend.vercel.app'
    ],
    credentials: true
}));

// API routes
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/employees', require('./employees/employee.controller'));
app.use('/departments', require('./departments'));
app.use('/requests', require('./requests'));
app.use('/employee-workflows', require('./employees/employee-workflow.controller'));

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Global error handler
app.use(errorHandler);

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});