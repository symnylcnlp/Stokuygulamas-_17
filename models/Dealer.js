const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dealer = sequelize.define('Dealer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // Firma adı
    name: {
        type: DataTypes.STRING,
        allowNull: false
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
    // Adres bilgileri
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    district: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Türkiye'
    },
    establishmentYear: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },
    taxNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    taxOffice: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Belgeler (dosya yolları)
    taxCertificatePath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tradeRegistryGazettePath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    signatureCircularPath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending' // pending, approved, rejected
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    externalMetadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'dealers',
    timestamps: true
});

module.exports = Dealer;


