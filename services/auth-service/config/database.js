const { Sequelize } = require('sequelize');
require('dotenv').config();

// Membina sambungan ke pangkalan data MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Tukar kepada 'console.log' jika mahu melihat query SQL di terminal
  }
);

module.exports = sequelize;