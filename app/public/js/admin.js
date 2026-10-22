// ========================================================
// ADMIN CMS JAVASCRIPT LOGIC
// ========================================================

const token = localStorage.getItem('portfolio_token');
const user = JSON.parse(localStorage.getItem('portfolio_user') || '{}');

// Check authentication on page load
if (!token) {
  window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
  if (user && user.username) {
    document.getElementById('admin-username').textContent = user.username;
  }
  loadOverviewStats();
  loadAdminProfile();
  loadAdminProjects();
  loadAdminSkills();
  loadAdminMessages();

  // Profile Form Submit
  document.getElementById('form-profile').addEventListener('submit', handleProfileSave);
  
  // Project Modal Submit
  document.getElementById('form-project-modal').addEventListener('submit', handleProjectSave);

  // Skill Modal Submit
  document.getElementById('form-skill-modal').addEventListener('submit', handleSkillSave);
});

// Helper for authenticated requests
async function authFetch(url, options = {}) {
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('portfolio_token');
    window.location.href = '/login';
    throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
  }
  return res;
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));

  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.style.display = 'block';

  const clickedLink = Array.from(document.querySelectorAll('.sidebar-link')).find(el => el.getAttribute('onclick')?.includes(tabId));
  if (clickedLink) clickedLink.classList.add('active');

  const titles = {
    'tab-overview': 'Tổng Quan Hệ Thống',
    'tab-profile': 'Hồ Sơ Cá Nhân',
    'tab-projects': 'Quản Lý Dự Án',
    'tab-skills': 'Quản Lý Kỹ Năng',
    'tab-messages': 'Hộp Thư Liên Hệ'
  };
  document.getElementById('page-heading').textContent = titles[tabId] || 'Quản Trị CMS';
}

// 1. Overview Stats
async function loadOverviewStats() {
  try {
    const res = await authFetch('/api/stats');
    const data = await res.json();

    document.getElementById('stat-projects').textContent = data.projectCount || 0;
    document.getElementById('stat-skills').textContent = data.skillCount || 0;
    document.getElementById('stat-messages').textContent = data.messageCount || 0;

    const uptimeMins = Math.floor((data.systemUptime || 0) / 60);
    document.getElementById('stat-uptime').textContent = `${uptimeMins} phút`;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// 2. Profile Management
async function loadAdminProfile() {
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();

    if (data) {
      document.getElementById('prof-fullname').value = data.full_name || '';
      document.getElementById('prof-title').value = data.title || '';
      document.getElementById('prof-bio').value = data.bio || '';
      document.getElementById('prof-email').value = data.email || '';
      document.getElementById('prof-phone').value = data.phone || '';
      document.getElementById('prof-location').value = data.location || '';
      document.getElementById('prof-avatar').value = data.avatar_url || '';
      document.getElementById('prof-github').value = data.github_url || '';
      document.getElementById('prof-linkedin').value = data.linkedin_url || '';
    }
  } catch (err) {
    console.error('Admin profile error:', err);
  }
}

async function handleProfileSave(e) {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById('prof-fullname').value.trim(),
    title: document.getElementById('prof-title').value.trim(),
    bio: document.getElementById('prof-bio').value.trim(),
    email: document.getElementById('prof-email').value.trim(),
    phone: document.getElementById('prof-phone').value.trim(),
    location: document.getElementById('prof-location').value.trim(),
    avatar_url: document.getElementById('prof-avatar').value.trim(),
    github_url: document.getElementById('prof-github').value.trim(),
    linkedin_url: document.getElementById('prof-linkedin').value.trim()
  };

  try {
    const res = await authFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast('Cập nhật thông tin profile thành công!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// 3. Projects Management (CRUD)
async function loadAdminProjects() {
  const tbody = document.getElementById('projects-table-body');
  try {
    const res = await fetch('/api/projects');
    const projects = await res.json();

    if (!projects || projects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-dim);">Chưa có dự án nào</td></tr>';
      return;
    }

    tbody.innerHTML = projects.map(p => `
      <tr>
        <td>#${p.id}</td>
        <td><img src="${p.image_url || 'https://via.placeholder.com/50'}" style="width: 48px; height: 32px; object-fit: cover; border-radius: 4px;"></td>
        <td><strong>${escapeHtml(p.title)}</strong></td>
        <td><span class="tag-pill">${escapeHtml(p.category)}</span></td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(p.tags || '-')}</td>
        <td>${p.featured ? '<span style="color: #34d399;">★ Có</span>' : '<span style="color: var(--text-dim);">Không</span>'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick='openProjectModal(${JSON.stringify(p)})'>✏️</button>
            <button class="btn-icon btn-danger" onclick="deleteProject(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Projects admin error:', err);
  }
}

function openProjectModal(project = null) {
  const modal = document.getElementById('project-modal');
  const titleEl = document.getElementById('modal-project-title');
  const form = document.getElementById('form-project-modal');

  if (project) {
    titleEl.textContent = 'Chỉnh Sửa Dự Án';
    document.getElementById('proj-id').value = project.id;
    document.getElementById('proj-title').value = project.title;
    document.getElementById('proj-desc').value = project.description;
    document.getElementById('proj-category').value = project.category || 'Web';
    document.getElementById('proj-tags').value = project.tags || '';
    document.getElementById('proj-image').value = project.image_url || '';
    document.getElementById('proj-demo').value = project.demo_url || '';
    document.getElementById('proj-github').value = project.github_url || '';
    document.getElementById('proj-featured').checked = project.featured == 1;
  } else {
    titleEl.textContent = 'Thêm Dự Án Mới';
    form.reset();
    document.getElementById('proj-id').value = '';
  }
  modal.style.display = 'flex';
}

function closeProjectModal() {
  document.getElementById('project-modal').style.display = 'none';
}

async function handleProjectSave(e) {
  e.preventDefault();
  const id = document.getElementById('proj-id').value;
  const payload = {
    title: document.getElementById('proj-title').value.trim(),
    description: document.getElementById('proj-desc').value.trim(),
    category: document.getElementById('proj-category').value,
    tags: document.getElementById('proj-tags').value.trim(),
    image_url: document.getElementById('proj-image').value.trim(),
    demo_url: document.getElementById('proj-demo').value.trim(),
    github_url: document.getElementById('proj-github').value.trim(),
    featured: document.getElementById('proj-featured').checked
  };

  const url = id ? `/api/projects/${id}` : '/api/projects';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await authFetch(url, {
      method,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(id ? 'Cập nhật dự án thành công!' : 'Thêm dự án mới thành công!');
    closeProjectModal();
    loadAdminProjects();
    loadOverviewStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProject(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa dự án này không?')) return;
  try {
    const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Đã xóa dự án thành công');
    loadAdminProjects();
    loadOverviewStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// 4. Skills Management (CRUD)
async function loadAdminSkills() {
  const tbody = document.getElementById('skills-table-body');
  try {
    const res = await fetch('/api/skills');
    const skills = await res.json();

    if (!skills || skills.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim);">Chưa có kỹ năng nào</td></tr>';
      return;
    }

    tbody.innerHTML = skills.map(s => `
      <tr>
        <td>#${s.id}</td>
        <td><strong>${escapeHtml(s.name)}</strong></td>
        <td><span class="tag-pill">${escapeHtml(s.category)}</span></td>
        <td>${s.proficiency}%</td>
        <td>
          <button class="btn-icon btn-danger" onclick="deleteSkill(${s.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Skills admin error:', err);
  }
}

function openSkillModal() {
  document.getElementById('skill-modal').style.display = 'flex';
}

function closeSkillModal() {
  document.getElementById('skill-modal').style.display = 'none';
}

async function handleSkillSave(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('skill-name-input').value.trim(),
    category: document.getElementById('skill-category-input').value,
    proficiency: parseInt(document.getElementById('skill-proficiency-input').value, 10)
  };

  try {
    const res = await authFetch('/api/skills', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Thêm kỹ năng mới thành công!');
    closeSkillModal();
    document.getElementById('form-skill-modal').reset();
    loadAdminSkills();
    loadOverviewStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteSkill(id) {
  if (!confirm('Bạn có chắc muốn xóa kỹ năng này?')) return;
  try {
    const res = await authFetch(`/api/skills/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Đã xóa kỹ năng');
    loadAdminSkills();
    loadOverviewStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// 5. Messages Management
async function loadAdminMessages() {
  const tbody = document.getElementById('messages-table-body');
  try {
    const res = await authFetch('/api/messages');
    const messages = await res.json();

    if (!messages || messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-dim);">Chưa có tin nhắn liên hệ nào</td></tr>';
      return;
    }

    tbody.innerHTML = messages.map(m => `
      <tr>
        <td>#${m.id}</td>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td>${escapeHtml(m.email)}</td>
        <td>${escapeHtml(m.subject || '-')}</td>
        <td style="max-width: 300px;">${escapeHtml(m.message)}</td>
        <td><small style="color: var(--text-dim);">${new Date(m.created_at).toLocaleString('vi-VN')}</small></td>
        <td>
          <button class="btn-icon btn-danger" onclick="deleteMessage(${m.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Messages admin error:', err);
  }
}

async function deleteMessage(id) {
  if (!confirm('Xóa tin nhắn này?')) return;
  try {
    const res = await authFetch(`/api/messages/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Đã xóa tin nhắn');
    loadAdminMessages();
    loadOverviewStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Logout
function logout() {
  localStorage.removeItem('portfolio_token');
  localStorage.removeItem('portfolio_user');
  window.location.href = '/login';
}

// Toast notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') toast.style.borderLeftColor = '#ef4444';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
