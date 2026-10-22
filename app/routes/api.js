const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('./auth');
const client = require('prom-client');

// Custom Prometheus metric for contact messages submitted
const contactMessagesCounter = new client.Counter({
  name: 'portfolio_contact_messages_total',
  help: 'Total number of contact messages submitted by visitors'
});

// ==========================================
// 1. PROFILE API
// ==========================================

// GET /api/profile (Public)
router.get('/profile', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Chưa có thông tin profile' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// PUT /api/profile (Admin only)
router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name, title, bio, email, phone, location, github_url, linkedin_url, resume_url, avatar_url } = req.body;
  try {
    const pool = await getPool();
    const [existing] = await pool.query('SELECT id FROM profile LIMIT 1');

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO profile (full_name, title, bio, email, phone, location, github_url, linkedin_url, resume_url, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [full_name, title, bio, email, phone, location, github_url, linkedin_url, resume_url, avatar_url]
      );
    } else {
      await pool.query(
        `UPDATE profile SET full_name = ?, title = ?, bio = ?, email = ?, phone = ?, location = ?,
         github_url = ?, linkedin_url = ?, resume_url = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?`,
        [full_name, title, bio, email, phone, location, github_url, linkedin_url, resume_url, avatar_url, existing[0].id]
      );
    }
    res.json({ message: 'Cập nhật thông tin profile thành công!' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật profile' });
  }
});

// ==========================================
// 2. PROJECTS API
// ==========================================

// GET /api/projects (Public)
router.get('/projects', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM projects ORDER BY featured DESC, created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách dự án' });
  }
});

// POST /api/projects (Admin only)
router.post('/projects', authenticateToken, async (req, res) => {
  const { title, description, category, tags, image_url, demo_url, github_url, featured } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Tiêu đề và mô tả không được để trống' });
  }

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      `INSERT INTO projects (title, description, category, tags, image_url, demo_url, github_url, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category || 'Web', tags || '', image_url || '', demo_url || '', github_url || '', featured ? 1 : 0]
    );
    res.status(201).json({ message: 'Tạo dự án mới thành công', projectId: result.insertId });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Lỗi khi thêm dự án' });
  }
});

// PUT /api/projects/:id (Admin only)
router.put('/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, category, tags, image_url, demo_url, github_url, featured } = req.body;

  try {
    const pool = await getPool();
    await pool.query(
      `UPDATE projects SET title = ?, description = ?, category = ?, tags = ?, image_url = ?,
       demo_url = ?, github_url = ?, featured = ?, updated_at = NOW() WHERE id = ?`,
      [title, description, category, tags, image_url, demo_url, github_url, featured ? 1 : 0, id]
    );
    res.json({ message: 'Cập nhật dự án thành công' });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật dự án' });
  }
});

// DELETE /api/projects/:id (Admin only)
router.delete('/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa dự án thành công' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Lỗi khi xóa dự án' });
  }
});

// ==========================================
// 3. SKILLS API
// ==========================================

// GET /api/skills (Public)
router.get('/skills', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM skills ORDER BY category, proficiency DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách kỹ năng' });
  }
});

// POST /api/skills (Admin only)
router.post('/skills', authenticateToken, async (req, res) => {
  const { name, category, proficiency, icon } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Tên kỹ năng và phân loại là bắt buộc' });
  }

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO skills (name, category, proficiency, icon) VALUES (?, ?, ?, ?)',
      [name, category, parseInt(proficiency || '80', 10), icon || 'code']
    );
    res.status(201).json({ message: 'Thêm kỹ năng thành công', skillId: result.insertId });
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ error: 'Lỗi khi thêm kỹ năng' });
  }
});

// DELETE /api/skills/:id (Admin only)
router.delete('/skills/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM skills WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa kỹ năng' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ error: 'Lỗi khi xóa kỹ năng' });
  }
});

// ==========================================
// 4. CONTACT MESSAGES API
// ==========================================

// POST /api/contact (Public)
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đủ tên, email và nội dung tin nhắn' });
  }

  try {
    const pool = await getPool();
    await pool.query(
      'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || 'Không có tiêu đề', message]
    );

    // Track in Prometheus metric
    contactMessagesCounter.inc();

    console.log(`[Contact] New message received from: ${name} <${email}>`);
    res.status(201).json({ message: 'Cảm ơn bạn! Tin nhắn đã được gửi thành công.' });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ error: 'Lỗi khi gửi tin nhắn' });
  }
});

// GET /api/messages (Admin only)
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách tin nhắn' });
  }
});

// DELETE /api/messages/:id (Admin only)
router.delete('/messages/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa tin nhắn thành công' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Lỗi khi xóa tin nhắn' });
  }
});

// ==========================================
// 5. DASHBOARD STATS API (Admin only)
// ==========================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const [[{ projectCount }]] = await pool.query('SELECT COUNT(*) as projectCount FROM projects');
    const [[{ skillCount }]] = await pool.query('SELECT COUNT(*) as skillCount FROM skills');
    const [[{ messageCount }]] = await pool.query('SELECT COUNT(*) as messageCount FROM messages');
    const [[{ unreadMessages }]] = await pool.query('SELECT COUNT(*) as unreadMessages FROM messages WHERE is_read = 0');

    res.json({
      projectCount,
      skillCount,
      messageCount,
      unreadMessages,
      systemUptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Lỗi lấy thống kê hệ thống' });
  }
});

module.exports = router;
