// _helpers/db.js
const mysql = require('mysql2/promise');
const config = require('config.json');
const { Sequelize } = require('sequelize');

module.exports = db = {};
db.sequelize = null;
db.Sequelize = Sequelize;

initialize().catch(err => {
  console.error('Failed to initialize DB:', err);
});

async function initialize() {
  const { host, port, user, password, database } = config.database;

  if (!host || !user || !database) {
    throw new Error('Missing database configuration in config.json');
  }

  // ensure database exists
  const createConn = await mysql.createConnection({ host, port, user, password });
  try {
    await createConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.info(`[DB] Ensured database "${database}" exists.`);
  } finally {
    await createConn.end();
  }

  // initialize sequelize
  const sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: msg => console.debug('[sequelize]', msg),
    define: { timestamps: true },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  });

  db.sequelize = sequelize;

  // -------------------------
  // IMPORT MODELS (ensure correct order)
  // -------------------------
  db.Account = require('../accounts/account.model.js')(sequelize);
  db.RefreshToken = require('../accounts/refresh-token.model.js')(sequelize);
  db.Position = require('../positions/position.model.js')(sequelize); // ✅ NEW
  db.Employee = require('../employees/employee.model.js')(sequelize);
  db.Department = require('../departments/department.model.js')(sequelize);
  db.Request = require('../requests/request.model.js')(sequelize);

  // Register EmployeeWorkflow model (new)
  db.EmployeeWorkflow = require('../employees/employee-workflow.model.js')(sequelize);

  // -------------------------
  // Define associations
  // -------------------------
  db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
  db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });

  db.Account.hasOne(db.Employee, { as: 'Account', foreignKey: 'accountId', onDelete: 'CASCADE' });
  db.Employee.belongsTo(db.Account, { as: 'Account', foreignKey: 'accountId' });

  db.Department.hasMany(db.Employee, { as: 'Employees', foreignKey: 'departmentId', onDelete: 'SET NULL' });
  db.Employee.belongsTo(db.Department, { as: 'Department', foreignKey: 'departmentId' });

  // 🔹 NEW: Position associations
  db.Position.hasMany(db.Employee, { as: 'Employees', foreignKey: 'positionId', onDelete: 'SET NULL' });
  db.Employee.belongsTo(db.Position, { as: 'Position', foreignKey: 'positionId' });

  // 🔹 NEW: Employee self-reference (head/subordinates)
  db.Employee.belongsTo(db.Employee, {
    foreignKey: 'headEmployeeId',
    targetKey: 'EmployeeID',
    as: 'Head',
    constraints: false
  });
  db.Employee.hasMany(db.Employee, {
    foreignKey: 'headEmployeeId',
    sourceKey: 'EmployeeID',
    as: 'Subordinates',
    constraints: false
  });

  db.Account.hasMany(db.Request, { foreignKey: 'accountId', onDelete: 'CASCADE' });
  db.Request.belongsTo(db.Account, { foreignKey: 'accountId' });

  // optional association for workflow -> employee (no cascading)
  if (db.EmployeeWorkflow && db.Employee) {
    db.Employee.hasMany(db.EmployeeWorkflow, {
      foreignKey: 'employeeId',
      sourceKey: 'EmployeeID',
      as: 'Workflows',
      constraints: false
    });
    db.EmployeeWorkflow.belongsTo(db.Employee, {
      foreignKey: 'employeeId',
      targetKey: 'EmployeeID',
      as: 'Employee',
      constraints: false
    });
  }

  // Safe sync
  try {
    console.info('[DB] Syncing models to database with safe options.');
    await sequelize.sync({ force: false });
    console.info('[DB] Sequelize sync completed successfully.');
  } catch (syncErr) {
    console.error('[DB] Sequelize sync failed:', syncErr.message);
    if (syncErr.code === 'ER_TOO_MANY_KEYS' || syncErr.errno === 1069) {
      console.warn('[DB] Too many keys error - tables likely already exist.');
    } else {
      console.error('[DB] Other sync error:', syncErr);
    }
  }
}
