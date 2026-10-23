# HƯỚNG DẪN TRUY VẤN NHẬT KÝ VỚI LOGQL (LOKI + PROMTAIL)
**Môn học:** Triển khai và Quản trị Hệ thống Phần mềm  
**Đề tài 13:** Website Portfolio / Giới thiệu Cá nhân có Admin CMS  
**Sinh viên thực hiện:** Nguyễn Hữu Đức  

---

## 1. Giới thiệu Hệ thống Logging
Hệ thống sử dụng **Grafana Loki** kết hợp cùng **Promtail** để thu thập, phân tích và lưu trữ log tập trung từ các container (Nginx Reverse Proxy, Web Application, MySQL...).

- **Loki Service URL:** `http://localhost:3100` (nội bộ: `http://loki:3100`)
- **Promtail Service:** Đọc log access/error của Nginx và stdout/stderr của Docker container.
- **Giao diện truy vấn:** Truy cập Grafana tại `http://localhost:3001` -> Menu bên trái chọn **Explore** -> Chọn Datasource **Loki**.

---

## 2. Danh sách 5 Câu truy vấn LogQL mẫu

### Câu truy vấn 1: Lọc toàn bộ Access Log của Nginx qua Reverse Proxy
- **Mục đích:** Kiểm tra lưu lượng truy cập của người dùng từ bên ngoài đi qua Nginx Reverse Proxy.
- **Cú pháp LogQL:**
  ```logql
  {job="nginx"}
  ```
- **Giải thích:**
  - `job="nginx"`: Nhãn (label) do Promtail gán cho file log `/var/log/nginx/*.log`.
  - Kết quả trả về danh sách các bản ghi truy cập có cấu trúc JSON bao gồm: `timestamp`, `remote_addr`, `request_method`, `request_uri`, `status`, `request_time`.

---

### Câu truy vấn 2: Truy vấn các yêu cầu có mã lỗi HTTP (4xx hoặc 5xx)
- **Mục đích:** Phát hiện các lỗi truy cập trang không tồn tại (404), lỗi phân quyền (401/403) hoặc lỗi máy chủ (500/502).
- **Cú pháp LogQL:**
  ```logql
  {job="nginx"} | json | status >= 400
  ```
- **Giải thích:**
  - `{job="nginx"}`: Lấy nguồn log Nginx.
  - `| json`: Parser JSON tự động bóc tách các trường trong chuỗi log.
  - `| status >= 400`: Bộ lọc so sánh số nguyên, chỉ giữ lại các request có mã phản hồi từ 400 trở lên.

---

### Câu truy vấn 3: Truy vết các lượt Đăng nhập vào trang Quản trị (Admin CMS)
- **Mục đích:** Giám sát an ninh, phát hiện các lần gọi API xác thực đăng nhập `/api/auth/login` để đề phòng dò mật khẩu (Brute Force).
- **Cú pháp LogQL:**
  ```logql
  {job=~"nginx|docker-containers"} |= "/api/auth/login"
  ```
- **Giải thích:**
  - `{job=~"nginx|docker-containers"}`: Sử dụng Regex để quét trên cả log proxy và stdout của Web App container.
  - `|= "/api/auth/login"`: Line filter tìm chính xác chuỗi endpoint đăng nhập.

---

### Câu truy vấn 4: Giám sát các tin nhắn gửi qua Form Liên hệ (Contact API)
- **Mục đích:** Kiểm tra xem khách thăm quan đã gửi tin nhắn liên hệ nào qua endpoint `/api/contact`.
- **Cú pháp LogQL:**
  ```logql
  {job=~"nginx|docker-containers"} |= "POST /api/contact"
  ```
- **Giải thích:**
  - Lọc tất cả các method `POST` gửi tới route `/api/contact`.
  - Giúp quản trị viên đối soát với số lượng tin nhắn trong bảng `messages` của MySQL.

---

### Câu truy vấn 5: Đo lường tần suất phát sinh cảnh báo lỗi (Error Rate) theo thời gian
- **Mục đích:** Thống kê số lượng log có chứa từ khóa `error` hoặc `fail` trong 5 phút gần nhất (LogQL Metric Query dạng biểu đồ).
- **Cú pháp LogQL:**
  ```logql
  sum(count_over_time({job=~"nginx|docker-containers"} |~ "(?i)(error|failed|warn)" [5m])) by (job)
  ```
- **Giải thích:**
  - `|~ "(?i)(error|failed|warn)"`: Lọc không phân biệt chữ hoa chữ thường.
  - `count_over_time(... [5m])`: Đếm số lần xuất hiện trong cửa sổ 5 phút.
  - `sum(...) by (job)`: Gom nhóm kết quả theo từng dịch vụ để hiển thị dạng Time Series Chart trên Grafana.

---

## 3. Cách chụp ảnh minh chứng đưa vào Báo cáo
1. Mở trình duyệt vào `http://localhost:3001` (đăng nhập: `admin` / `GrafanaAdmin@2024Secure!`).
2. Vào **Explore** (biểu tượng La bàn), góc trên cùng chọn datasource **Loki**.
3. Dán lần lượt các câu lệnh LogQL ở trên vào ô **Query** và bấm **Run Query** (góc trên bên phải).
4. Chụp lại ảnh màn hình hiển thị cả thanh câu lệnh và các dòng log được trả về.
