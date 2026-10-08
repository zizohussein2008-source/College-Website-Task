document.addEventListener('DOMContentLoaded', () => {
  setupSessionLinks();

  const page = getCurrentPage();

  if (page === 'index.html' || page === '/') {
    loadHomePage();
  }

  if (page === 'courses.html' || page === '/courses') {
    renderCoursesPage();
  }

  if (page === 'news.html' || page === '/news') {
    renderNewsPage();
  }

  if (page === 'events.html' || page === '/events') {
    renderEventsPage();
  }

  const admissionForm = document.getElementById('admission-form');
  if (admissionForm) {
    admissionForm.addEventListener('submit', handleAdmissionSubmit);
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  const aiForm = document.getElementById('ai-form');
  if (aiForm) {
    aiForm.addEventListener('submit', handleAiSubmit);
  }

  if (page === 'student-dashboard.html' || page === '/student-dashboard') {
    loadStudentDashboard();
  }

  if (page === 'admin-dashboard.html' || page === '/admin-dashboard') {
    loadAdminDashboard();
  }
});

function getCurrentPage() {
  const path = window.location.pathname;
  return path === '/' ? '/' : path.split('/').pop();
}

async function setupSessionLinks() {
  try {
    const response = await fetch('/api/session');
    const data = await response.json();

    const loginLink = document.getElementById('login-link');
    const authBlock = document.getElementById('auth-block');

    if (!loginLink && !authBlock) {
      return;
    }

    if (data.loggedIn && data.user) {
      const dashboardLink = data.user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
      const label = data.user.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard';

      if (loginLink) {
        loginLink.href = dashboardLink;
        loginLink.textContent = label;
      }

      if (authBlock) {
        authBlock.innerHTML = `
          <span>Hello, ${data.user.name}</span>
          <a href="${dashboardLink}" class="btn btn-light">Dashboard</a>
          <a href="/logout" class="btn btn-secondary">Logout</a>
        `;
      }
    } else {
      if (loginLink) {
        loginLink.href = '/login';
        loginLink.textContent = 'Login';
      }

      if (authBlock) {
        authBlock.innerHTML = '<a href="/login" class="btn btn-primary">Login</a>';
      }
    }
  } catch (error) {
    console.error('Session check failed:', error);
  }
}

async function loadHomePage() {
  const latestNews = document.getElementById('latest-news');
  const upcomingEvents = document.getElementById('upcoming-events');

  if (!latestNews && !upcomingEvents) {
    return;
  }

  try {
    const [newsResponse, eventsResponse] = await Promise.all([
      fetch('/api/news'),
      fetch('/api/events'),
    ]);

    const news = await newsResponse.json();
    const events = await eventsResponse.json();

    if (latestNews) {
      latestNews.innerHTML = (news.slice(0, 3).map((item) => `
        <div class="card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <small>${escapeHtml(item.date)}</small>
        </div>
      `).join('') || '<div class="empty-box">No news available yet.</div>');
    }

    if (upcomingEvents) {
      upcomingEvents.innerHTML = (events.slice(0, 3).map((item) => `
        <div class="card">
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <small>${escapeHtml(item.date)} • ${escapeHtml(item.location)}</small>
        </div>
      `).join('') || '<div class="empty-box">No events scheduled yet.</div>');
    }
  } catch (error) {
    console.error('Home page data failed to load:', error);
  }
}

async function renderCoursesPage() {
  const container = document.getElementById('course-list');
  if (!container) return;

  try {
    const response = await fetch('/api/courses');
    const courses = await response.json();

    if (!courses.length) {
      container.innerHTML = '<div class="empty-box">No courses available right now.</div>';
      return;
    }

    container.innerHTML = courses.map((course) => `
      <div class="card">
        <p class="status">${escapeHtml(course.code)}</p>
        <h3>${escapeHtml(course.name)}</h3>
        <p>${escapeHtml(course.description || 'No description provided.')}</p>
        <ul class="info-list">
          <li><strong>Program:</strong> ${escapeHtml(course.program || 'General')}</li>
          <li><strong>Instructor:</strong> ${escapeHtml(course.instructor || 'To be assigned')}</li>
        </ul>
      </div>
    `).join('');
  } catch (error) {
    console.error('Could not load courses:', error);
    container.innerHTML = '<div class="empty-box">Failed to load courses.</div>';
  }
}

async function renderNewsPage() {
  const container = document.getElementById('news-list');
  if (!container) return;

  try {
    const response = await fetch('/api/news');
    const news = await response.json();

    if (!news.length) {
      container.innerHTML = '<div class="empty-box">No news items yet.</div>';
      return;
    }

    container.innerHTML = news.map((item) => `
      <div class="card">
        <h3>${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.date)}</strong></p>
        <p>${escapeHtml(item.description)}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Could not load news:', error);
    container.innerHTML = '<div class="empty-box">Failed to load news.</div>';
  }
}

async function renderEventsPage() {
  const container = document.getElementById('event-list');
  if (!container) return;

  try {
    const response = await fetch('/api/events');
    const events = await response.json();

    if (!events.length) {
      container.innerHTML = '<div class="empty-box">No events available yet.</div>';
      return;
    }

    container.innerHTML = events.map((event) => `
      <div class="card">
        <h3>${escapeHtml(event.name)}</h3>
        <p><strong>${escapeHtml(event.date)}</strong></p>
        <p>${escapeHtml(event.description)}</p>
        <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Could not load events:', error);
    container.innerHTML = '<div class="empty-box">Failed to load events.</div>';
  }
}

async function handleAdmissionSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const message = form.querySelector('.message');
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  try {
    const response = await fetch('/api/admissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      showMessage(message, result.message || 'Please fix the form.', 'error');
      return;
    }

    form.reset();
    showMessage(message, result.message || 'Application submitted.', 'success');
  } catch (error) {
    showMessage(message, 'Could not submit application right now.', 'error');
  }
}

async function handleContactSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const message = form.querySelector('.message');
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      showMessage(message, result.message || 'Please check your message.', 'error');
      return;
    }

    form.reset();
    showMessage(message, result.message || 'Message sent successfully.', 'success');
  } catch (error) {
    showMessage(message, 'We could not send your message right now.', 'error');
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const message = form.querySelector('.message');
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      showMessage(message, result.message || 'Login failed.', 'error');
      return;
    }

    window.location.href = result.redirect;
  } catch (error) {
    showMessage(message, 'The login request failed.', 'error');
  }
}

async function handleAiSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const question = form.querySelector('input[name="question"]');
  const output = document.getElementById('ai-answer');

  if (!question || !output) return;

  const value = question.value.trim();
  if (!value) {
    output.textContent = 'Please type a question first.';
    return;
  }

  output.textContent = 'Thinking...';

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: value }),
    });

    const result = await response.json();
    output.textContent = result.answer || 'No answer available.';
  } catch (error) {
    output.textContent = 'The AI assistant is not available right now.';
  }
}

async function loadStudentDashboard() {
  const dashboard = document.getElementById('student-dashboard-content');
  if (!dashboard) return;

  try {
    const sessionResponse = await fetch('/api/session');
    const session = await sessionResponse.json();

    if (!session.loggedIn || session.user.role !== 'student') {
      dashboard.innerHTML = '<div class="empty-box">Please log in to view your student dashboard.</div>';
      return;
    }

    const profileResponse = await fetch('/api/student-profile');
    const profile = await profileResponse.json();

    dashboard.innerHTML = `
      <div class="dashboard-grid">
        <div class="stat-box">
          <h3>Student Details</h3>
          <p><strong>Name:</strong> ${escapeHtml(profile.name)}</p>
          <p><strong>Student ID:</strong> ${escapeHtml(profile.student_id)}</p>
          <p><strong>Program:</strong> ${escapeHtml(profile.program)}</p>
          <p><strong>Year:</strong> ${escapeHtml(String(profile.year || ''))}</p>
        </div>
        <div class="stat-box">
          <h3>Announcements</h3>
          <ul class="info-list">
            ${(profile.announcements || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="section">
        <h3>Courses and Grades</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Course</th><th>Grade</th></tr>
            </thead>
            <tbody>
              ${(profile.grades || []).map((item) => `<tr><td>${escapeHtml(item.course_name)}</td><td>${escapeHtml(item.grade)}</td></tr>`).join('') || '<tr><td colspan="2">No grades available.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <h3>Schedule</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Day</th><th>Time</th><th>Course</th></tr>
            </thead>
            <tbody>
              ${(profile.schedule || []).map((item) => `<tr><td>${escapeHtml(item.day)}</td><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.course_name)}</td></tr>`).join('') || '<tr><td colspan="3">No schedule available.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Student dashboard failed:', error);
    dashboard.innerHTML = '<div class="empty-box">Could not load student dashboard data.</div>';
  }
}

async function loadAdminDashboard() {
  const dashboard = document.getElementById('admin-dashboard-content');
  if (!dashboard) return;

  try {
    const sessionResponse = await fetch('/api/session');
    const session = await sessionResponse.json();

    if (!session.loggedIn || session.user.role !== 'admin') {
      dashboard.innerHTML = '<div class="empty-box">Please log in as an administrator.</div>';
      return;
    }

    const dataResponse = await fetch('/api/admin-data');
    const data = await dataResponse.json();

    dashboard.innerHTML = `
      <div class="dashboard-grid">
        <div class="stat-box"><h3>Students</h3><strong>${data.students.length}</strong></div>
        <div class="stat-box"><h3>Applications</h3><strong>${data.applications.length}</strong></div>
        <div class="stat-box"><h3>Messages</h3><strong>${data.messages.length}</strong></div>
        <div class="stat-box"><h3>Courses</h3><strong>${data.courses.length}</strong></div>
      </div>

      <div class="section">
        <h3>Students</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Student ID</th><th>Program</th></tr></thead>
            <tbody>
              ${(data.students || []).map((student) => `<tr><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.email)}</td><td>${escapeHtml(student.student_id || '')}</td><td>${escapeHtml(student.program || '')}</td></tr>`).join('') || '<tr><td colspan="4">No students yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <h3>Applications</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Faculty</th><th>Program</th></tr></thead>
            <tbody>
              ${(data.applications || []).map((item) => `<tr><td>${escapeHtml(item.full_name)}</td><td>${escapeHtml(item.email)}</td><td>${escapeHtml(item.faculty)}</td><td>${escapeHtml(item.program)}</td></tr>`).join('') || '<tr><td colspan="4">No applications yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <h3>Contact Messages</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Subject</th></tr></thead>
            <tbody>
              ${(data.messages || []).map((message) => `<tr><td>${escapeHtml(message.name)}</td><td>${escapeHtml(message.email)}</td><td>${escapeHtml(message.subject)}</td></tr>`).join('') || '<tr><td colspan="3">No messages received.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <h3>Manage Courses</h3>
        <form id="course-form" class="form-wrap">
          <input type="hidden" name="course_id" id="course_id">
          <div class="two-column">
            <div class="form-group"><label>Code</label><input name="code" id="course_code" required></div>
            <div class="form-group"><label>Name</label><input name="name" id="course_name" required></div>
          </div>
          <div class="form-group"><label>Description</label><textarea name="description" id="course_description"></textarea></div>
          <div class="two-column">
            <div class="form-group"><label>Program</label><input name="program" id="course_program" required></div>
            <div class="form-group"><label>Instructor</label><input name="instructor" id="course_instructor"></div>
          </div>
          <button type="submit" class="btn btn-primary">Save Course</button>
          <button type="button" class="btn btn-light" id="reset-course-form">Clear</button>
          <div class="message"></div>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Program</th><th>Action</th></tr></thead>
            <tbody id="course-table-body">
              ${(data.courses || []).map((course) => `<tr><td>${escapeHtml(course.code)}</td><td>${escapeHtml(course.name)}</td><td>${escapeHtml(course.program)}</td><td><button class="btn btn-light edit-course" data-id="${course.id}">Edit</button> <button class="btn btn-danger delete-course" data-id="${course.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="4">No courses available.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <h3>Manage News</h3>
        <form id="news-form" class="form-wrap">
          <input type="hidden" name="news_id" id="news_id">
          <div class="form-group"><label>Title</label><input name="title" id="news_title" required></div>
          <div class="form-group"><label>Description</label><textarea name="description" id="news_description" required></textarea></div>
          <div class="two-column">
            <div class="form-group"><label>Date</label><input type="date" name="date" id="news_date" required></div>
            <div class="form-group"><label>Image URL</label><input name="image_url" id="news_image_url"></div>
          </div>
          <button type="submit" class="btn btn-primary">Save News</button>
          <button type="button" class="btn btn-light" id="reset-news-form">Clear</button>
          <div class="message"></div>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Date</th><th>Action</th></tr></thead>
            <tbody id="news-table-body">
              ${(data.news || []).map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.date)}</td><td><button class="btn btn-light edit-news" data-id="${item.id}">Edit</button> <button class="btn btn-danger delete-news" data-id="${item.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="3">No news yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <h3>Manage Events</h3>
        <form id="event-form" class="form-wrap">
          <input type="hidden" name="event_id" id="event_id">
          <div class="form-group"><label>Event Name</label><input name="name" id="event_name" required></div>
          <div class="form-group"><label>Description</label><textarea name="description" id="event_description" required></textarea></div>
          <div class="two-column">
            <div class="form-group"><label>Date</label><input type="date" name="date" id="event_date" required></div>
            <div class="form-group"><label>Location</label><input name="location" id="event_location" required></div>
          </div>
          <button type="submit" class="btn btn-primary">Save Event</button>
          <button type="button" class="btn btn-light" id="reset-event-form">Clear</button>
          <div class="message"></div>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Date</th><th>Location</th><th>Action</th></tr></thead>
            <tbody id="event-table-body">
              ${(data.events || []).map((event) => `<tr><td>${escapeHtml(event.name)}</td><td>${escapeHtml(event.date)}</td><td>${escapeHtml(event.location)}</td><td><button class="btn btn-light edit-event" data-id="${event.id}">Edit</button> <button class="btn btn-danger delete-event" data-id="${event.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="4">No events yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    setupAdminForms();
  } catch (error) {
    console.error('Admin dashboard failed:', error);
    dashboard.innerHTML = '<div class="empty-box">Could not load admin dashboard.</div>';
  }
}

function setupAdminForms() {
  const courseForm = document.getElementById('course-form');
  if (courseForm) {
    courseForm.addEventListener('submit', handleCourseFormSubmit);
  }

  const newsForm = document.getElementById('news-form');
  if (newsForm) {
    newsForm.addEventListener('submit', handleNewsFormSubmit);
  }

  const eventForm = document.getElementById('event-form');
  if (eventForm) {
    eventForm.addEventListener('submit', handleEventFormSubmit);
  }

  document.querySelectorAll('.edit-course').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const response = await fetch('/api/admin-data');
      const data = await response.json();
      const course = data.courses.find((item) => String(item.id) === String(id));
      if (!course) return;
      fillCourseForm(course);
    });
  });

  document.querySelectorAll('.delete-course').forEach((button) => {
    button.addEventListener('click', () => deleteItem('/api/admin/courses/', button.getAttribute('data-id'), 'course'));
  });

  document.querySelectorAll('.edit-news').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const response = await fetch('/api/admin-data');
      const data = await response.json();
      const item = data.news.find((entry) => String(entry.id) === String(id));
      if (!item) return;
      fillNewsForm(item);
    });
  });

  document.querySelectorAll('.delete-news').forEach((button) => {
    button.addEventListener('click', () => deleteItem('/api/admin/news/', button.getAttribute('data-id'), 'news'));
  });

  document.querySelectorAll('.edit-event').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const response = await fetch('/api/admin-data');
      const data = await response.json();
      const item = data.events.find((entry) => String(entry.id) === String(id));
      if (!item) return;
      fillEventForm(item);
    });
  });

  document.querySelectorAll('.delete-event').forEach((button) => {
    button.addEventListener('click', () => deleteItem('/api/admin/events/', button.getAttribute('data-id'), 'event'));
  });

  const resetCourse = document.getElementById('reset-course-form');
  if (resetCourse) {
    resetCourse.addEventListener('click', () => {
      document.getElementById('course-form').reset();
      document.getElementById('course_id').value = '';
    });
  }

  const resetNews = document.getElementById('reset-news-form');
  if (resetNews) {
    resetNews.addEventListener('click', () => {
      document.getElementById('news-form').reset();
      document.getElementById('news_id').value = '';
    });
  }

  const resetEvent = document.getElementById('reset-event-form');
  if (resetEvent) {
    resetEvent.addEventListener('click', () => {
      document.getElementById('event-form').reset();
      document.getElementById('event_id').value = '';
    });
  }
}

async function handleCourseFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const message = form.querySelector('.message');
  const data = Object.fromEntries(new FormData(form).entries());
  const id = form.querySelector('#course_id').value;

  try {
    const response = await fetch(`/api/admin/courses${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      showMessage(message, result.message || 'Course save failed.', 'error');
      return;
    }

    form.reset();
    form.querySelector('#course_id').value = '';
    showMessage(message, result.message || 'Course saved.', 'success');
    setTimeout(() => window.location.reload(), 600);
  } catch (error) {
    showMessage(message, 'Could not save the course.', 'error');
  }
}

async function handleNewsFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const message = form.querySelector('.message');
  const data = Object.fromEntries(new FormData(form).entries());
  const id = form.querySelector('#news_id').value;

  try {
    const response = await fetch(`/api/admin/news${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      showMessage(message, result.message || 'News item save failed.', 'error');
      return;
    }

    form.reset();
    form.querySelector('#news_id').value = '';
    showMessage(message, result.message || 'News item saved.', 'success');
    setTimeout(() => window.location.reload(), 600);
  } catch (error) {
    showMessage(message, 'Could not save the news item.', 'error');
  }
}

async function handleEventFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const message = form.querySelector('.message');
  const data = Object.fromEntries(new FormData(form).entries());
  const id = form.querySelector('#event_id').value;

  try {
    const response = await fetch(`/api/admin/events${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      showMessage(message, result.message || 'Event save failed.', 'error');
      return;
    }

    form.reset();
    form.querySelector('#event_id').value = '';
    showMessage(message, result.message || 'Event saved.', 'success');
    setTimeout(() => window.location.reload(), 600);
  } catch (error) {
    showMessage(message, 'Could not save the event.', 'error');
  }
}

async function deleteItem(url, id, type) {
  if (!id || !window.confirm(`Delete this ${type}?`)) {
    return;
  }

  try {
    const response = await fetch(`${url}${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      alert(result.message || 'Delete failed.');
      return;
    }
    window.location.reload();
  } catch (error) {
    alert('Delete request failed.');
  }
}

function fillCourseForm(course) {
  document.getElementById('course_id').value = course.id;
  document.getElementById('course_code').value = course.code || '';
  document.getElementById('course_name').value = course.name || '';
  document.getElementById('course_description').value = course.description || '';
  document.getElementById('course_program').value = course.program || '';
  document.getElementById('course_instructor').value = course.instructor || '';
}

function fillNewsForm(item) {
  document.getElementById('news_id').value = item.id;
  document.getElementById('news_title').value = item.title || '';
  document.getElementById('news_description').value = item.description || '';
  document.getElementById('news_date').value = item.date || '';
  document.getElementById('news_image_url').value = item.image_url || '';
}

function fillEventForm(item) {
  document.getElementById('event_id').value = item.id;
  document.getElementById('event_name').value = item.name || '';
  document.getElementById('event_description').value = item.description || '';
  document.getElementById('event_date').value = item.date || '';
  document.getElementById('event_location').value = item.location || '';
}

function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
