require('rootpath')();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errorHandler = require('_middleware/error-handler');
const db = require('_helpers/db');

const app = express();

// ✅ --- FIXED CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:4200', // for local dev
  'https://api-angular-frontend-rmsj10ism-jietryls-projects.vercel.app', // your deployed Vercel frontend
  'https://api-angular-frontend.vercel.app' // ✅ also include this — seen in your Render logs
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ✅ --- handle preflight requests globally ---
app.options(/.*/, cors());

// --- REQUIRED MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// --- ROUTES ---
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/employees', require('./employees/employee.controller'));
app.use('/departments', require('./departments/department.controller'));
app.use('/requests', require('./requests/request.controller'));

// --- GLOBAL ERROR HANDLER ---
app.use(errorHandler);

// --- CONNECT TO DATABASE ---
(async () => {
  try {
    if (db && db.sequelize) {
      await db.sequelize.sync({ alter: true });
      console.log('[DB] Connected and synced successfully!');
    } else {
      console.error('[DB] Initialization failed: Sequelize not available');
    }
  } catch (err) {
    console.error('[DB] Connection failed:', err);
  }
})();

// --- START SERVER ---
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
