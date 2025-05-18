document.addEventListener('DOMContentLoaded', function() {
    // Variables d'état
    let lists = [];
    let folders = [];
    let tasks = [];
    let currentListId = null;
    let draggedListId = null;
    let draggedItemType = null; // 'list', 'folder' ou 'task'
    let draggedTaskId = null;
    
    // Éléments DOM
    const newListForm = document.getElementById('new-list-form');
    const newListInput = newListForm.querySelector('input');
    const listsContainer = document.getElementById('lists-container');
    const newFolderBtn = document.getElementById('new-folder-btn');
    const folderModal = document.getElementById('folder-modal');
    const closeFolderModal = document.getElementById('close-folder-modal');
    const cancelFolder = document.getElementById('cancel-folder');
    const newFolderForm = document.getElementById('new-folder-form');
    const folderNameInput = document.getElementById('folder-name');
    const trashZone = document.getElementById('trash-zone');
    
    const newTaskForm = document.getElementById('new-task-form');
    const newTaskInput = newTaskForm.querySelector('input');
    const tasksContainer = document.getElementById('tasks-container');
    const currentListTitle = document.getElementById('current-list-title');
    const deleteCompletedBtn = document.getElementById('delete-completed');
    const taskCountElement = document.getElementById('task-count');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Écouteurs d'événements
    newListForm.addEventListener('submit', handleNewList);
    newFolderBtn.addEventListener('click', () => folderModal.classList.remove('hidden'));
    closeFolderModal.addEventListener('click', () => folderModal.classList.add('hidden'));
    cancelFolder.addEventListener('click', () => folderModal.classList.add('hidden'));
    newFolderForm.addEventListener('submit', handleNewFolder);
    newTaskForm.addEventListener('submit', handleNewTask);
    deleteCompletedBtn.addEventListener('click', deleteCompletedTasks);
    filterButtons.forEach(btn => btn.addEventListener('click', () => filterTasks(btn.dataset.filter)));
    
    // Configuration de la zone de corbeille
    trashZone.addEventListener('dragover', handleTrashDragOver);
    trashZone.addEventListener('dragleave', handleTrashDragLeave);
    trashZone.addEventListener('drop', handleTrashDrop);
    
    // Initialisation
    init();
    
    async function init() {
        try {
            // Charger les listes et dossiers depuis l'API
            await loadListsAndFolders();
            
            // Si une liste était précédemment sélectionnée, réactiver
            const savedListId = localStorage.getItem('currentListId');
            if (savedListId && lists.some(list => list.id === savedListId)) {
                setCurrentList(savedListId);
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation:", error);
        }
    }
    
    async function loadListsAndFolders() {
        try {
            // Charger les listes
            lists = await API.lists.getAll();
            console.log("Listes chargées:", lists);
            
            // Charger les dossiers
            folders = await API.lists.getFolders();
            console.log("Dossiers chargés:", folders);
            
            renderLists();
        } catch (error) {
            console.error("Erreur lors du chargement des listes et dossiers:", error);
            
            // Afficher un message d'erreur
            listsContainer.innerHTML = `
                <div class="text-center text-red-500 py-8">
                    <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>Erreur de connexion à la base de données</p>
                    <p class="text-sm mt-2">Vérifiez que MySQL est démarré et que le serveur Node.js est en cours d'exécution</p>
                </div>
            `;
        }
    }
    
    async function handleNewList(e) {
        e.preventDefault();
        const listName = newListInput.value.trim();
        if (!listName) return;
        
        try {
            const newList = await API.lists.create(listName);
            lists.push(newList);
            newListInput.value = '';
            renderLists();
            setCurrentList(newList.id);
        } catch (error) {
            console.error("Erreur lors de la création de la liste:", error);
            alert("Erreur lors de la création de la liste");
        }
    }
    
    async function handleNewFolder(e) {
        e.preventDefault();
        const folderName = folderNameInput.value.trim();
        if (!folderName) return;
        
        try {
            const newFolder = await API.lists.createFolder(folderName);
            folders.push(newFolder);
            folderNameInput.value = '';
            folderModal.classList.add('hidden');
            renderLists();
        } catch (error) {
            console.error("Erreur lors de la création du dossier:", error);
            alert("Erreur lors de la création du dossier");
        }
    }
    
    async function toggleFolder(folderId) {
        const folderElement = document.querySelector(`.folder-item[data-id="${folderId}"]`);
        const folderContents = folderElement.nextElementSibling;
        const folderIcon = folderElement.querySelector('.folder-icon');
        
        folderContents.classList.toggle('expanded');
        folderIcon.classList.toggle('rotate-90');
        
        // Sauvegarder l'état du dossier
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            folder.expanded = !folder.expanded;
            
            // TODO: Si nécessaire, mettre à jour l'état du dossier dans la base de données
        }
    }
    
    async function moveListToFolder(listId, folderId) {
        try {
            await API.lists.moveToFolder(listId, folderId);
            
            // Mettre à jour l'état local
            const list = lists.find(l => l.id === listId);
            if (list) {
                list.folderId = folderId;
                renderLists();
            }
        } catch (error) {
            console.error(`Erreur lors du déplacement de la liste ${listId}:`, error);
            alert("Erreur lors du déplacement de la liste");
        }
    }
    
    async function handleNewTask(e) {
        e.preventDefault();
        if (!currentListId) return;
        
        const taskName = newTaskInput.value.trim();
        if (!taskName) return;
        
        try {
            const newTask = await API.tasks.create(currentListId, taskName);
            tasks.push(newTask);
            newTaskInput.value = '';
            
            // Recharger les listes pour mettre à jour les compteurs
            await loadListsAndFolders();
            
            // Recharger les tâches de la liste courante
            await loadTasks(currentListId);
        } catch (error) {
            console.error("Erreur lors de la création de la tâche:", error);
            alert("Erreur lors de la création de la tâche");
        }
    }
    
    async function loadTasks(listId) {
        try {
            tasks = await API.tasks.getByList(listId);
            console.log(`Tâches chargées pour la liste ${listId}:`, tasks);
            renderTasks();
            updateTaskCount();
        } catch (error) {
            console.error(`Erreur lors du chargement des tâches pour la liste ${listId}:`, error);
            tasksContainer.innerHTML = `
                <div class="text-center text-red-500 py-16">
                    <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>Erreur lors du chargement des tâches</p>
                </div>
            `;
        }
    }
    
    async function deleteCompletedTasks() {
        if (!currentListId) return;
        
        try {
            await API.tasks.deleteCompleted(currentListId);
            
            // Recharger les tâches et les listes
            await loadTasks(currentListId);
            await loadListsAndFolders();
        } catch (error) {
            console.error("Erreur lors de la suppression des tâches terminées:", error);
            alert("Erreur lors de la suppression des tâches terminées");
        }
    }
    
    function filterTasks(filter) {
        filterButtons.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('bg-indigo-100', 'text-indigo-600');
                btn.classList.remove('hover:bg-slate-100');
            } else {
                btn.classList.remove('bg-indigo-100', 'text-indigo-600');
                btn.classList.add('hover:bg-slate-100');
            }
        });
        
        renderTasks();
    }
    
    async function toggleTaskCompletion(taskId) {
        try {
            await API.tasks.toggle(taskId);
            
            // Mettre à jour localement
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
            }
            
            renderTasks();
            updateTaskCount();
            
            // Recharger les listes pour mettre à jour les compteurs
            await loadListsAndFolders();
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la tâche ${taskId}:`, error);
            alert("Erreur lors de la mise à jour de la tâche");
        }
    }
    
    async function deleteTask(taskId) {
        try {
            await API.tasks.delete(taskId);
            
            // Mettre à jour localement
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
            updateTaskCount();
            
            // Recharger les listes pour mettre à jour les compteurs
            await loadListsAndFolders();
        } catch (error) {
            console.error(`Erreur lors de la suppression de la tâche ${taskId}:`, error);
            alert("Erreur lors de la suppression de la tâche");
        }
    }
    
    function setCurrentList(listId) {
        currentListId = listId;
        localStorage.setItem('currentListId', listId);
        
        const list = lists.find(l => l.id === listId);
        if (list) {
            currentListTitle.innerHTML = `<i class="fas fa-clipboard-list text-indigo-500 mr-2"></i>${list.name}`;
            deleteCompletedBtn.classList.remove('hidden');
            
            // Afficher le formulaire des tâches
            newTaskForm.classList.remove('hidden');
            
            // Charger les tâches de cette liste
            loadTasks(listId);
        }
        
        // Mettre en surbrillance la liste sélectionnée
        document.querySelectorAll('.list-item').forEach(item => {
            if (item.dataset.id === listId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    function renderLists() {
        if (lists.length === 0 && folders.length === 0) {
            listsContainer.innerHTML = `
                <div class="text-center text-slate-400 py-8">
                    <i class="fas fa-list-ul text-3xl mb-2"></i>
                    <p>Créez votre première liste ou dossier</p>
                </div>
            `;
            return;
        }
        
        listsContainer.innerHTML = '';
        
        // Afficher d'abord les listes non groupées
        const ungroupedLists = lists.filter(list => !list.folderId);
        if (ungroupedLists.length > 0) {
            ungroupedLists.forEach(list => {
                const listItem = createListItemElement(list);
                listsContainer.appendChild(listItem);
            });
        }
        
        // Afficher les dossiers et leurs listes
        folders.forEach(folder => {
            const folderLists = lists.filter(list => list.folderId === folder.id);
            
            // Élément du dossier (même s'il n'y a pas encore de listes)
            const folderItem = createFolderItemElement(folder, folderLists);
            listsContainer.appendChild(folderItem);
            
            // Contenu du dossier
            const folderContents = document.createElement('div');
            folderContents.className = `folder-contents pl-6 ${folder.expanded ? 'expanded' : ''}`;
            
            if (folderLists.length > 0) {
                folderLists.forEach(list => {
                    const listItem = createListItemElement(list, true);
                    folderContents.appendChild(listItem);
                });
            } else {
                // Message si le dossier est vide
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'text-center text-slate-400 py-3 text-sm';
                emptyMessage.textContent = 'Aucune liste dans ce dossier';
                folderContents.appendChild(emptyMessage);
            }
            
            listsContainer.appendChild(folderContents);
        });
    }
    
    function createListItemElement(list, isInFolder = false) {
        const listItem = document.createElement('div');
        listItem.className = 'list-item p-3 rounded-lg mb-1 cursor-pointer flex items-center justify-between hover:bg-slate-100 transition-colors';
        listItem.dataset.id = list.id;
        listItem.draggable = true;
        
        const listTasks = tasks.filter(t => t.listId === list.id);
        const completedCount = list.completed_tasks || 0;
        const totalCount = list.total_tasks || 0;
        
        listItem.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-list-ul text-slate-400 mr-3"></i>
                <span>${list.name}</span>
            </div>
            <div class="flex items-center">
                <span class="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full mr-2">
                    ${completedCount}/${totalCount}
                </span>
                ${isInFolder ? `<button class="move-list-btn text-slate-400 hover:text-indigo-500" data-list-id="${list.id}">
                    <i class="fas fa-ellipsis-v"></i>
                </button>` : ''}
            </div>
        `;
        
        listItem.addEventListener('click', () => setCurrentList(list.id));
        
        // Gestion du drag and drop
        listItem.addEventListener('dragstart', handleDragStart);
        listItem.addEventListener('dragover', handleDragOver);
        listItem.addEventListener('dragleave', handleDragLeave);
        listItem.addEventListener('drop', handleDrop);
        listItem.addEventListener('dragend', handleDragEnd);
        
        if (isInFolder) {
            const moveBtn = listItem.querySelector('.move-list-btn');
            moveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showMoveListMenu(list.id, e.target);
            });
        }
        
        return listItem;
    }
    
    function createFolderItemElement(folder, folderLists) {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item p-3 rounded-lg mb-1 cursor-pointer flex items-center justify-between hover:bg-slate-200 transition-colors';
        folderItem.dataset.id = folder.id;
        folderItem.dataset.type = 'folder';
        folderItem.draggable = true;
        
        folderItem.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-folder text-yellow-500 mr-3 folder-icon transition-transform ${folder.expanded ? 'rotate-90' : ''}"></i>
                <span class="font-medium">${folder.name}</span>
            </div>
            <span class="text-xs bg-slate-300 text-slate-700 px-2 py-1 rounded-full">
                ${folderLists.length} liste${folderLists.length > 1 ? 's' : ''}
            </span>
        `;
        
        folderItem.addEventListener('click', (e) => {
            // Empêcher le déclenchement si on clique sur le bouton de déplacement
            if (!e.target.closest('.move-list-btn')) {
                toggleFolder(folder.id);
            }
        });
        
        // Gestion du drag and drop pour les dossiers
        folderItem.addEventListener('dragover', handleFolderDragOver);
        folderItem.addEventListener('dragleave', handleFolderDragLeave);
        folderItem.addEventListener('drop', handleFolderDrop);
        
        // Gestion du drag and drop vers la corbeille
        folderItem.addEventListener('dragstart', function(e) {
            e.stopPropagation();
            draggedItemType = 'folder';
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', folder.id);
            e.dataTransfer.setData('itemType', 'folder');
            trashZone.classList.add('hover:bg-red-100');
        });
        
        folderItem.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItemType = null;
            trashZone.classList.remove('hover:bg-red-100');
            trashZone.classList.remove('trash-drop-target');
        });
        
        return folderItem;
    }
    
    function showMoveListMenu(listId, target) {
        // Créer le menu contextuel
        const menu = document.createElement('div');
        menu.className = 'absolute bg-white shadow-lg rounded-lg py-1 z-10 w-48';
        menu.style.top = `${target.getBoundingClientRect().bottom + window.scrollY}px`;
        menu.style.left = `${target.getBoundingClientRect().left + window.scrollX}px`;
        
        // Option pour déplacer vers "Aucun dossier"
        const noFolderOption = document.createElement('button');
        noFolderOption.className = 'w-full text-left px-4 py-2 hover:bg-slate-100';
        noFolderOption.innerHTML = '<i class="fas fa-ban text-slate-400 mr-2"></i> Aucun dossier';
        noFolderOption.addEventListener('click', () => {
            moveListToFolder(listId, null);
            menu.remove();
        });
        menu.appendChild(noFolderOption);
        
        // Options pour chaque dossier
        folders.forEach(folder => {
            const folderOption = document.createElement('button');
            folderOption.className = 'w-full text-left px-4 py-2 hover:bg-slate-100';
            folderOption.innerHTML = `<i class="fas fa-folder text-yellow-500 mr-2"></i> ${folder.name}`;
            folderOption.addEventListener('click', () => {
                moveListToFolder(listId, folder.id);
                menu.remove();
            });
            menu.appendChild(folderOption);
        });
        
        document.body.appendChild(menu);
        
        // Fermer le menu quand on clique ailleurs
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 10);
    }
    
    // Fonctions pour le drag and drop
    function handleDragStart(e) {
        draggedListId = this.dataset.id;
        draggedItemType = 'list';
        this.classList.add('dragging');
        e.dataTransfer.setData('text/plain', draggedListId);
        e.dataTransfer.setData('itemType', 'list');
        e.dataTransfer.effectAllowed = 'move';
        
        // Rendre la corbeille plus visible
        trashZone.classList.add('hover:bg-red-100');
    }
    
    function handleDragOver(e) {
        if (draggedListId && draggedListId !== this.dataset.id) {
            e.preventDefault();
            this.classList.add('drop-target');
            e.dataTransfer.dropEffect = 'move';
        }
    }
    
    function handleDragLeave() {
        this.classList.remove('drop-target');
    }
    
    async function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drop-target');
        
        const droppedListId = e.dataTransfer.getData('text/plain');
        if (droppedListId && droppedListId !== this.dataset.id) {
            // Pour l'instant, nous ne réordonnons pas les listes dans la base de données
            // Nous nous contentons de les déplacer dans/hors des dossiers
            console.log(`Liste ${droppedListId} déplacée sur liste ${this.dataset.id}`);
        }
    }
    
    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedListId = null;
        draggedItemType = null;
        draggedTaskId = null;
        
        // Masquer la corbeille
        trashZone.classList.remove('hover:bg-red-100');
        trashZone.classList.remove('trash-drop-target');
        
        // Retirer les styles de drop target de tous les éléments
        document.querySelectorAll('.list-item').forEach(item => {
            item.classList.remove('drop-target');
        });
        
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('folder-drop-target');
        });
    }
    
    function handleFolderDragOver(e) {
        if (draggedListId) {
            e.preventDefault();
            this.classList.add('folder-drop-target');
            e.dataTransfer.dropEffect = 'move';
        }
    }
    
    function handleFolderDragLeave() {
        this.classList.remove('folder-drop-target');
    }
    
    async function handleFolderDrop(e) {
        e.preventDefault();
        this.classList.remove('folder-drop-target');
        
        const droppedListId = e.dataTransfer.getData('text/plain');
        if (droppedListId) {
            const folderId = this.dataset.id;
            await moveListToFolder(droppedListId, folderId);
        }
    }
    
    function renderTasks() {
        if (!currentListId) {
            tasksContainer.innerHTML = `
                <div class="text-center text-slate-400 py-16">
                    <i class="fas fa-clipboard-list text-3xl mb-2"></i>
                    <p>Sélectionnez une liste pour voir vos tâches</p>
                </div>
            `;
            return;
        }
        
        const currentFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        let filteredTasks = tasks.filter(task => task.listId === currentListId);
        
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="text-center text-slate-400 py-16">
                    <i class="fas fa-tasks text-3xl mb-2"></i>
                    <p>${currentFilter === 'all' ? 'Aucune tâche dans cette liste' : 
                       currentFilter === 'active' ? 'Aucune tâche active' : 'Aucune tâche terminée'}</p>
                </div>
            `;
            return;
        }
        
        tasksContainer.innerHTML = '';
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item p-3 border-b border-slate-100 flex items-center group';
            taskItem.dataset.id = task.id;
            taskItem.draggable = true;
            
            taskItem.innerHTML = `
                <div class="flex items-center flex-1">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           class="checkbox-custom mr-3" 
                           id="task-${task.id}">
                    <label for="task-${task.id}" class="flex-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}">
                        ${task.title}
                    </label>
                </div>
                <div class="task-actions opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="text-slate-400 hover:text-red-500 ml-2" data-task-id="${task.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            const checkbox = taskItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            
            const deleteBtn = taskItem.querySelector('button');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });
            
            // Ajouter les gestionnaires d'événements de glisser-déposer pour les tâches
            taskItem.addEventListener('dragstart', function(e) {
                draggedTaskId = task.id;
                draggedItemType = 'task';
                this.classList.add('dragging');
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.setData('itemType', 'task');
                trashZone.classList.add('hover:bg-red-100');
            });
            
            taskItem.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                draggedTaskId = null;
                draggedItemType = null;
                trashZone.classList.remove('hover:bg-red-100');
                trashZone.classList.remove('trash-drop-target');
            });
            
            tasksContainer.appendChild(taskItem);
        });
        
        updateTaskCount();
    }
    
    function updateTaskCount() {
        if (!currentListId) {
            taskCountElement.textContent = '0 tâche';
            return;
        }
        
        const currentTasks = tasks.filter(task => task.listId === currentListId);
        const completedCount = currentTasks.filter(task => task.completed).length;
        const totalCount = currentTasks.length;
        
        taskCountElement.textContent = `${completedCount}/${totalCount} tâche${totalCount !== 1 ? 's' : ''}`;
    }
    
    function handleTrashDragOver(e) {
        e.preventDefault();
        trashZone.classList.add('trash-drop-target');
        e.dataTransfer.dropEffect = 'move';
    }
    
    function handleTrashDragLeave(e) {
        trashZone.classList.remove('trash-drop-target');
    }
    
    async function handleTrashDrop(e) {
        e.preventDefault();
        trashZone.classList.remove('trash-drop-target');
        
        const itemType = e.dataTransfer.getData('itemType') || draggedItemType;
        const itemId = e.dataTransfer.getData('text/plain');
        
        console.log(`Suppression de l'élément : ${itemType} - ${itemId}`);
        
        if (itemType === 'list' && itemId) {
            await deleteList(itemId);
        } else if (itemType === 'folder' && itemId) {
            await deleteFolder(itemId);
        } else if (itemType === 'task' && itemId) {
            await deleteTask(itemId);
        }
    }
    
    async function deleteList(listId) {
        try {
            await API.lists.delete(listId);
            
            // Mettre à jour localement
            lists = lists.filter(l => l.id !== listId);
            renderLists();
            await loadListsAndFolders();
        } catch (error) {
            console.error(`Erreur lors de la suppression de la liste ${listId}:`, error);
            alert("Erreur lors de la suppression de la liste");
        }
    }
    
    async function deleteFolder(folderId) {
        try {
            await API.lists.deleteFolder(folderId);
            
            // Mettre à jour localement
            folders = folders.filter(f => f.id !== folderId);
            renderLists();
            await loadListsAndFolders();
        } catch (error) {
            console.error(`Erreur lors de la suppression du dossier ${folderId}:`, error);
            alert("Erreur lors de la suppression du dossier");
        }
    }
}); 