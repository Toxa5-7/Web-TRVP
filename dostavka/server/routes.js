import express from 'express';

const router = express.Router();

// Получить всех курьеров
router.get('/couriers', async (req, res) => {
    try {
        const couriers = await req.dbAdapter.getCouriers();
        const tasks = await req.dbAdapter.getTasks();

        const couriersWithTasks = couriers.map((courier) => ({
            ...courier,
            tasks: tasks.filter((task) => task.courier_id === courier.id),
        }));

        res.json(couriersWithTasks);
    } catch (error) {
        console.error('Error fetching couriers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавить нового курьера
router.post('/couriers', async (req, res) => {
    const { full_name, region_id, max_cells } = req.body;

    if (!full_name || !region_id || !max_cells) {
        return res.status(400).json({ error: 'Все поля (full_name, region_id, max_cells) обязательны!' });
    }

    try {
        const newCourier = await req.dbAdapter.addCourier({ full_name, region_id, max_cells });
        res.status(201).json(newCourier);
    } catch (error) {
        console.error('Ошибка добавления курьера:', error);
        res.status(500).json({ error: 'Не удалось добавить курьера' });
    }
});

// Получить все регионы
router.get('/regions', async (req, res) => {
    try {
        const result = await req.dbAdapter.getRegions();
        res.json(result);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавить новый регион
router.post('/regions', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await req.dbAdapter.addRegion(name);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding region:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить все задания
router.get('/tasks', async (req, res) => {
    try {
        const tasks = await req.dbAdapter.getTasks();
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удалить задание
router.delete('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;

    try {
        const result = await req.dbAdapter.deleteTask(taskId);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавить задание
router.post('/tasks', async (req, res) => {
    const { description, cells, region_id, address, courier_id } = req.body;

    if (!description || isNaN(cells) || !region_id || !address || !courier_id) {
        return res.status(400).json({ error: "Все поля обязательны для заполнения" });
    }

    try {
        const task = await req.dbAdapter.addTask({ description, cells, region_id, address, courier_id });
        res.status(201).json(task);
    } catch (error) {
        console.error("Error adding task:", error);
        res.status(400).json({ error: error.message });
    }
});

// Передать задание другому курьеру
router.patch('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { courier_id } = req.body;

    if (!courier_id) {
        return res.status(400).json({ error: "Courier ID is required" });
    }

    try {
        const task = await req.dbAdapter.transferTask(taskId, courier_id);
        res.status(200).json(task);
    } catch (error) {
        console.error("Error transferring task:", error);
        res.status(400).json({ error: error.message });
    }
});


export { router };
