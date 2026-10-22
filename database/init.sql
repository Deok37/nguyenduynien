-- ========================================================
-- DATABASE INITIALIZATION SCRIPT: portfolio_db
-- Môn học: Triển khai và Quản trị Hệ thống Phần mềm
-- Đề tài 13: Website Portfolio / Giới thiệu Cá nhân
-- ========================================================

CREATE DATABASE IF NOT EXISTS portfolio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_db;

-- 1. Table: profile
CREATE TABLE IF NOT EXISTS profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    bio TEXT NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(150),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    resume_url VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: projects
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Web',
    tags VARCHAR(255),
    image_url VARCHAR(255),
    demo_url VARCHAR(255),
    github_url VARCHAR(255),
    featured BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: skills
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    proficiency INT DEFAULT 80,
    icon VARCHAR(50) DEFAULT 'code',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: messages (Contact form submissions)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: admins
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- SEED INITIAL DATA
-- ========================================================

-- Insert Profile
INSERT INTO profile (id, full_name, title, bio, email, phone, location, github_url, linkedin_url, resume_url, avatar_url)
VALUES (
    1,
    'Nguyễn Văn Đức',
    'DevOps & Fullstack Software Engineer',
    'Kỹ sư phần mềm đam mê kiến trúc hệ thống phân tán, containerization (Docker, Kubernetes), CI/CD tự động hóa, giải pháp giám sát quan sát (Prometheus, Grafana, Loki) và phát triển ứng dụng web an toàn, hiệu năng cao.',
    'ducshin.dev@gmail.com',
    '+84 987 654 321',
    'Hà Nội / TP. Hồ Chí Minh, Việt Nam',
    'https://github.com/ducshin',
    'https://linkedin.com/in/ducshin',
    '#resume',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
) ON DUPLICATE KEY UPDATE id=id;

-- Insert Admin Account
-- Default Username: admin
-- Default Password: Admin@Secure2024!
INSERT INTO admins (id, username, password_hash, email)
VALUES (
    1,
    'admin',
    '$2a$10$B0YjN1Zyi/SrkzNkMf7SselOZB2/DxWL0ncKFcBNaY4ZsnMozKNye',
    'admin@portfolio.local'
) ON DUPLICATE KEY UPDATE id=id;

-- Insert Projects
INSERT INTO projects (title, description, category, tags, image_url, demo_url, github_url, featured)
VALUES
(
    'Cloud-Native Microservices Architecture',
    'Hệ thống thương mại điện tử kiến trúc phân tán với Nginx Reverse Proxy, Docker Compose, xác thực JWT, cơ chế tự phục hồi và bảo mật nhiều lớp.',
    'DevOps',
    'Docker, Nginx, Node.js, MySQL, Redis',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://demo.portfolio.local',
    'https://github.com/ducshin/cloud-microservices',
    1
),
(
    'Hệ Thống Giám Sát Tập Trung & Quản Lý Log',
    'Triển khai toàn diện Prometheus thu thập metrics, Grafana trực quan hóa dashboards, Loki & Promtail quản lý logs phân tán với truy vấn LogQL thông minh.',
    'DevOps',
    'Prometheus, Grafana, Loki, Promtail, cAdvisor',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    'http://localhost:3001',
    'https://github.com/ducshin/monitoring-stack',
    1
),
(
    'Portfolio & CMS Admin Panel Cao Cấp',
    'Trang giới thiệu cá nhân thiết kế chuẩn Glassmorphism hiện đại, tích hợp bảng quản trị CMS đầy đủ CRUD, xác thực bảo mật và phân quyền truy cập.',
    'Web',
    'JavaScript, Express, MySQL, phpMyAdmin, CSS3',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    'http://localhost',
    'https://github.com/ducshin/portfolio-cms',
    1
),
(
    'Hệ Thống Quản Lý Thư Viện Trực Tuyến',
    'Nền tảng mượn trả và quản lý đầu sách cho sinh viên với báo cáo tự động, bảo vệ chống SQL Injection và XSS.',
    'Web',
    'PHP, MySQL, Bootstrap, Nginx',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    '#',
    'https://github.com/ducshin/library-management',
    0
);

-- Insert Skills
INSERT INTO skills (name, category, proficiency, icon)
VALUES
-- DevOps & System
('Docker & Docker Compose', 'DevOps', 95, 'container'),
('Nginx Reverse Proxy & SSL', 'DevOps', 90, 'server'),
('Prometheus & Grafana', 'DevOps', 90, 'activity'),
('Loki, Promtail & LogQL', 'DevOps', 85, 'terminal'),
('Linux Hardening & Security', 'DevOps', 85, 'shield'),
('CI/CD & GitHub Actions', 'DevOps', 80, 'git-pull-request'),

-- Backend
('Node.js & Express', 'Backend', 90, 'cpu'),
('MySQL & Database Tuning', 'Backend', 88, 'database'),
('RESTful API Design', 'Backend', 92, 'code'),
('JWT & Security Authentication', 'Backend', 88, 'lock'),

-- Frontend
('HTML5 / Modern CSS3', 'Frontend', 95, 'layout'),
('Vanilla JavaScript (ES6+)', 'Frontend', 90, 'code'),
('Glassmorphic & Responsive UI', 'Frontend', 92, 'monitor');

-- Insert Initial Contact Message
INSERT INTO messages (name, email, subject, message, is_read)
VALUES (
    'Giảng Viên Hướng Dẫn',
    'teacher@university.edu.vn',
    'Đánh giá hệ thống thực hành Đề 13',
    'Hệ thống triển khai rất đầy đủ các tiêu chí: Docker Compose, Nginx HTTPS, Prometheus, Grafana, Loki LogQL và Hardening!',
    1
);

-- ========================================================
-- HARDENING: DATABASE ACCESS PERMISSION RESTRICTION
-- Nguyên tắc đặc quyền tối thiểu (Least Privilege)
-- ========================================================

-- Tạo người dùng ứng dụng và chỉ cấp quyền thao tác dữ liệu (CRUD), không cấp đặc quyền quản trị
CREATE USER IF NOT EXISTS 'portfolio_user'@'%' IDENTIFIED BY 'PortfolioUser@2024SecurePass';
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_db.* TO 'portfolio_user'@'%';

-- Tạo người dùng phục vụ xuất metric cho Prometheus mysqld-exporter
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY 'ExporterSecurePass2024!';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';

FLUSH PRIVILEGES;
