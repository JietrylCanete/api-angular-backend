// employees/employee.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const attributes = {
    EmployeeID: {
      type: DataTypes.STRING(32),
      allowNull: false,
      primaryKey: true,
      unique: true,
      field: 'EmployeeID'
    },
    accountId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'accountId'
    },
    positionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'positionId'
    },
    headEmployeeId: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'headEmployeeId'
    },
    departmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'DepartmentID'
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'hireDate'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated'
    }
  };

  const options = {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'created',
    updatedAt: 'updated'
  };

  const Employee = sequelize.define('Employee', attributes, options);

  Employee.associate = (models) => {
    // Account relation
    Employee.belongsTo(models.Account, {
      foreignKey: 'accountId',
      as: 'Account',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Department relation
    Employee.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'Department',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Position relation
    if (models.Position) {
      Employee.belongsTo(models.Position, {
        foreignKey: 'positionId',
        as: 'Position',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }

    // Head (self-relation)
    Employee.belongsTo(Employee, {
      foreignKey: 'headEmployeeId',
      as: 'Head',
      targetKey: 'EmployeeID',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Subordinates reverse relation
    Employee.hasMany(Employee, {
      foreignKey: 'headEmployeeId',
      as: 'Subordinates',
      sourceKey: 'EmployeeID'
    });
  };

  return Employee;
};
