const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    dealerName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dealerCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: {
                msg: 'contactEmail geçerli bir e-posta olmalıdır'
            }
        }
    },
    contactPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'TRY'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    externalMetadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'orders',
    timestamps: true
});

module.exports = Order;


