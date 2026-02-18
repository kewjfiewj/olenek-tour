const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ========== СТАТИЧЕСКИЕ ФАЙЛЫ ==========
// Это должно быть ПЕРЕД маршрутами API!
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ========== БАЗА ДАННЫХ ==========
let dbPath;
if (process.env.NODE_ENV === 'production') {
    dbPath = '/tmp/database.sqlite';
    console.log('📦 Production mode: база в /tmp');
} else {
    dbPath = path.join(__dirname, 'database.sqlite');
    console.log('💻 Development mode: база локально');
}

const db = new sqlite3.Database(dbPath);

// Создание таблиц
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_name TEXT,
        main_city TEXT,
        phone TEXT,
        email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        is_active INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price INTEGER,
        image TEXT,
        sort_order INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price_per_night INTEGER,
        rating REAL,
        image TEXT,
        sort_order INTEGER
    )`);

    // Начальные данные
    db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO settings (site_name, main_city, phone, email) VALUES (?, ?, ?, ?)",
                ['Оленевка.Тур', 'Москва', '+7 (978) 000-00-00', 'info@olenevka.ru']);
        }
    });

    db.get("SELECT COUNT(*) as count FROM cities", (err, row) => {
        if (row && row.count === 0) {
            const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Казань', 'Оленёк'];
            cities.forEach(city => {
                db.run("INSERT INTO cities (name) VALUES (?)", [city]);
            });
        }
    });

    db.get("SELECT COUNT(*) as count FROM places", (err, row) => {
        if (row && row.count === 0) {
            const places = [
                ['Тарханкут', 'мыс, маяк, гроты', 500, 'img1', 1],
                ['Чаша любви', 'природный бассейн', 0, 'img2', 2],
                ['Аллея вождей', 'подводный музей', 2500, 'img3', 3],
                ['Атлеш', 'скалы, дельфины', 800, 'img4', 4]
            ];
            places.forEach(p => {
                db.run("INSERT INTO places (name, description, price, image, sort_order) VALUES (?, ?, ?, ?, ?)", p);
            });
        }
    });

    db.get("SELECT COUNT(*) as count FROM hotels", (err, row) => {
        if (row && row.count === 0) {
            const hotels = [
                ['Оленевка Village', 'кемпинг, центр', 500, 4.5, 'img5', 1],
                ['Гостевой дом «Клевер»', 'частный сектор', 800, 5.0, 'img6', 2],
                ['Парк-отель «Тарханкут»', 'первая линия', 2500, 4.2, 'img7', 3]
            ];
            hotels.forEach(h => {
                db.run("INSERT INTO hotels (name, description, price_per_night, rating, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)", h);
            });
        }
    });
});

// ========== API МАРШРУТЫ ==========
app.get('/api/settings', (req, res) => {
    db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || {});
    });
});

app.get('/api/cities', (req, res) => {
    db.all("SELECT * FROM cities WHERE is_active = 1 ORDER BY name", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/places', (req, res) => {
    db.all("SELECT * FROM places ORDER BY sort_order", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/hotels', (req, res) => {
    db.all("SELECT * FROM hotels ORDER BY sort_order", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Главная: http://localhost:${PORT}`);
    console.log(`⚙️ Админка: http://localhost:${PORT}/admin`);
    console.log(`📁 Папка public: ${path.join(__dirname, 'public')}`);
    console.log(`📁 Папка admin: ${path.join(__dirname, 'admin')}`);
});