# BÁO CÁO CÁC BIỆN PHÁP HARDENING & BẢO MẬT HỆ THỐNG
**Môn học:** Triển khai và Quản trị Hệ thống Phần mềm  
**Đề tài 13:** Website Portfolio / Giới thiệu Cá nhân có Admin CMS  
**Sinh viên thực hiện:** Nguyễn Văn Đức  

---

## Tổng quan các biện pháp Hardening đã áp dụng (6/6 biện pháp)

| STT | Biện pháp Hardening | Thành phần áp dụng | Mục tiêu bảo mật | Đánh giá đạt chuẩn |
|:---:|:---|:---|:---|:---:|
| 1 | **Non-Root Containers** | Web App (`node`), Prometheus (`nobody`), Loki (`10001`) | Chống leo thang đặc quyền (Privilege Escalation) nếu container bị thâm nhập | Đạt |
| 2 | **Network Isolation** | Docker Networks (`frontend-net`, `backend-net`, `monitoring-net`) | Cách ly hoàn toàn CSDL, không mở port 3306 ra ngoài Internet | Đạt |
| 3 | **Database Least Privilege** | MySQL Users & Permissions | Cấp quyền tối thiểu (chỉ CRUD), không cấp quyền DROP/GRANT cho ứng dụng | Đạt |
| 4 | **Nginx Security Headers** | Nginx Reverse Proxy (HTTPS) | Ngăn chặn tấn công Clickjacking, MIME sniffing, XSS, ép buộc HTTPS | Đạt |
| 5 | **Rate Limiting & Anti-DDoS** | Nginx `limit_req` & `limit_conn` | Ngăn chặn tấn công Brute Force đăng nhập và DoS vào API | Đạt |
| 6 | **Resource Limits & Kernel Security** | Docker Compose `deploy.resources.limits`, `no-new-privileges` | Ngăn chặn container chiếm dụng cạn kiệt RAM/CPU (OOM) của máy chủ | Đạt |

---

## Chi tiết kỹ thuật từng giải pháp

### 1. Non-Root Container Execution
- **Thực trạng nguy cơ:** Mặc định nhiều container Docker chạy dưới quyền `root` (UID 0). Nếu hacker khai thác được lỗ hổng Remote Code Execution (RCE) trong ứng dụng web, kẻ tấn công sẽ có đặc quyền root bên trong container và có thể khai thác lỗ hổng hạt nhân (kernel exploit) để thoát container (container escape) chiếm quyền máy chủ host.
- **Giải pháp triển khai:**
  - Trong [Dockerfile](file:///app/Dockerfile): Thiết lập quyền sở hữu mã nguồn cho người dùng tích hợp `node:node` và khai báo:
    ```dockerfile
    RUN chown -R node:node /app
    USER node
    ```
  - Trong [docker-compose.yml](file:///docker-compose.yml): Cấu hình Prometheus chạy bằng user unprivileged `65534:65534` (nobody:nogroup) và Loki chạy bằng user `10001:10001`.
  - Thiết lập thuộc tính `security_opt: [no-new-privileges:true]` để vô hiệu hóa việc tiến trình con chiếm quyền qua cờ SUID/SGID.

---

### 2. Network Isolation (Phân vùng mạng nội bộ)
- **Thực trạng nguy cơ:** Nếu tất cả các dịch vụ cùng chung một mạng bridge mặc định và mở port ra ngoài, kẻ tấn công có thể quét cổng (port scan) và tấn công trực tiếp vào cơ sở dữ liệu MySQL hoặc hệ thống giám sát.
- **Giải pháp triển khai:** Hệ thống được phân tách thành 3 mạng độc lập trong [docker-compose.yml](file:///docker-compose.yml):
  1. `frontend-net`: Nơi tiếp nhận traffic từ Nginx Reverse Proxy tới Web App và phpMyAdmin.
  2. `backend-net`: Mạng nội bộ riêng biệt (`internal: true`). MySQL tuyệt đối **không ánh xạ cổng (port mapping 3306)** ra máy chủ host. Chỉ có Web App, phpMyAdmin và `mysqld-exporter` được phép kết nối qua mạng này.
  3. `monitoring-net`: Mạng riêng phục vụ thu thập số liệu metrics và log giữa Prometheus, Grafana, Loki và các Exporters.

---

### 3. Nguyên tắc đặc quyền tối thiểu cho Cơ sở dữ liệu (Least Privilege)
- **Thực trạng nguy cơ:** Nhiều ứng dụng sử dụng trực tiếp tài khoản `root` của MySQL để truy vấn dữ liệu. Nếu xảy ra lỗ hổng SQL Injection, kẻ tấn công có thể xóa sạch CSDL (`DROP DATABASE`) hoặc tạo tài khoản quản trị mới.
- **Giải pháp triển khai:** Trong [init.sql](file:///database/init.sql):
  - Tạo người dùng riêng cho ứng dụng web: `portfolio_user` và chỉ cấp các quyền thao tác dữ liệu cơ bản:
    ```sql
    CREATE USER 'portfolio_user'@'%' IDENTIFIED BY 'PortfolioUser@2024SecurePass';
    GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_db.* TO 'portfolio_user'@'%';
    ```
  - Người dùng này hoàn toàn **không có quyền** `GRANT OPTION`, `SUPER`, `DROP`, `ALTER` hoặc truy cập vào các schema nhạy cảm của MySQL (`mysql`, `information_schema`).
  - Tạo riêng user `exporter` cho Prometheus `mysqld-exporter` chỉ có quyền đọc số liệu thống kê (`PROCESS`, `REPLICATION CLIENT`, `SELECT`).

---

### 4. Nginx Security Headers & Ẩn thông tin máy chủ
- **Giải pháp triển khai:** Trong [nginx.conf](file:///nginx/nginx.conf):
  - `server_tokens off;`: Ẩn hoàn toàn số phiên bản của Nginx trong HTTP response header nhằm ngăn kẻ tấn công thu thập thông tin phiên bản để tìm CVE khai thác.
  - `add_header X-Frame-Options "SAMEORIGIN" always;`: Ngăn chặn website bị nhúng vào `<iframe>` của website lạ nhằm chống tấn công Clickjacking.
  - `add_header X-Content-Type-Options "nosniff" always;`: Ngăn chặn trình duyệt tự ý phán đoán MIME type sai lệch (MIME sniffing attack).
  - `add_header X-XSS-Protection "1; mode=block" always;`: Bật bộ lọc chống Cross-Site Scripting tích hợp trên trình duyệt.
  - `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`: Ép buộc trình duyệt chỉ giao tiếp qua giao thức mã hóa HTTPS.

---

### 5. Rate Limiting (Giới hạn tốc độ truy cập chống DoS & Brute Force)
- **Giải pháp triển khai:**
  - Thiết lập vùng nhớ theo dõi địa chỉ IP máy khách:
    ```nginx
    limit_req_zone $binary_remote_addr zone=req_limit:10m rate=20r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    ```
  - Áp dụng hạn mức tối đa 20 request/giây với buffer burst=30:
    ```nginx
    limit_req zone=req_limit burst=30 nodelay;
    limit_conn conn_limit 20;
    ```
  - Thiết lập kích thước tối đa cho body request (`client_max_body_size 10M;`) để ngăn chặn việc tải lên file quá lớn làm tràn bộ nhớ đệm server.

---

### 6. Quản lý Tài nguyên & Giới hạn Resource Limits
- **Giải pháp triển khai:** Mỗi container trong file `docker-compose.yml` đều được khai báo trần tài nguyên nghiêm ngặt:
  - Web App: `cpus: '0.75'`, `memory: 300M`
  - MySQL: `cpus: '1.0'`, `memory: 600M`
  - Nginx: `cpus: '0.5'`, `memory: 150M`
  - Prometheus / Grafana / Loki: Giới hạn memory từ 250M - 300M
- **Mục tiêu:** Đảm bảo khi một container bị quá tải hoặc memory leak, hệ điều hành host không bị sập (Out of Memory - OOM Killer) và các dịch vụ khác vẫn duy trì hoạt động bình thường.
