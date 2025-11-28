const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SizeGuide = sequelize.define('SizeGuide', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'size_guides',
    timestamps: true
});

module.exports = SizeGuide;

