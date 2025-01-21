-- Создание таблицы районов доставки с автоинкрементом для id
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,  -- Идентификатор района с автоинкрементом
    name VARCHAR(255) NOT NULL UNIQUE,  -- Название района
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Дата создания записи
);

-- Создание таблицы курьеров с автоинкрементом для id
CREATE TABLE couriers (
    id SERIAL PRIMARY KEY,  -- Идентификатор курьера с автоинкрементом
    full_name VARCHAR(255) NOT NULL,  -- ФИО курьера
    region_id INTEGER REFERENCES regions(id),  -- Ссылка на район работы
    max_cells INTEGER NOT NULL,  -- Максимальное количество ячеек
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Дата создания записи
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Дата последнего обновления
);

-- Создание таблицы заданий с автоинкрементом для id
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,  -- Идентификатор задания с автоинкрементом
    description VARCHAR(255) NOT NULL,  -- Описание заказа
    cells INTEGER NOT NULL,  -- Количество ячеек
    region_id INTEGER REFERENCES regions(id),  -- Район доставки (ссылка на таблицу regions)
    address VARCHAR(255) NOT NULL,  -- Адрес доставки
    courier_id INTEGER REFERENCES couriers(id),  -- Курьер, который выполняет задание (ссылка на таблицу couriers)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Дата создания задания
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Дата последнего обновления задания
);
