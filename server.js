require('rootpath')();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errorHandler = require('_middleware/error-handler');
const db = require('_helpers/db');

const app = express();

/* -------------------- BASIC MIDDLEWARE -------------------- */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

/* -------------------- CORS CONFIG -------------------- */
// ✅ Include all possible allowed frontend URLs (local + Vercel deployments)
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4000',
  'https://api-angular-frontend.vercel.app',
  'https://api-angular-frontend-p9n3ot582-jietryls-projects.vercel.app',
  'https://api-angular-frontend-rmsj10ism-jietryls-projects.vercel.app',
  'https://api-angular-frontend-i2yfwpwnw-jietryls-projects.vercel.app', // your current deployed one
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS blocked for origin: ${origin}`;
        console.warn(msg);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

/* -------------------- HEALTH CHECK -------------------- */
app.get('/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Node.js Backend API',
      database: 'Connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'Node.js Backend API',
      database: 'Disconnected',
      error: error.message,
    });
  }
});

/* -------------------- ROUTES -------------------- */
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/employees', require('./employees/employee.controller'));
app.use('/departments', require('./departments/department.controller'));
app.use('/requests', require('./requests/request.controller'));
app.use('/employee-workflows', require('./employees/employee-workflow.controller'));
app.use('/positions', require('./positions/position.controller'));

/* -------------------- ROOT ENDPOINT -------------------- */
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
      health: '/health',
    },
  });
});

/* -------------------- 404 HANDLER -------------------- */
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
});

/* -------------------- GLOBAL ERROR HANDLER -------------------- */
app.use(errorHandler);

/* -------------------- START SERVER -------------------- */
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log('✅ All routes loaded successfully');
  console.log('🔄 Database initialization in progress...');
});
