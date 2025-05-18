// API client pour communiquer avec le backend MySQL
const API_URL = 'http://localhost:3001/api';

const API = {
  // Fonctions pour les listes
  lists: {
    getAll: async () => {
      try {
        console.log("Tentative de récupération des listes depuis:", `${API_URL}/lists`);
        const response = await fetch(`${API_URL}/lists`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Données reçues:", data);
        
        // Adapter le format des données pour l'interface
        const lists = data.map(list => ({
          id: list.id.toString(),
          name: list.name,
          folderId: list.folder_id ? list.folder_id.toString() : null,
          total_tasks: list.total_tasks || 0,
          completed_tasks: list.completed_tasks || 0
        }));
        
        return lists;
      } catch (error) {
        console.error("Erreur lors de la récupération des listes:", error);
        return [];
      }
    },
    
    // Récupérer les dossiers
    getFolders: async () => {
      try {
        console.log("Tentative de récupération des dossiers");
        const response = await fetch(`${API_URL}/lists/folders`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Dossiers reçus:", data);
        
        // Adapter le format pour l'interface
        const folders = data.map(folder => ({
          id: folder.id.toString(),
          name: folder.name,
          expanded: folder.expanded === 1
        }));
        
        return folders;
      } catch (error) {
        console.error("Erreur lors de la récupération des dossiers:", error);
        return [];
      }
    },
    
    // Créer un dossier
    createFolder: async (name) => {
      try {
        const response = await fetch(`${API_URL}/lists/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const folder = await response.json();
        return {
          id: folder.id.toString(),
          name: folder.name,
          expanded: true
        };
      } catch (error) {
        console.error("Erreur lors de la création du dossier:", error);
        throw error;
      }
    },
    
    create: async (name, folderId = null) => {
      try {
        const response = await fetch(`${API_URL}/lists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name,
            folder_id: folderId 
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const list = await response.json();
        return {
          id: list.id.toString(),
          name: list.name,
          folderId: list.folder_id ? list.folder_id.toString() : null
        };
      } catch (error) {
        console.error("Erreur lors de la création de la liste:", error);
        throw error;
      }
    },
    
    // Déplacer une liste dans un dossier
    moveToFolder: async (listId, folderId) => {
      try {
        const response = await fetch(`${API_URL}/lists/${listId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder_id: folderId })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erreur lors du déplacement de la liste ${listId}:`, error);
        throw error;
      }
    },
    
    delete: async (id) => {
      try {
        const response = await fetch(`${API_URL}/lists/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erreur lors de la suppression de la liste ${id}:`, error);
        throw error;
      }
    },
    
    // Supprimer un dossier
    deleteFolder: async (id) => {
      try {
        const response = await fetch(`${API_URL}/lists/folders/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erreur lors de la suppression du dossier ${id}:`, error);
        throw error;
      }
    }
  },
  
  // Fonctions pour les tâches
  tasks: {
    getByList: async (listId) => {
      try {
        const response = await fetch(`${API_URL}/tasks/list/${listId}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Adapter le format pour l'interface
        return data.map(task => ({
          id: task.id.toString(),
          listId: task.list_id.toString(),
          title: task.text,
          completed: task.completed === 1,
          createdAt: new Date(task.created_at)
        }));
      } catch (error) {
        console.error(`Erreur lors de la récupération des tâches de la liste ${listId}:`, error);
        return [];
      }
    },
    
    create: async (listId, title) => {
      try {
        const response = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ list_id: listId, title })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const task = await response.json();
        return {
          id: task.id.toString(),
          listId: task.list_id.toString(),
          title: task.text,
          completed: task.completed === 1,
          createdAt: new Date(task.created_at)
        };
      } catch (error) {
        console.error("Erreur lors de la création de la tâche:", error);
        throw error;
      }
    },
    
    toggle: async (id) => {
      try {
        const response = await fetch(`${API_URL}/tasks/${id}/toggle`, {
          method: 'PUT'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la tâche ${id}:`, error);
        throw error;
      }
    },
    
    update: async (id, title) => {
      try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la tâche ${id}:`, error);
        throw error;
      }
    },
    
    delete: async (id) => {
      try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Erreur lors de la suppression de la tâche ${id}:`, error);
        throw error;
      }
    },
    
    deleteCompleted: async (listId) => {
      try {
        const response = await fetch(`${API_URL}/tasks/completed/list/${listId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erreur lors de la suppression des tâches terminées:', error);
        throw error;
      }
    }
  }
}; 