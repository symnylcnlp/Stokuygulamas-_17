const { Sequelize } = require('sequelize');
require('dotenv').config();

// Environment variable'lar varsa kullan, yoksa localhost ayarlarını kullan
const dbConfig = {
  database: process.env.DB_NAME || 'mudeir_stok',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false
};

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging
});

module.exports = sequelize;
