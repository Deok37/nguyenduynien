const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'portfolio_user',
  password: process.env.DB_PASSWORD || 'PortfolioUser@2024SecurePass',
  database: process.env.DB_NAME || 'portfolio_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;
let isConnected = false;

// In-memory fallback mock data for standalone/local mode when MySQL is not running
const mockData = {
  profile: {
    id: 1,
    full_name: 'Nguyễn Văn Đức',
    title: 'DevOps & Fullstack Software Engineer',
    bio: 'Kỹ sư phần mềm đam mê kiến trúc hệ thống phân tán, containerization (Docker, Kubernetes), CI/CD tự động hóa, giải pháp quan sát toàn diện (Prometheus, Grafana, Loki) và phát triển ứng dụng web an toàn, hiệu năng cao.',
    email: 'ducshin.dev@gmail.com',
    phone: '+84 987 654 321',
    location: 'Hà Nội / TP. Hồ Chí Minh, Việt Nam',
    github_url: 'https://github.com/ducshin',
    linkedin_url: 'https://linkedin.com/in/ducshin',
    resume_url: '#resume',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  projects: [
    {
      id: 1,
      title: 'Cloud-Native Microservices Architecture',
      description: 'Hệ thống thương mại điện tử kiến trúc phân tán với Nginx Reverse Proxy, Docker Compose, xác thực JWT, cơ chế tự phục hồi và bảo mật nhiều lớp.',
      category: 'DevOps',
      tags: 'Docker, Nginx, Node.js, MySQL, Redis',
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      demo_url: 'https://demo.portfolio.local',
      github_url: 'https://github.com/ducshin/cloud-microservices',
      featured: 1
    },
    {
      id: 2,
      title: 'Hệ Thống Giám Sát Tập Trung & Quản Lý Log',
      description: 'Triển khai toàn diện Prometheus thu thập metrics, Grafana trực quan hóa dashboards, Loki & Promtail quản lý logs phân tán với truy vấn LogQL thông minh.',
      category: 'DevOps',
      tags: 'Prometheus, Grafana, Loki, Promtail, cAdvisor',
      image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      demo_url: 'http://localhost:3001',
      github_url: 'https://github.com/ducshin/monitoring-stack',
      featured: 1
    },
    {
      id: 3,
      title: 'Portfolio & CMS Admin Panel Cao Cấp',
      description: 'Trang giới thiệu cá nhân thiết kế chuẩn Glassmorphism hiện đại, tích hợp bảng quản trị CMS đầy đủ CRUD, xác thực bảo mật và phân quyền truy cập.',
      category: 'Web',
      tags: 'JavaScript, Express, MySQL, phpMyAdmin, CSS3',
      image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
      demo_url: 'http://localhost',
      github_url: 'https://github.com/ducshin/portfolio-cms',
      featured: 1
    },
    {
      id: 4,
      title: 'Hệ Thống Quản Lý Thư Viện Trực Tuyến',
      description: 'Nền tảng mượn trả và quản lý đầu sách cho sinh viên với báo cáo tự động, bảo vệ chống SQL Injection và XSS.',
      category: 'Web',
      tags: 'PHP, MySQL, Bootstrap, Nginx',
      image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
      demo_url: '#',
      github_url: 'https://github.com/ducshin/library-management',
      featured: 0
    }
  ],
  skills: [
    { id: 1, name: 'Docker & Docker Compose', category: 'DevOps', proficiency: 95, icon: 'container' },
    { id: 2, name: 'Nginx Reverse Proxy & SSL', category: 'DevOps', proficiency: 90, icon: 'server' },
    { id: 3, name: 'Prometheus & Grafana', category: 'DevOps', proficiency: 90, icon: 'activity' },
    { id: 4, name: 'Loki, Promtail & LogQL', category: 'DevOps', proficiency: 85, icon: 'terminal' },
    { id: 5, name: 'Linux Hardening & Security', category: 'DevOps', proficiency: 85, icon: 'shield' },
    { id: 6, name: 'CI/CD & GitHub Actions', category: 'DevOps', proficiency: 80, icon: 'git-pull-request' },
    { id: 7, name: 'Node.js & Express', category: 'Backend', proficiency: 90, icon: 'cpu' },
    { id: 8, name: 'MySQL & Database Tuning', category: 'Backend', proficiency: 88, icon: 'database' },
    { id: 9, name: 'RESTful API Design', category: 'Backend', proficiency: 92, icon: 'code' },
    { id: 10, name: 'JWT & Security Authentication', category: 'Backend', proficiency: 88, icon: 'lock' },
    { id: 11, name: 'HTML5 / Modern CSS3', category: 'Frontend', proficiency: 95, icon: 'layout' },
    { id: 12, name: 'Vanilla JavaScript (ES6+)', category: 'Frontend', proficiency: 90, icon: 'code' },
    { id: 13, name: 'Glassmorphic & Responsive UI', category: 'Frontend', proficiency: 92, icon: 'monitor' }
  ],
  messages: [
    {
      id: 1,
      name: 'Giảng Viên Hướng Dẫn',
      email: 'teacher@university.edu.vn',
      subject: 'Đánh giá hệ thống thực hành Đề 13',
      message: 'Hệ thống triển khai rất đầy đủ các tiêu chí: Docker Compose, Nginx HTTPS, Prometheus, Grafana, Loki LogQL và Hardening!',
      is_read: 1,
      created_at: new Date().toISOString()
    }
  ]
};

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Function to check DB connectivity with retry for Docker startup
async function checkDbConnection(retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const p = await getPool();
      const [rows] = await p.query('SELECT 1 as connected');
      console.log(`[Database] Connected successfully to MySQL (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
      isConnected = true;
      return true;
    } catch (err) {
      if (i === 0) {
        console.warn(`[Database] MySQL (${dbConfig.host}:${dbConfig.port}) not responding yet: ${err.message}`);
      }
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  console.log('[Database] Operating with built-in resilient mock memory store (Standalone Mode). MySQL queries will switch automatically once DB is available.');
  isConnected = false;
  return false;
}

function isDbActive() {
  return isConnected;
}

module.exports = {
  getPool,
  checkDbConnection,
  isDbActive,
  mockData
};
