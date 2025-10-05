require('rootpath')();
const db = require('_helpers/db');

async function initializeDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    await db.sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();