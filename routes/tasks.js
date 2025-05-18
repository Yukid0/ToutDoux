const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Récupérer toutes les tâches d'une liste
router.get('/list/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    console.log(`Tentative de récupération des tâches pour la liste ${listId}...`);
    
    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC',
      [listId]
    );
    
    console.log(`Tâches récupérées pour la liste ${listId}:`, tasks);
    res.json(tasks);
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer une nouvelle tâche
router.post('/', async (req, res) => {
  try {
    const { list_id, title } = req.body;
    
    if (!list_id || !title) {
      return res.status(400).json({ message: 'Liste ID et titre sont requis' });
    }
    
    const [result] = await db.query(
      'INSERT INTO tasks (list_id, text) VALUES (?, ?)',
      [list_id, title]
    );
    
    const [newTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Mettre à jour le statut d'une tâche
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtenir le statut actuel
    const [task] = await db.query('SELECT completed FROM tasks WHERE id = ?', [id]);
    
    if (task.length === 0) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    // Inverser le statut
    const newStatus = task[0].completed ? 0 : 1;
    
    await db.query('UPDATE tasks SET completed = ? WHERE id = ?', [newStatus, id]);
    res.json({ id, completed: Boolean(newStatus) });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Mettre à jour le titre d'une tâche
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Le titre est requis' });
    }
    
    await db.query('UPDATE tasks SET text = ? WHERE id = ?', [title, id]);
    const [updatedTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    
    if (updatedTask.length === 0) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer une tâche
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer toutes les tâches terminées d'une liste
router.delete('/completed/list/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    await db.query('DELETE FROM tasks WHERE list_id = ? AND completed = 1', [listId]);
    res.json({ message: 'Tâches terminées supprimées avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression des tâches terminées:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router; 