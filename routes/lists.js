const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Récupérer toutes les listes
router.get('/', async (req, res) => {
  try {
    console.log("Tentative de récupération des listes...");
    
    // Vérifier la connexion à la BDD
    try {
      await db.query('SELECT 1');
      console.log("Connexion à la base de données réussie");
    } catch (dbError) {
      console.error("Erreur de connexion à la base de données:", dbError);
      return res.status(500).json({ 
        message: 'Erreur de connexion à la base de données',
        error: dbError.message
      });
    }
    
    const [lists] = await db.query(`
      SELECT l.id, l.name, l.folder_id, l.created_at, 
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_tasks 
      FROM lists l
      LEFT JOIN tasks t ON l.id = t.list_id
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);
    
    console.log("Listes récupérées:", lists);
    
    // S'assurer que lists est un tableau
    const listsArray = Array.isArray(lists) ? lists : [];
    res.json(listsArray);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des listes:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des listes',
      error: error.message
    });
  }
});

// Récupérer tous les dossiers
router.get('/folders', async (req, res) => {
  try {
    console.log("Tentative de récupération des dossiers...");
    
    const [folders] = await db.query(`
      SELECT * FROM folders
      ORDER BY created_at DESC
    `);
    
    console.log("Dossiers récupérés:", folders);
    
    // S'assurer que folders est un tableau
    const foldersArray = Array.isArray(folders) ? folders : [];
    res.json(foldersArray);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des dossiers:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des dossiers',
      error: error.message
    });
  }
});

// Créer un nouveau dossier
router.post('/folders', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Le nom du dossier est requis' });
    }
    
    const [result] = await db.query('INSERT INTO folders (name) VALUES (?)', [name]);
    const [newFolder] = await db.query('SELECT * FROM folders WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newFolder[0]);
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer une nouvelle liste
router.post('/', async (req, res) => {
  try {
    const { name, folder_id } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Le nom de la liste est requis' });
    }
    
    if (folder_id) {
      const [result] = await db.query('INSERT INTO lists (name, folder_id) VALUES (?, ?)', [name, folder_id]);
      const [newList] = await db.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);
      res.status(201).json(newList[0]);
    } else {
      const [result] = await db.query('INSERT INTO lists (name) VALUES (?)', [name]);
      const [newList] = await db.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);
      res.status(201).json(newList[0]);
    }
  } catch (error) {
    console.error('Erreur lors de la création de la liste:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Mettre à jour une liste (pour déplacer dans un dossier)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_id } = req.body;
    
    // Vérifier d'abord si la colonne folder_id existe dans la table lists
    try {
      await db.query('UPDATE lists SET folder_id = ? WHERE id = ?', [folder_id, id]);
      const [updatedList] = await db.query('SELECT * FROM lists WHERE id = ?', [id]);
      
      if (updatedList.length === 0) {
        return res.status(404).json({ message: 'Liste non trouvée' });
      }
      
      res.json(updatedList[0]);
    } catch (error) {
      console.error('Erreur détaillée lors de la mise à jour:', error);
      
      // Si l'erreur indique que la colonne folder_id n'existe pas
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes("Unknown column 'folder_id'")) {
        // Indiquer qu'il faut mettre à jour le schéma de base de données
        res.status(500).json({ 
          message: 'Schéma de base de données incomplet', 
          details: 'La colonne folder_id manque dans la table lists. Exécutez le script db_init.sql pour corriger le problème.'
        });
      } else {
        // Autre erreur
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la liste:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer une liste
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM lists WHERE id = ?', [id]);
    res.json({ message: 'Liste supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la liste:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer un dossier
router.delete('/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mettre d'abord à jour toutes les listes du dossier (folder_id à NULL)
    await db.query('UPDATE lists SET folder_id = NULL WHERE folder_id = ?', [id]);
    
    // Puis supprimer le dossier
    await db.query('DELETE FROM folders WHERE id = ?', [id]);
    
    res.json({ message: 'Dossier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du dossier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router; 