const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'college.db');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'college-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
    },
  })
);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database:', DB_PATH);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function setupDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      student_id TEXT,
      program TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      student_id TEXT UNIQUE,
      program TEXT,
      year INTEGER,
      phone TEXT,
      address TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      dob TEXT NOT NULL,
      address TEXT NOT NULL,
      previous_school TEXT NOT NULL,
      faculty TEXT NOT NULL,
      program TEXT NOT NULL,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'new'
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      program TEXT,
      instructor TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      course_name TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      image_url TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedDemoData();
}

async function seedDemoData() {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const studentPassword = bcrypt.hashSync('student123', 10);

  const userCountRow = await get('SELECT COUNT(*) AS total FROM users');
  if ((userCountRow?.total || 0) === 0) {
    await run(
      `INSERT INTO users (name, email, password, role, student_id, program) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Admin User', 'admin@college.edu', adminPassword, 'admin', 'ADM-1001', 'Administration']
    );

    await run(
      `INSERT INTO users (name, email, password, role, student_id, program) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Student User', 'student@college.edu', studentPassword, 'student', 'STU-1001', 'Computer Science']
    );
  }

  const studentUser = await get('SELECT * FROM users WHERE email = ?', ['student@college.edu']);
  if (studentUser) {
    const studentCountRow = await get('SELECT COUNT(*) AS total FROM students WHERE user_id = ?', [studentUser.id]);
    if ((studentCountRow?.total || 0) === 0) {
      await run(
        `INSERT INTO students (user_id, student_id, program, year, phone, address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [studentUser.id, studentUser.student_id, studentUser.program, 2, '+1234567890', '123 Academic Avenue']
      );
    }
  }

  const studentRecord = await get('SELECT * FROM students WHERE user_id = ?', [studentUser ? studentUser.id : 0]);
  if (studentRecord) {
    const gradeCountRow = await get('SELECT COUNT(*) AS total FROM grades WHERE student_id = ?', [studentRecord.id]);
    if ((gradeCountRow?.total || 0) === 0) {
      await run(`INSERT INTO grades (student_id, course_name, grade) VALUES (?, ?, ?)`, [studentRecord.id, 'Intro to Programming', 'A']);
      await run(`INSERT INTO grades (student_id, course_name, grade) VALUES (?, ?, ?)`, [studentRecord.id, 'Database Systems', 'A-']);
      await run(`INSERT INTO grades (student_id, course_name, grade) VALUES (?, ?, ?)`, [studentRecord.id, 'Web Development', 'B+']);
    }

    const scheduleCountRow = await get('SELECT COUNT(*) AS total FROM schedules WHERE student_id = ?', [studentRecord.id]);
    if ((scheduleCountRow?.total || 0) === 0) {
      await run(`INSERT INTO schedules (student_id, day, time, course_name) VALUES (?, ?, ?, ?)`, [studentRecord.id, 'Monday', '09:00 - 11:00', 'Intro to Programming']);
      await run(`INSERT INTO schedules (student_id, day, time, course_name) VALUES (?, ?, ?, ?)`, [studentRecord.id, 'Wednesday', '09:00 - 11:00', 'Database Systems']);
      await run(`INSERT INTO schedules (student_id, day, time, course_name) VALUES (?, ?, ?, ?)`, [studentRecord.id, 'Friday', '13:00 - 15:00', 'Web Development']);
    }
  }

  const courseCountRow = await get('SELECT COUNT(*) AS total FROM courses');
  if ((courseCountRow?.total || 0) === 0) {
    await run(`
      INSERT INTO courses (code, name, description, program, instructor) VALUES
      ('CS101', 'Intro to Programming', 'Learn the basics of logic, variables, and writing simple programs.', 'Computer Science', 'Dr. James Lee'),
      ('IT202', 'Database Systems', 'Understand data storage, SQL, and database design.', 'Information Technology', 'Prof. Sarah Green'),
      ('BUS110', 'Principles of Management', 'Study leadership, planning, and business operations.', 'Business Administration', 'Dr. Anita Brooks'),
      ('ENG210', 'Engineering Design', 'Apply design thinking to practical engineering problems.', 'Mechanical Engineering', 'Dr. Mark Taylor')
    `);
  }

  const newsCountRow = await get('SELECT COUNT(*) AS total FROM news');
  if ((newsCountRow?.total || 0) === 0) {
    await run(`
      INSERT INTO news (title, description, date, image_url) VALUES
      ('New STEM Lab Opened', 'Students now have access to improved laboratory equipment for engineering and computing projects.', '2026-10-01', ''),
      ('Scholarship Applications Open', 'The college has announced new scholarships for first-year and transfer students.', '2026-09-20', ''),
      ('Campus Career Week Begins', 'Meet employers and learn about opportunities in health, business, and technology.', '2026-09-10', '')
    `);
  }

  const eventCountRow = await get('SELECT COUNT(*) AS total FROM events');
  if ((eventCountRow?.total || 0) === 0) {
    await run(`
      INSERT INTO events (name, description, date, location) VALUES
      ('Open Day 2026', 'Meet faculty members, tour the campus, and learn about admissions and programs.', '2026-11-05', 'Main Campus Hall'),
      ('Tech Innovation Expo', 'Students showcase innovative projects and startup ideas.', '2026-11-18', 'Innovation Center'),
      ('Career Skills Workshop', 'A practical workshop on resume writing, interviews, and communication.', '2026-12-02', 'Business Block')
    `);
  }
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function requireRole(role) {
  return function (req, res, next) {
    if (!req.session.user || req.session.user.role !== role) {
      return res.redirect('/login');
    }
    next();
  };
}

app.get('/api/session', (req, res) => {
  if (!req.session.userId || !req.session.user) {
    return res.json({ loggedIn: false });
  }

  res.json({
    loggedIn: true,
    user: {
      id: req.session.user.id,
      name: req.session.user.name,
      email: req.session.user.email,
      role: req.session.user.role,
    },
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
    res.json({ success: true, redirect: redirectPath, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/faculties', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faculties.html'));
});

app.get('/programs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'programs.html'));
});

app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'courses.html'));
});

app.get('/admissions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admissions.html'));
});

app.get('/news', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'news.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'events.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin-dashboard');
    return res.redirect('/student-dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/student-dashboard', requireLogin, requireRole('student'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

app.get('/admin-dashboard', requireLogin, requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/api/courses', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM courses ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error loading courses:', error);
    res.status(500).json({ message: 'Could not load courses.' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM news ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error loading news:', error);
    res.status(500).json({ message: 'Could not load news.' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM events ORDER BY date ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error loading events:', error);
    res.status(500).json({ message: 'Could not load events.' });
  }
});

app.post('/api/admissions', async (req, res) => {
  try {
    const requiredFields = ['full_name', 'email', 'phone', 'dob', 'address', 'previous_school', 'faculty', 'program'];
    const missing = requiredFields.filter((field) => !String(req.body[field] || '').trim());

    if (missing.length > 0) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const values = [
      req.body.full_name,
      req.body.email,
      req.body.phone,
      req.body.dob,
      req.body.address,
      req.body.previous_school,
      req.body.faculty,
      req.body.program,
    ];

    await run(
      `INSERT INTO applications (full_name, email, phone, dob, address, previous_school, faculty, program)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );

    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Admission error:', error);
    res.status(500).json({ message: 'Could not submit your application. Please try again.' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const missing = requiredFields.filter((field) => !String(req.body[field] || '').trim());

    if (missing.length > 0) {
      return res.status(400).json({ message: 'Please complete the contact form completely.' });
    }

    await run(
      `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      [req.body.name, req.body.email, req.body.subject, req.body.message]
    );

    res.status(201).json({ message: 'Your message has been sent successfully.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Could not send your message. Please try again.' });
  }
});

app.get('/api/student-profile', requireLogin, requireRole('student'), async (req, res) => {
  try {
    const user = req.session.user;
    const student = await get(
      `SELECT s.*, u.name, u.email, u.student_id, u.program
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE u.id = ?`,
      [user.id]
    );

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const grades = await all('SELECT course_name, grade FROM grades WHERE student_id = ?', [student.id]);
    const schedule = await all('SELECT day, time, course_name FROM schedules WHERE student_id = ?', [student.id]);

    res.json({
      name: student.name,
      student_id: student.student_id,
      program: student.program,
      year: student.year,
      courses: grades,
      grades,
      schedule,
      announcements: [
        'New scholarship application deadline is Friday.',
        'Career services office is hosting a workshop next week.',
        'Library access hours have been extended for exam week.',
      ],
    });
  } catch (error) {
    console.error('Student profile error:', error);
    res.status(500).json({ message: 'Could not load student dashboard data.' });
  }
});

app.get('/api/admin-data', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const students = await all(
      `SELECT u.id, u.name, u.email, u.student_id, u.program
       FROM users u
       WHERE u.role = 'student'
       ORDER BY u.id ASC`
    );

    const applications = await all('SELECT * FROM applications ORDER BY id DESC');
    const messages = await all('SELECT * FROM contact_messages ORDER BY id DESC');
    const courses = await all('SELECT * FROM courses ORDER BY id DESC');
    const news = await all('SELECT * FROM news ORDER BY date DESC');
    const events = await all('SELECT * FROM events ORDER BY date ASC');

    res.json({ students, applications, messages, courses, news, events });
  } catch (error) {
    console.error('Admin data error:', error);
    res.status(500).json({ message: 'Could not load admin data.' });
  }
});

app.post('/api/admin/courses', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const { code, name, description, program, instructor } = req.body;
    if (!code || !name || !program) {
      return res.status(400).json({ message: 'Course code, name, and program are required.' });
    }

    await run(
      `INSERT INTO courses (code, name, description, program, instructor) VALUES (?, ?, ?, ?, ?)`,
      [code, name, description || '', program, instructor || '']
    );

    res.status(201).json({ message: 'Course added successfully.' });
  } catch (error) {
    console.error('Add course error:', error);
    res.status(500).json({ message: 'Could not add course.' });
  }
});

app.put('/api/admin/courses/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const { code, name, description, program, instructor } = req.body;
    await run(
      `UPDATE courses SET code = ?, name = ?, description = ?, program = ?, instructor = ? WHERE id = ?`,
      [code, name, description || '', program, instructor || '', req.params.id]
    );
    res.json({ message: 'Course updated successfully.' });
  } catch (error) {
    console.error('Edit course error:', error);
    res.status(500).json({ message: 'Could not update course.' });
  }
});

app.delete('/api/admin/courses/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    await run('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Could not delete course.' });
  }
});

app.post('/api/admin/news', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const { title, description, date, image_url } = req.body;
    if (!title || !description || !date) {
      return res.status(400).json({ message: 'Title, description, and date are required.' });
    }

    await run(
      `INSERT INTO news (title, description, date, image_url) VALUES (?, ?, ?, ?)`,
      [title, description, date, image_url || '']
    );

    res.status(201).json({ message: 'News item added successfully.' });
  } catch (error) {
    console.error('Add news error:', error);
    res.status(500).json({ message: 'Could not add news item.' });
  }
});

app.put('/api/admin/news/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const { title, description, date, image_url } = req.body;
    await run(
      `UPDATE news SET title = ?, description = ?, date = ?, image_url = ? WHERE id = ?`,
      [title, description, date, image_url || '', req.params.id]
    );
    res.json({ message: 'News item updated successfully.' });
  } catch (error) {
    console.error('Edit news error:', error);
    res.status(500).json({ message: 'Could not update news item.' });
  }
});

app.delete('/api/admin/news/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    await run('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.json({ message: 'News item deleted successfully.' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ message: 'Could not delete news item.' });
  }
});

app.post('/api/admin/events', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, date, location } = req.body;
    if (!name || !description || !date || !location) {
      return res.status(400).json({ message: 'All event fields are required.' });
    }

    await run(
      `INSERT INTO events (name, description, date, location) VALUES (?, ?, ?, ?)`,
      [name, description, date, location]
    );

    res.status(201).json({ message: 'Event added successfully.' });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ message: 'Could not add event.' });
  }
});

app.put('/api/admin/events/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, date, location } = req.body;
    await run(
      `UPDATE events SET name = ?, description = ?, date = ?, location = ? WHERE id = ?`,
      [name, description, date, location, req.params.id]
    );
    res.json({ message: 'Event updated successfully.' });
  } catch (error) {
    console.error('Edit event error:', error);
    res.status(500).json({ message: 'Could not update event.' });
  }
});

app.delete('/api/admin/events/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    await run('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Could not delete event.' });
  }
});

async function getLocalAiAnswer(question) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `Use only this college information:\n- Programs: Computer Science, Information Technology, Business Administration, Mechanical Engineering, Electrical Engineering.\n- Faculties: Engineering, Computer Science, Business, Medicine.\n- Admission requirements: application form, transcript, personal details, previous school, and faculty/program choice.\n- Contact: admissions@college.edu or campus office.\nQuestion: ${question}`,
        stream: false,
      }),
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json.response ? String(json.response).trim() : null;
  } catch (error) {
    return null;
  }
}

async function getExternalAiAnswer(question) {
  if (!process.env.AI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful college assistant. Answer brief, general college questions using only the provided information.',
          },
          {
            role: 'user',
            content: `Programs: Computer Science, Information Technology, Business Administration, Mechanical Engineering, Electrical Engineering. Faculties: Engineering, Computer Science, Business, Medicine. Admission requirements: application form, transcript, previous school, and faculty/program choice. Contact: admissions@college.edu. Question: ${question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return json.choices && json.choices[0] ? json.choices[0].message.content.trim() : null;
  } catch (error) {
    return null;
  }
}

app.post('/api/ai', async (req, res) => {
  const question = String(req.body.question || '').trim();

  if (!question) {
    return res.status(400).json({ answer: 'Please ask a question first.' });
  }

  const localResult = await getLocalAiAnswer(question);
  if (localResult) {
    return res.json({ answer: localResult });
  }

  const externalResult = await getExternalAiAnswer(question);
  if (externalResult) {
    return res.json({ answer: externalResult });
  }

  res.json({
    answer:
      'The AI assistant is not currently configured. Add an API key in the .env file or run a local AI service such as Ollama to enable this feature.',
  });
});

app.use(express.static(path.join(__dirname, 'public')));

setupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`College website running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
