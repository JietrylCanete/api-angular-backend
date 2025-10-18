require('rootpath')();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errorHandler = require('_middleware/error-handler');
const db = require('_helpers/db');

const app = express();

// --- BASIC MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// --- SIMPLE CORS CONFIGURATION ---
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://api-angular-frontend-rmsj10ism-jietryls-projects.vercel.app',
    'https://api-angular-frontend.vercel.app',
    'https://api-angular-frontend-p9n3ot582-jietryls-projects.vercel.app'
  ],
  credentials: true
}));

// --- DATABASE HEALTH CHECK ---
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Node.js Backend API',
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      service: 'Node.js Backend API',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// --- ROUTES ---
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/employees', require('./employees/employee.controller'));
app.use('/departments', require('./departments/department.controller'));
app.use('/requests', require('./requests/request.controller'));
app.use('/employee-workflows', require('./employees/employee-workflow.controller'));
app.use('/positions', require('./positions/position.controller'));


// --- API ROOT ---
app.get('/', (req, res) => {
  res.json({ 
    message: 'Node.js Backend API is running!',
    version: '1.0.0',
    endpoints: {
      accounts: '/accounts',
      employees: '/employees', 
      departments: '/departments',
      requests: '/requests',
      workflows: '/employee-workflows',
      health: '/health'
    }
  });
});

// --- 404 HANDLER ---
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// --- GLOBAL ERROR HANDLER ---
app.use(errorHandler);

// --- START SERVER ---
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`📍 API Root: http://localhost:${port}/`);
  console.log('✅ All routes loaded successfully');
  
  // Database initialization will happen in the background
  console.log('🔄 Database initialization in progress...');
});