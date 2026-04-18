import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Create placeholder images if they don't exist
const createPlaceholder = (name: string, text: string, color: string) => {
  const filePath = path.join(uploadDir, name);
  if (!fs.existsSync(filePath)) {
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">${text}</text>
      </svg>
    `;
    fs.writeFileSync(filePath, svg);
  }
};

createPlaceholder('placeholder-teacher.svg', 'Teacher Photo', '#2563eb'); // Blue-600
createPlaceholder('placeholder-news.svg', 'News Image', '#1d4ed8'); // Blue-700


// Database Setup
const db = new Database('school.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    position TEXT,
    photoUrl TEXT
  );
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    imageUrl TEXT,
    date TEXT,
    author TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT,
    value TEXT,
    icon TEXT
  );
`);

// Seed Admin if not exists
const adminCheck = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!adminCheck) {
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'admin123');
}

// Seed Settings if not exists
const schoolNameCheck = db.prepare("SELECT * FROM settings WHERE key = 'school_name'").get();
if (!schoolNameCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('school_name', 'SD Harapan Bangsa');
}
const heroImageCheck = db.prepare("SELECT * FROM settings WHERE key = 'hero_image'").get();
if (!heroImageCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('hero_image', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80');
}
const visiCheck = db.prepare("SELECT * FROM settings WHERE key = 'visi'").get();
if (!visiCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('visi', 'Terwujudnya peserta didik yang beriman, cerdas, terampil, mandiri, dan berwawasan global.');
}
const misiCheck = db.prepare("SELECT * FROM settings WHERE key = 'misi'").get();
if (!misiCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('misi', JSON.stringify([
    'Melaksanakan pembelajaran yang aktif, kreatif, dan menyenangkan.',
    'Menanamkan nilai-nilai keimanan dan ketaqwaan.',
    'Mengembangkan bakat dan minat siswa melalui ekstrakurikuler.',
    'Mewujudkan lingkungan sekolah yang bersih dan asri.'
  ]));
}
const registrationLinkCheck = db.prepare("SELECT * FROM settings WHERE key = 'registration_link'").get();
if (!registrationLinkCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('registration_link', '#');
}
const contactAddressCheck = db.prepare("SELECT * FROM settings WHERE key = 'contact_address'").get();
if (!contactAddressCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('contact_address', 'Jl. Pendidikan No. 123, Jakarta Selatan, DKI Jakarta 12345');
}
const contactPhoneCheck = db.prepare("SELECT * FROM settings WHERE key = 'contact_phone'").get();
if (!contactPhoneCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('contact_phone', '(021) 1234-5678');
}
const contactEmailCheck = db.prepare("SELECT * FROM settings WHERE key = 'contact_email'").get();
if (!contactEmailCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('contact_email', 'info@sdharapanbangsa.sch.id');
}
const socialFacebookCheck = db.prepare("SELECT * FROM settings WHERE key = 'social_facebook'").get();
if (!socialFacebookCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('social_facebook', '#');
}
const socialInstagramCheck = db.prepare("SELECT * FROM settings WHERE key = 'social_instagram'").get();
if (!socialInstagramCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('social_instagram', '#');
}
const socialTwitterCheck = db.prepare("SELECT * FROM settings WHERE key = 'social_twitter'").get();
if (!socialTwitterCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('social_twitter', '#');
}
const socialLinkedinCheck = db.prepare("SELECT * FROM settings WHERE key = 'social_linkedin'").get();
if (!socialLinkedinCheck) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('social_linkedin', '#');
}

// Seed Initial Data if empty
const statsCheck = db.prepare('SELECT count(*) as count FROM stats').get() as { count: number };
if (statsCheck.count === 0) {
  const insertStat = db.prepare('INSERT INTO stats (label, value, icon) VALUES (?, ?, ?)');
  insertStat.run('Siswa', '450+', '🎓');
  insertStat.run('Guru', '32', '👩‍🏫');
  insertStat.run('Kelas', '18', '🏫');
  insertStat.run('Prestasi', '120+', '🏆');
}

const teacherCheck = db.prepare('SELECT count(*) as count FROM teachers').get() as { count: number };
if (teacherCheck.count === 0) {
  const insertTeacher = db.prepare('INSERT INTO teachers (name, position, photoUrl) VALUES (?, ?, ?)');
  insertTeacher.run('Budi Santoso', 'Kepala Sekolah', '/uploads/placeholder-teacher.svg');
  insertTeacher.run('Siti Aminah', 'Guru Matematika', '/uploads/placeholder-teacher.svg');
  insertTeacher.run('Ahmad Rizki', 'Guru Olahraga', '/uploads/placeholder-teacher.svg');
}

const articleCheck = db.prepare('SELECT count(*) as count FROM articles').get() as { count: number };
if (articleCheck.count === 0) {
  const insertArticle = db.prepare('INSERT INTO articles (title, content, imageUrl, date, author) VALUES (?, ?, ?, ?, ?)');
  insertArticle.run(
    'Penerimaan Siswa Baru 2024',
    'SD Harapan Bangsa membuka pendaftaran siswa baru untuk tahun ajaran 2024/2025. Segera daftarkan putra-putri Anda!',
    '/uploads/placeholder-news.svg',
    new Date().toISOString().split('T')[0],
    'Admin'
  );
  insertArticle.run(
    'Juara 1 Lomba Cerdas Cermat',
    'Selamat kepada tim cerdas cermat SD Harapan Bangsa yang telah meraih juara 1 tingkat kecamatan.',
    '/uploads/placeholder-news.svg',
    new Date().toISOString().split('T')[0],
    'Admin'
  );
}

// Fix placeholder extensions if they are wrong (Migration)
db.prepare("UPDATE teachers SET photoUrl = REPLACE(photoUrl, '.jpg', '.svg') WHERE photoUrl LIKE '%placeholder-teacher.jpg'").run();
db.prepare("UPDATE articles SET imageUrl = REPLACE(imageUrl, '.jpg', '.svg') WHERE imageUrl LIKE '%placeholder-news.jpg'").run();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, token: 'dummy-token' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  app.get('/api/teachers', (req, res) => {
    const teachers = db.prepare('SELECT * FROM teachers').all();
    res.json(teachers);
  });

  app.post('/api/teachers', upload.single('photo'), (req, res) => {
    const { name, position } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder-teacher.svg';
    const result = db.prepare('INSERT INTO teachers (name, position, photoUrl) VALUES (?, ?, ?)').run(name, position, photoUrl);
    res.json({ id: result.lastInsertRowid, name, position, photoUrl });
  });

  app.put('/api/teachers/:id', upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const { name, position } = req.body;
    
    let query = 'UPDATE teachers SET name = ?, position = ?';
    let params = [name, position];

    if (req.file) {
        query += ', photoUrl = ?';
        params.push(`/uploads/${req.file.filename}`);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.delete('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/articles', (req, res) => {
    const articles = db.prepare('SELECT * FROM articles ORDER BY id DESC').all();
    res.json(articles);
  });

  app.post('/api/articles', upload.single('image'), (req, res) => {
    const { title, content, author } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder-news.svg';
    const date = new Date().toISOString().split('T')[0];
    const result = db.prepare('INSERT INTO articles (title, content, imageUrl, date, author) VALUES (?, ?, ?, ?, ?)').run(title, content, imageUrl, date, author);
    res.json({ id: result.lastInsertRowid, title, content, imageUrl, date, author });
  });

   app.delete('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj: any = {};
    settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  });

  app.put('/api/settings', (req, res) => {
    const { key, value } = req.body;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    res.json({ success: true });
  });

  app.get('/api/stats', (req, res) => {
    const stats = db.prepare('SELECT * FROM stats').all();
    res.json(stats);
  });

  app.put('/api/stats/:id', (req, res) => {
    const { id } = req.params;
    const { label, value, icon } = req.body;
    db.prepare('UPDATE stats SET label = ?, value = ?, icon = ? WHERE id = ?').run(label, value, icon, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built assets (if we were building)
    // For this environment, we mostly rely on dev mode or static serving
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
