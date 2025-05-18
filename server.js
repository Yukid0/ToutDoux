require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`Port configuré: ${PORT}`);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const listsRoutes = require('./routes/lists');
const tasksRoutes = require('./routes/tasks');

app.use('/api/lists', listsRoutes);
app.use('/api/tasks', tasksRoutes);

// Route pour servir l'application frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}); 