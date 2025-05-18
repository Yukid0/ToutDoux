require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuration de la connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'ToutDoux',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Configuration de la base de données:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database
});

// Créer un pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de la connexion
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connexion à la base de données MySQL établie avec succès!');
    connection.release();
  } catch (error) {
    console.error('Erreur lors de la connexion à MySQL:', error);
  }
})();

module.exports = pool; 