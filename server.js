const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middleware and static files
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Basic test route
app.get('/', (req, res) => res.render('index', { shortUrl: null }));

// Database setup
const db = new sqlite3.Database('./urls.db', (err) => {
  if (err) console.error(err);
  db.run("CREATE TABLE IF NOT EXISTS urls (id INTEGER PRIMARY KEY AUTOINCREMENT, short TEXT UNIQUE, original TEXT)");
});

// Generate short code
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// POST to shorten URL
app.post('/shorten', (req, res) => {
  const original = req.body.url;
  const short = generateShortCode();

  db.run("INSERT INTO urls (short, original) VALUES (?, ?)", [short, original], (err) => {
    if (err) return res.send("Error: " + err.message);
    res.render('index', { shortUrl: `${req.protocol}://${req.get('host')}/${short}` });
  });
});

// Redirect short URLs
app.get('/:short', (req, res) => {
  const short = req.params.short;
  db.get("SELECT original FROM urls WHERE short = ?", [short], (err, row) => {
    if (row) res.redirect(row.original);
    else res.send("URL not found!");
  });
});
