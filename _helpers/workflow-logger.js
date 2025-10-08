// _helpers/workflow-logger.js
const db = require('./db');

async function logWorkflow(employeeId, action, description) {
  if (!employeeId || !action) return;
  try {
    await db.EmployeeWorkflow.create({ 
      employeeId: String(employeeId), 
      action, 
      description 
    });
  } catch (err) {
    console.error('Failed to log workflow:', err && err.message ? err.message : err);
  }
}

// New function to log department transfers with department names
async function logDepartmentTransfer(employeeId, fromDeptId, toDeptId) {
  if (!employeeId) return;
  
  try {
    let fromDeptName = 'None';
    let toDeptName = 'None';
    
    // Get department names
    if (fromDeptId) {
      const fromDept = await db.Department.findByPk(fromDeptId);
      fromDeptName = fromDept ? fromDept.departmentName : `Unknown (${fromDeptId})`;
    }
    
    if (toDeptId) {
      const toDept = await db.Department.findByPk(toDeptId);
      toDeptName = toDept ? toDept.departmentName : `Unknown (${toDeptId})`;
    }
    
    const description = `Moved from department ${fromDeptName} to ${toDeptName}`;
    
    await db.EmployeeWorkflow.create({
      employeeId: String(employeeId),
      action: 'Transferred',
      description
    });
    
  } catch (err) {
    console.error('Failed to log department transfer:', err && err.message ? err.message : err);
    // Fallback to original logging with IDs
    await logWorkflow(
      employeeId, 
      'Transferred', 
      `Moved from department ${fromDeptId || 'None'} to ${toDeptId}`
    );
  }
}

module.exports = logWorkflow;
module.exports.logDepartmentTransfer = logDepartmentTransfer;