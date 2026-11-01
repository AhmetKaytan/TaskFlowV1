//Normalizasyon  işlemi trim ve toLowerCase ile yapılır

const { readTasks, writeTasks } = require('../utils/fileOperations');

const createError = (message, status, field = null) => {
    const err = new Error(message);
    err.status = status;

    if (field) {
        err.field = field;
    }

    return err;
};

// Görev listesini oku ve temel veri kontrolünü yap
const loadTasks = () => {
    const data = readTasks();

    if (!data || !Array.isArray(data.tasks)) {
        throw createError('Invalid tasks data.', 500);
    }

    return data;
};

// Görev verilerini kontrol et (status ve priority dahil edilerek)
const hasInvalidTasks = (tasks, checkStatusAndPriority = false) => {
    return tasks.some(task => {
        if (!task || typeof task !== 'object' || Array.isArray(task)) {
            return true;
        }

        const invalidBasicFields =
            typeof task.title !== 'string' ||
            task.title.trim() === '' ||
            typeof task.assignee !== 'string' ||
            task.assignee.trim() === '' ||
            typeof task.description !== 'string' ||
            task.description.trim() === '';

        if (invalidBasicFields) {
            return true;
        }

        if (checkStatusAndPriority) {
            return (
                typeof task.status !== 'string' ||
                task.status.trim() === '' ||
                typeof task.priority !== 'string' ||
                task.priority.trim() === ''
            );
        }

        return false;
    });
};

// ID doğrulaması
const getValidatedTaskId = (id) => {
    if (typeof id !== 'string' || !/^\d+$/.test(id)) {
        throw createError('Invalid task ID.', 400, 'id');
    }

    const taskId = Number(id);

    if (!Number.isSafeInteger(taskId) || taskId < 1) {
        throw createError('Invalid task ID.', 400, 'id');
    }

    return taskId;
};

// Tüm görevleri getir
const getAllTasks = (req, res, next) => {
    try {
        // Tüm görevleri yükle
        const { tasks } = loadTasks();

        // Boş görev listesi kontrolü
        if (tasks.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No tasks found',
                tasks: []
            });
        }

        //Dosyada geçersiz görev verisi kontrolü
        if (hasInvalidTasks(tasks, true)) {
            throw createError('Invalid tasks data.', 500);
        }

        // Geçerli durum ve öncelik değerlerini tanımla
        const validStatus = ['pending', 'in_progress', 'completed'];
        const validPriorities = ['low', 'medium', 'high'];

        // Sorgu parametrelerini al
        const queryStatus = req.query.status;
        const queryPriority = req.query.priority;
        const queryAssignee = req.query.assignee;
        const queryTitle = req.query.title;

        // Sorgu parametrelerini normalize et ve doğrula
        const queryFields = {
            status: queryStatus,
            priority: queryPriority,
            assignee: queryAssignee,
            title: queryTitle
        };

        const normalizedQuery = {};

        for (const [field, value] of Object.entries(queryFields)) {
            // undefined değerleri kontrol et
            if (value === undefined) {
                normalizedQuery[field] = null;
                continue;
            }

            // Tip kontrolü
            if (typeof value !== 'string') {
                throw createError(`Invalid ${field} value.`, 400, field);
            }

            //Normalize işlemi (trim ve tolowercase)
            const normalizedValue = value.trim().toLowerCase();

            // Boş değer kontrolü
            if (!normalizedValue) {
                // (Baş harfi büyük olacak şekilde) alan boş olamaz uyarısı
                throw createError(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty.`, 400, field);
            }

            normalizedQuery[field] = normalizedValue;
        }

        // Normalize edilmiş sorgu parametrelerini tekrar ayıkla
        const {
            status,
            priority,
            assignee,
            title
        } = normalizedQuery;

        // Status ve priority değerlerini doğrula
        if (status && !validStatus.includes(status)) {
            throw createError('Invalid status value.', 400, 'status');
        }

        if (priority && !validPriorities.includes(priority)) {
            throw createError('Invalid priority value.', 400, 'priority');
        }

        // Filtreleme işlemi
        const filteredTasks = tasks.filter(task => {
            if (status && task.status.trim().toLowerCase() !== status) {
                return false;
            }

            if (priority && task.priority.trim().toLowerCase() !== priority) {
                return false;
            }

            if (assignee && task.assignee.trim().toLowerCase() !== assignee) {
                return false;
            }

            if (title && !task.title.trim().toLowerCase().includes(title)) {
                return false;
            }

            return true;
        });

        return res.status(200).json({
            status: 'success',
            tasks: filteredTasks
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to retrieve tasks.', 500);
        }

        return next(error);
    }
};

// Genel arama işlemi
const searchTasks = (req, res, next) => {
    try {
        // Arama sorgusunu al doğrula
        const { keyword } = req.query;

        if (typeof keyword !== 'string') {
            throw createError('Search query must be a string.', 400, 'keyword');
        }

        if (!keyword) {
            throw createError('Search query is required.', 400, 'keyword');
        }

        // Arama sorgusunu normalize et (trim ve toLowerCase)
        const query = keyword.trim().toLowerCase();

        // Normalize edilmiş değer boş mu kontrol et
        if (!query) {
            throw createError('Search query cannot be empty.', 400, 'keyword');
        }

        // Görevleri yükle ve geçerliliğini kontrol et
        const { tasks } = loadTasks();

        if (tasks.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No tasks found',
                tasks: []
            });
        }

        if (hasInvalidTasks(tasks)) {
            throw createError('Invalid task data.', 500);
        }

        // Arama işlemi (title, assignee, description alanlarında)
        const searchedTasks = tasks.filter(task =>
            task.title.trim().toLowerCase().includes(query) ||
            task.assignee.trim().toLowerCase().includes(query) ||
            task.description.trim().toLowerCase().includes(query)
        );

        return res.status(200).json({
            status: 'success',
            tasks: searchedTasks,
            message: searchedTasks.length === 0 ? 'No tasks found' : 'Tasks found'
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to search tasks.', 500);
        }

        return next(error);
    }
};

// Görevliye göre görevleri getir
const getTasksByAssignee = (req, res, next) => {
    try {
        // Assignee adını al ve doğrula
        const { name } = req.params;

        if (typeof name !== 'string' || name.trim() === '') {
            throw createError('Assignee name is required.', 400, 'name');
        }
        //Normalizasyon
        const assigneeName = name.trim().toLowerCase();

        // Görevleri yükle ve geçerliliğini kontrol et
        const { tasks } = loadTasks();

        if (tasks.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No tasks found',
                tasks: []
            });
        }

        if (hasInvalidTasks(tasks)) {
            throw createError('Invalid task data.', 500);
        }

        // Assignee'ye göre filtreleme işlemi
        const filteredTasks = tasks.filter(
            task => task.assignee.trim().toLowerCase() === assigneeName
        );

        return res.status(200).json({
            status: 'success',
            tasks: filteredTasks,
            message: filteredTasks.length === 0 ? 'No tasks found' : 'Tasks found'
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to filter tasks by assignee.', 500);
        }

        return next(error);
    }
};

// Yeni görev oluştur
const createTask = (req, res, next) => {
    try {
        // Görevleri ve bir sonraki ID'yi yükle
        const { tasks, nextId } = loadTasks();

        // Geçerliliğini kontrol et
        if (!Number.isSafeInteger(nextId) || nextId < 1) {
            throw createError('Invalid next task ID.', 500);
        }

        // ID çakışmasını kontrol et
        if (tasks.some(task => task && task.id === nextId)) {
            throw createError('Duplicate task ID detected.', 500);
        }

        // İstek gövdesinden görev bilgilerini al
        const {
            title,
            assignee,
            description,
            status,
            priority,
            dueDate
        } = req.body;

        // Şimdiki zamanı al
        const now = new Date().toISOString();

        // Yeni görev nesnesini oluştur
        const newTask = {
            id: nextId,
            title,
            description,
            status: status.trim().toLowerCase(),
            priority: priority.trim().toLowerCase(),
            assignee,
            dueDate,
            createdAt: now,
            updatedAt: now
        };
        // Yeni görevi görev listesine ekle
        tasks.push(newTask);

        // Görevleri dosyaya yaz
        writeTasks({
            tasks,
            nextId: nextId + 1
        });
        
        return res.status(201).json({
            status: 'success',
            message: 'Task created successfully',
            task: newTask
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to create task.', 500);
        }

        return next(error);
    }
};

// ID'ye göre görev getir
const getTaskById = (req, res, next) => {
    try {
        // Parametreden görev ID'sini al
        const taskId = getValidatedTaskId(req.params.id);

        // Görevleri yükle
        const { tasks } = loadTasks();

        // Görevi ID'ye göre bul
        const task = tasks.find(task => task.id === taskId);

        // Eğer görev bulunamazsa hata fırlat
        if (!task) {
            throw createError('Task not found.', 404, 'id');
        }

        return res.status(200).json({
            status: 'success',
            task
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to retrieve task.', 500);
        }

        return next(error);
    }
};

// Görevi güncelle
const updateTask = (req, res, next) => {
    try {
        // Parametreden görev ID'sini al
        const taskId = getValidatedTaskId(req.params.id);

        // Görevleri yükle
        const { tasks, nextId } = loadTasks();

        // Görevi ID'ye göre bul
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            throw createError('Task not found.', 404, 'id');
        }

        // İstek gövdesinden güncellenmiş görev bilgilerini al
        const {
            title,
            assignee,
            description,
            status,
            priority,
            dueDate
        } = req.body;

        // Güncellenmiş görev nesnesini oluştur ( ... operator ile mevcut görev bilgilerini koru, yeni alanları yaz)
        const updatedTask = {
            ...tasks[taskIndex],
            title,
            assignee,
            description,
            status: status.trim().toLowerCase(),
            priority: priority.trim().toLowerCase(),
            dueDate,
            updatedAt: new Date().toISOString()
        };

        // Mevcut görev listesinde güncellenmiş görevi yerine koy ve dosyaya yaz
        tasks[taskIndex] = updatedTask;

        writeTasks({
            tasks,
            nextId
        });

        return res.status(200).json({
            status: 'success',
            message: 'Task updated successfully',
            task: updatedTask
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to update task.', 500);
        }

        return next(error);
    }
};

// Görevi sil
const deleteTask = (req, res, next) => {
    try {
        // Parametreden görev ID'sini al
        const taskId = getValidatedTaskId(req.params.id);

        // Görevleri yükle
        const { tasks, nextId } = loadTasks();

        // Görevi ID'ye göre bul
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        // Eğer görev bulunamazsa hata fırlat
        if (taskIndex === -1) {
            throw createError('Task not found.', 404, 'id');
        }

        // Görevi listeden çıkar (sil)
        tasks.splice(taskIndex, 1);

        // Güncellenmiş görev listesini dosyaya yaz
        writeTasks({
            tasks,
            nextId
        });

        return res.status(200).json({
            status: 'success',
            message: 'Task deleted successfully'
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to delete task.', 500);
        }

        return next(error);
    }
};

module.exports = {
    getAllTasks,
    searchTasks,
    getTasksByAssignee,
    createTask,
    getTaskById,
    updateTask,
    deleteTask
};
