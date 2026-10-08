# Simple College Website

This project is a beginner-friendly college website built with Node.js, Express, SQLite, HTML, CSS, and JavaScript.

## What this project includes

- Public pages: Home, About, Faculties, Programs, Courses, Admissions, News, Events, Contact, Login
- Student login and admin login
- SQLite database
- Simple student dashboard and admin dashboard
- Course, news, and event management
- Application and contact forms
- Optional AI assistant that works only when configured

## 1. Install Node.js

If you do not have Node.js installed, download it from https://nodejs.org/

After installing, check it works:

```bash
node -v
npm -v
```

## 2. Open the project folder

Open your terminal in this folder.

## 3. Install dependencies

```bash
npm install
```

## 4. Create the environment file

Create a `.env` file in the project root.

You can copy the example file:

```bash
copy .env.example .env
```

Then edit `.env` and set a secret:

```env
SESSION_SECRET=your-random-secret
AI_API_KEY=
PORT=3000
```

Important:
- Put your API key in `.env`, not directly in HTML, CSS, or JavaScript.
- If you do not have an AI API key, leave `AI_API_KEY=` empty.

## 5. Start the server

```bash
npm start
```

The website will run at:

```text
http://localhost:3000
```

## 6. Demo login accounts

The database is created automatically when the app starts.

### Admin account
- Email: admin@college.edu
- Password: admin123

### Student account
- Email: student@college.edu
- Password: student123

## 7. How the database works

The app uses SQLite.

The database file is stored here:

```text
data/college.db
```

The app creates tables automatically when it starts if they do not exist.

Main tables:
- users
- students
- applications
- courses
- grades
- schedules
- news
- events
- contact_messages

## 8. How the login system works

- The login form asks for email and password.
- The password is never stored as plain text.
- The app uses `bcryptjs` to hash passwords.
- Express sessions keep the user logged in while the browser stays open.
- The app checks the user role before showing the student or admin dashboard.

## 9. How the AI assistant works

The AI helper is optional.

The website will still work normally even without an API key.

### Option A: external API key

Add your key to `.env`:

```env
AI_API_KEY=your_key_here
```

The app will try to use it.

### Option B: local AI (Ollama)

If you have Ollama installed locally, the app can also try a local model such as `llama3`.

The app checks for a local Ollama server at:

```text
http://localhost:11434
```

If no API key and no local AI are available, the app shows a clear message that the AI assistant is not configured.

## 10. Important files

- `server.js` — main Express server and database setup
- `public/index.html` — home page
- `public/about.html` — about page
- `public/faculties.html` — faculty information
- `public/programs.html` — program list
- `public/courses.html` — course page
- `public/admissions.html` — application form
- `public/news.html` — news list
- `public/events.html` — events list
- `public/contact.html` — contact form
- `public/login.html` — login page
- `public/student-dashboard.html` — student dashboard
- `public/admin-dashboard.html` — admin dashboard
- `public/css/style.css` — page styling
- `public/js/app.js` — browser logic for forms and dashboards
- `.env.example` — example environment file
- `data/college.db` — SQLite database file created automatically

## 11. Simple beginner notes

This project is intentionally simple.

It keeps the structure easy to understand:
- one server file
- a few pages
- a small SQLite database
- a straightforward login system

If you want to learn, start by reading:
1. `server.js`
2. `public/js/app.js`
3. `public/css/style.css`

## 12. Useful development tips

- If you change the app, restart the server using Ctrl+C and then `npm start`.
- If the database is empty, the app will create tables and insert sample data automatically.
- If a form fails, read the terminal output in the server window.
- If you want to add more courses, news, or events, use the admin dashboard.

## 13. Start learning next

If you want to modify the website yourself, learn these topics first:
- HTML basics
- CSS layout
- JavaScript fetch and form handling
- Express routes
- SQL and SQLite
- sessions and authentication

That is enough to understand and build a simple website like this.

## 14. Project status

This project is designed to work as a real, simple college website without overengineering.
