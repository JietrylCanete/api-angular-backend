// _helpers/db.js
const mysql = require('mysql2/promise');
const config = require('config.json');
const { Sequelize } = require('sequelize');

module.exports = (db = {});
db.sequelize = null;
db.Sequelize = Sequelize;

initialize().catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
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

  db.Account.hasMany(db.Request, { foreignKey: 'accountId', onDelete: 'CASCADE' });
  db.Request.belongsTo(db.Account, { foreignKey: 'accountId' });

  // optional association for workflow -> employee (no cascading)
  if (db.EmployeeWorkflow && db.Employee) {
    db.Employee.hasMany(db.EmployeeWorkflow, { foreignKey: 'employeeId', sourceKey: 'EmployeeID', as: 'Workflows', constraints: false });
    db.EmployeeWorkflow.belongsTo(db.Employee, { foreignKey: 'employeeId', targetKey: 'EmployeeID', as: 'Employee', constraints: false });
  }

  // sync
  try {
    console.info('[DB] Syncing models to database (alter=false).');
    await sequelize.sync({ alter: true });
    console.info('[DB] Sequelize sync completed.');
  } catch (syncErr) {
    console.error('[DB] Sequelize sync failed:', syncErr);
    throw syncErr;
  }
}
