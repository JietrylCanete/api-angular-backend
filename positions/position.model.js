// positions/position.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Position = sequelize.define('Position', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'positions',
    timestamps: false
  });

  Position.associate = (models) => {
    // Position has many Employees
    if (models.Employee) {
      Position.hasMany(models.Employee, {
        foreignKey: 'positionId',
        as: 'Employees'
      });
    }
  };

  return Position;
};
