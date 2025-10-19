// requests/request.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Request = sequelize.define(
    'Request',
    {
      requestId: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        field: 'requestId'
      },
      accountId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      approverId: {
        // Manager/head in charge of approval
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      type: {
        type: DataTypes.ENUM('equipment', 'leave', 'resources'),
        allowNull: false
      },
      items: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'disapproved', 'rejected', 'draft'),
        allowNull: false,
        defaultValue: 'pending'
      },
      created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'requests',
      timestamps: false
    }
  );

  Request.associate = (models) => {
    if (models.Account) {
      Request.belongsTo(models.Account, {
        foreignKey: 'accountId',
        as: 'Account'
      });
      Request.belongsTo(models.Account, {
        foreignKey: 'approverId',
        as: 'Approver'
      });
    }
  };

  return Request;
};
