// ========================================================
// PORTFOLIO CLIENT APPLICATION JAVASCRIPT
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadSkills();
  loadProjects();
  initContactForm();
});

// 1. Load Profile
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Không thể tải profile');
    const data = await res.json();

    if (data.full_name) {
      document.getElementById('hero-name').textContent = data.full_name;
      document.getElementById('about-fullname').textContent = data.full_name;
    }
    if (data.title) {
      document.getElementById('hero-title').textContent = data.title;
    }
    if (data.bio) {
      document.getElementById('hero-bio').textContent = data.bio;
    }
    if (data.email) {
      document.getElementById('about-email').textContent = data.email;
      document.getElementById('contact-email').textContent = data.email;
    }
    if (data.location) {
      document.getElementById('about-location').textContent = data.location;
      document.getElementById('contact-location').textContent = data.location;
    }
    if (data.avatar_url) {
      document.getElementById('hero-avatar').src = data.avatar_url;
    }
  } catch (err) {
    console.warn('Profile fetch warning (using default fallback):', err);
  }
}

// 2. Load Skills
async function loadSkills() {
  const container = document.getElementById('skills-container');
  try {
    const res = await fetch('/api/skills');
    if (!res.ok) throw new Error('Failed to load skills');
    const skills = await res.json();

    if (!skills || skills.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Chưa có kỹ năng nào.</p>';
      return;
    }

    container.innerHTML = skills.map(skill => `
      <div class="glass-card skill-card">
        <div class="skill-header">
          <span class="skill-name">${escapeHtml(skill.name)}</span>
          <span class="skill-category-tag">${escapeHtml(skill.category)}</span>
        </div>
        <div class="skill-bar-bg">
          <div class="skill-bar-fill" style="width: ${skill.proficiency}%;"></div>
        </div>
        <div style="display: flex; justify-content: flex-end; font-size: 0.8rem; color: #a5b4fc; font-weight: 600;">
          ${skill.proficiency}%
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Skills load error:', err);
    container.innerHTML = '<p style="color: var(--text-dim); text-align: center;">Đang kết nối cơ sở dữ liệu...</p>';
  }
}

// 3. Load Projects
async function loadProjects() {
  const container = document.getElementById('projects-container');
  const countEl = document.getElementById('stat-project-count');
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to load projects');
    const projects = await res.json();

    if (countEl) countEl.textContent = `${projects.length}+`;

    if (!projects || projects.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Chưa có dự án nào được đăng tải.</p>';
      return;
    }

    container.innerHTML = projects.map(proj => {
      const tagsList = proj.tags ? proj.tags.split(',').map(t => `<span class="tag-pill">${escapeHtml(t.trim())}</span>`).join('') : '';
      const defaultImg = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';

      return `
        <div class="glass-card project-card">
          <div class="project-thumb-wrap">
            <img class="project-thumb" src="${escapeHtml(proj.image_url || defaultImg)}" alt="${escapeHtml(proj.title)}" onerror="this.src='${defaultImg}'">
            <span class="project-badge">${escapeHtml(proj.category || 'Tech')}</span>
          </div>
          <div class="project-content">
            <h3 class="project-title">${escapeHtml(proj.title)}</h3>
            <p class="project-desc">${escapeHtml(proj.description)}</p>
            <div class="project-tags">
              ${tagsList}
            </div>
            <div class="project-links">
              ${proj.demo_url ? `<a href="${escapeHtml(proj.demo_url)}" target="_blank" class="btn btn-primary btn-sm">Xem Demo</a>` : ''}
              ${proj.github_url ? `<a href="${escapeHtml(proj.github_url)}" target="_blank" class="btn btn-outline btn-sm">Mã nguồn</a>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Projects load error:', err);
    container.innerHTML = '<p style="color: var(--text-dim); text-align: center;">Đang tải danh sách dự án...</p>';
  }
}

// 4. Contact Form Handler
function initContactForm() {
  const form = document.getElementById('contact-form');
  const alertBox = document.getElementById('contact-alert');
  const submitBtn = document.getElementById('btn-send-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('sender-name').value.trim();
    const email = document.getElementById('sender-email').value.trim();
    const subject = document.getElementById('sender-subject').value.trim();
    const message = document.getElementById('sender-message').value.trim();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Đang gửi...</span>';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi khi gửi tin nhắn');

      alertBox.className = 'alert-box alert-success';
      alertBox.textContent = data.message || 'Gửi tin nhắn thành công!';
      alertBox.style.display = 'block';
      form.reset();

      setTimeout(() => {
        alertBox.style.display = 'none';
      }, 5000);
    } catch (err) {
      alertBox.className = 'alert-box alert-error';
      alertBox.textContent = err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.';
      alertBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Gửi Tin Nhắn Ngay</span><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
    }
  });
}

// Escape utility
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
