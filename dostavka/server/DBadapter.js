import pg from 'pg';

export default class DBadapter {
    #client;

    constructor({ dbHost, dbPort, dbName, dbUserLogin, dbUserPassword }) {
        this.#client = new pg.Client({
            host: dbHost,
            port: dbPort,
            database: dbName,
            user: dbUserLogin,
            password: dbUserPassword,
            client_encoding: 'UTF8',
        });
    }

    async connect() {
        try {
            await this.#client.connect();
            console.log('Database connection established');
        } catch (error) {
            console.error('Error connecting to database:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.#client.end();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error disconnecting from database:', error);
        }
    }

    async getCouriers() {
        try {
            const result = await this.#client.query(`
                SELECT couriers.id, couriers.full_name, couriers.region_id, couriers.max_cells, regions.name AS region_name,
                       couriers.created_at, couriers.updated_at
                FROM couriers
                LEFT JOIN regions ON couriers.region_id = regions.id
                ORDER BY couriers.id
            `);

            const couriers = result.rows;

            for (const courier of couriers) {
                const tasksResult = await this.#client.query(
                    'SELECT * FROM tasks WHERE courier_id = $1 ORDER BY id',
                    [courier.id]
                );
                courier.tasks = tasksResult.rows;
            }

            return couriers;
        } catch (error) {
            console.error('Ошибка получения курьеров:', error);
            throw error;
        }
    }

    async addCourier({ full_name, region_id, max_cells }) {
        try {
            const result = await this.#client.query(
                `INSERT INTO couriers (full_name, region_id, max_cells)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [full_name, region_id, max_cells]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Ошибка добавления курьера в базу данных:', error);
            throw error;
        }
    }

    async getRegions() {
        try {
            const result = await this.#client.query('SELECT * FROM regions ORDER BY name');
            return result.rows;
        } catch (error) {
            console.error('Error fetching regions:', error);
            throw error;
        }
    }

    async addRegion(name) {
        try {
            const result = await this.#client.query(
                'INSERT INTO regions (name) VALUES ($1) RETURNING *',
                [name]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error adding region:', error);
            throw error;
        }
    }

    async getTasks() {
        try {
            const result = await this.#client.query('SELECT * FROM tasks ORDER BY id');
            return result.rows;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }

    async addTask({ description, cells, region_id, address, courier_id }) {
        try {
            await this.validateTaskRegion(courier_id, region_id);
            const result = await this.#client.query(
                `INSERT INTO tasks (description, cells, region_id, address, courier_id)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [description, cells, region_id, address, courier_id]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Ошибка добавления задания:", error);
            throw error;
        }
    }

    async transferTask(taskId, newCourierId) {
        try {
            const taskResult = await this.#client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
            const task = taskResult.rows[0];
            if (!task) throw new Error("Task not found");
    
            const courierResult = await this.#client.query('SELECT * FROM couriers WHERE id = $1', [newCourierId]);
            const courier = courierResult.rows[0];
            if (!courier) throw new Error("Courier not found");
    
            if (courier.region_id !== task.region_id) {
                throw new Error("Task region does not match courier region");
            }
    
            const result = await this.#client.query(
                'UPDATE tasks SET courier_id = $1 WHERE id = $2 RETURNING *',
                [newCourierId, taskId]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Error transferring task:", error);
            throw error;
        }
    }
    

    async validateTaskRegion(courierId, taskRegionId) {
        try {
            const courierResult = await this.#client.query('SELECT * FROM couriers WHERE id = $1', [courierId]);
            const courier = courierResult.rows[0];
            if (!courier) throw new Error("Курьер не найден");

            if (courier.region_id !== taskRegionId) {
                throw new Error(`Район задания (${taskRegionId}) не совпадает с районом курьера (${courier.region_id})`);
            }
        } catch (error) {
            console.error("Ошибка проверки района задания:", error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            const result = await this.#client.query(
                'DELETE FROM tasks WHERE id = $1 RETURNING *',
                [taskId]
            );
            return result; // Результат выполнения запроса
        } catch (error) {
            console.error('Ошибка удаления задания:', error);
            throw error;
        }
    }
}
