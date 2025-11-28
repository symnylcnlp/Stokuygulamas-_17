const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    urunAdi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    urunKodu: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    kategori: {
        type: DataTypes.STRING,
        allowNull: false
    },
    urunFiyati: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    bayiFiyati: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    bedenler: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    renkler: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    renkKombinasyonlari: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    varyantlar: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    oneCikan: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    aciklama: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    urunDetaylari: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    stokSayisi: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'products',
    timestamps: true // createdAt ve updatedAt kolonları otomatik oluşturulur
});

module.exports = Product;