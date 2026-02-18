const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

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

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT,
        text TEXT,
        rating INTEGER,
        date TEXT
    )`);

    db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        if (row.count === 0) {
            db.run("INSERT INTO settings (site_name, main_city, phone, email) VALUES (?, ?, ?, ?)",
                ['Оленевка.Тур', 'Москва', '+7 (978) 000-00-00', 'info@olenevka.ru']);
        }
    });

    db.get("SELECT COUNT(*) as count FROM cities", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        if (row.count === 0) {
            const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Оленёк'];
            cities.forEach(city => {
                db.run("INSERT INTO cities (name) VALUES (?)", [city]);
            });
        }
    });

    db.get("SELECT COUNT(*) as count FROM places", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        if (row.count === 0) {
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
        if (err) {
            console.error(err);
            return;
        }
        if (row.count === 0) {
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

app.get('/api/reviews', (req, res) => {
    db.all("SELECT * FROM reviews ORDER BY date DESC LIMIT 5", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/admin/settings', (req, res) => {
    const { site_name, main_city, phone, email } = req.body;
    db.run(
        "UPDATE settings SET site_name = ?, main_city = ?, phone = ?, email = ? WHERE id = 1",
        [site_name, main_city, phone, email],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        }
    );
});

app.post('/api/admin/cities', (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO cities (name) VALUES (?)", [name], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/admin/cities/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM cities WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

app.post('/api/admin/places/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, price, image } = req.body;
    db.run(
        "UPDATE places SET name = ?, description = ?, price = ?, image = ? WHERE id = ?",
        [name, description, price, image, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        }
    );
});

app.post('/api/admin/hotels/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, price_per_night, rating, image } = req.body;
    db.run(
        "UPDATE hotels SET name = ?, description = ?, price_per_night = ?, rating = ?, image = ? WHERE id = ?",
        [name, description, price_per_night, rating, image, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        }
    );
});

app.post('/api/admin/reviews', (req, res) => {
    const { author, text, rating } = req.body;
    const date = new Date().toISOString().split('T')[0];
    db.run(
        "INSERT INTO reviews (author, text, rating, date) VALUES (?, ?, ?, ?)",
        [author, text, rating, date],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});