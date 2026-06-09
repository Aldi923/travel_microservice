const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    // Menggunakan nama service database di Docker (bukan localhost)
    host: process.env.DB_HOST || 'database', 
    // Port standar MySQL adalah 3306, JANGAN diubah ke 5001
    port: process.env.DB_PORT || 5001,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;