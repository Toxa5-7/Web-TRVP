import express from 'express';
import dotenv from 'dotenv';
import DBadapter from './DBadapter.js';
import { json } from 'express';
import cors from 'cors';




// Загружаем переменные окружения
dotenv.config();

const app = express();
const port = process.env.TM_APP_PORT || 7777;

// Создаем адаптер для работы с БД
const dbAdapter = new DBadapter({
    dbHost: process.env.TM_DB_HOST,
    dbPort: process.env.TM_DB_PORT,
    dbName: process.env.TM_DB_NAME,
    dbUserLogin: process.env.TM_DB_USER_LOGIN,
    dbUserPassword: process.env.TM_DB_USER_PASSWORD
});

app.use(express.json());
app.use(cors()); // Разрешает запросы с любого источника


// Передача dbAdapter в каждый запрос
app.use((req, res, next) => {
    req.dbAdapter = dbAdapter;
    next();
});

// API маршруты
import { router } from './routes.js';
app.use('/api', router);

// Запуск сервера
app.listen(port, async () => {
    try {
        await dbAdapter.connect();
        console.log(`Server running on http://localhost:${port}`);
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await dbAdapter.disconnect();
    process.exit(0);
});
