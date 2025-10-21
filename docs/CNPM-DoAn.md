# ĐỒ ÁN MÔN HỌC: XÂY DỰNG HỆ THỐNG FASTFOODONLINE

Ngày cập nhật: 2025-10-21

## 1. Giới thiệu
- Dự án FastFoodOnline gồm 3 thành phần chính: Backend (Express + MongoDB), Frontend (React + Vite) và Admin Portal (React + Vite).
- Mục tiêu: Xây dựng nền tảng đặt món online cho chuỗi cửa hàng ăn nhanh với nhiều chi nhánh, quản lý menu/biến thể theo chi nhánh, tồn kho, đơn hàng và vận chuyển.

## 2. Kiến trúc & Triển khai
- Kiến trúc: client (frontend) và admin gọi API REST của backend. Backend kết nối MongoDB.
- Docker compose cung cấp 4 services: mongo, backend (port 4000), frontend (5173), admin (5174). Mongo khởi tạo DB `fooddeliverydb`.
- Biến môi trường chính:
  - Backend: `PORT` (mặc định 4000), `MONGO_URL` (đặt trong docker compose trỏ tới `mongodb://mongo:27017/fooddeliverydb`), `SALT` (rounds cho bcrypt), các khóa thanh toán (nếu dùng Stripe).
  - Frontend/Admin: `VITE_API_URL` (ví dụ http://localhost:4000), `VITE_PORT` (5173/5174).

## 3. Backend
- Framework: Express 4, Mongoose 8, JWT, Multer, Stripe (tuỳ chọn), CORS.
- Điểm vào: `backend/server.js`.
- Middlewares: `express.json()`, `cors()`, `authMiddleware` cho các tuyến cần xác thực.
- Static: `/images` phục vụ từ thư mục `backend/uploads`.
- Các route chính:
  - v1: `/api/food`, `/api/user`, `/api/cart`, `/api/order`.
  - v2: `/api/v2/menu`, `/api/v2/orders`, `/api/v2/inventory`, `/api/v2/shippers`, `/api/v2/branches`.

### 3.1 Mô hình dữ liệu (v2)
- Restaurant: name, description, phone, email, logoUrl, cuisine, isActive.
- Branch: restaurantId, name, địa chỉ, tọa độ, isPrimary, isActive. Unique (restaurantId, name) khi đang active.
- Category: restaurantId, name, description, isActive. Unique (restaurantId, name).
- Food: categoryId, name, description, imageUrl, isActive. Unique (categoryId, name).
- FoodVariant: foodId, branchId, size, price, isDefault, isActive. Unique (foodId, branchId, size).
- Inventory: branchId, foodVariantId, quantity, updatedAt.
- Order: userId, branchId, items[{foodVariantId, title, size, quantity, unitPrice, totalPrice}], address, subtotal, deliveryFee, totalAmount, status, paymentStatus, timeline.
- Payment: orderId, provider[stripe|momo|zalopay|cash|card], transactionId, amount, status, paidAt, meta.
- ShipperProfile: userId, branchId, vehicleType, licensePlate, status[available|busy|inactive].
- DeliveryAssignment: orderId, shipperId, status[assigned|picked|delivered|cancelled], các mốc thời gian.

### 3.2 API v2 (tóm tắt)
- Menu `/api/v2/menu`
  - GET `/default?branchId=`: Lấy menu mặc định theo chi nhánh.
  - POST `/categories` (admin): Tạo Category.
  - POST `/foods` (admin, multipart: image + fields): Tạo Food và biến thể.
  - DELETE `/foods/:foodId` (admin): Ẩn/archived món.
- Orders `/api/v2/orders`
  - POST `/` (auth): Tạo đơn từ {branchId, items[], address}.
  - GET `/me` (auth): Liệt kê đơn của người dùng hiện tại.
  - POST `/confirm-payment` (auth): Xác nhận thanh toán.
  - POST `/pay/stripe` (auth): Khởi tạo thanh toán Stripe.
  - GET `/` (auth, role-aware): Admin/branch_manager xem tất cả đơn; filter `?branchId=`.
  - PATCH `/:orderId/status` (auth): Cập nhật trạng thái đơn.
- Inventory `/api/v2/inventory`
  - GET `/` (auth): Xem tồn kho theo `?branchId=`.
  - POST `/` (auth): Cập nhật tồn kho {branchId, foodVariantId, quantity}.
- Shippers `/api/v2/shippers`
  - GET `/` (auth): Danh sách shipper.
  - PATCH `/:shipperId/status` (auth): Cập nhật trạng thái shipper.
- Branches `/api/v2/branches` (admin)
  - GET `/`: Danh sách chi nhánh (hỗ trợ `?includeInactive=true`).
  - POST `/`: Tạo chi nhánh.
  - PUT `/:branchId`: Cập nhật chi nhánh.
  - DELETE `/:branchId`: Xóa chi nhánh.

### 3.3 Seed dữ liệu & tài khoản mặc định
- Script: `backend/scripts/seedV2.js`.
- Tạo 1 Restaurant "Tomato Express", 2 Branch (Central Kitchen, Downtown Hub), 2 Category (Pizza, Beverages), 3 Food (Margherita, Pepperoni, Lemonade) và nhiều FoodVariant.
- Tài khoản mặc định:
  - Admin: email `admin@example.com`, mật khẩu `admin1234`.
  - Quản lý chi nhánh: `branch.manager@example.com`, mật khẩu `branch1234`, gắn `Central Kitchen`.
  - Khách hàng: `user@example.com`, mật khẩu `user1234`.

## 4. Frontend & Admin
- Công nghệ: React 18, Vite 5, react-router-dom, axios, react-toastify.
- Frontend: cổng 5173. Admin: cổng 5174. Cấu hình qua biến `VITE_API_URL`.
- Các trang chính (frontend): Trang chủ, menu, giỏ hàng, đặt hàng, đơn của tôi, xác thực.
- Admin: quản lý danh mục/món (upload ảnh), tồn kho, đơn hàng, shipper, chi nhánh, nhân sự.

## 5. Hướng dẫn chạy
### 5.1 Chạy nhanh bằng Docker
- Yêu cầu: Docker Desktop.
- Tại thư mục gốc dự án, chạy: `docker compose up -d --build`.
- Truy cập: Backend http://localhost:4000, Frontend http://localhost:5173, Admin http://localhost:5174, MongoDB cổng 27017.
- Seed dữ liệu (tuỳ chọn, khi chạy local Node): dùng script seedV2 (xem 5.2).

### 5.2 Chạy local bằng Node.js
- Yêu cầu: Node 18+, MongoDB đang chạy (hoặc dùng Docker service `mongo`).
- Backend: đặt `.env` với `MONGO_URL`, `PORT`, `SALT`. Chạy `npm i` rồi `npm run server` trong thư mục `backend/`.
- Frontend/Admin: trong mỗi thư mục `frontend/` và `admin/`, chạy `npm i` rồi `npm run dev`.
- Seed: trong `backend/`, đảm bảo `.env` hợp lệ, chạy `node scripts/seedV2.js`.

## 6. Bảo mật & phân quyền (tóm tắt)
- Xác thực: JWT qua middleware `auth.js` cho các router v2.
- Phân quyền: Admin bắt buộc cho thao tác quản trị (menu, branches). `orderService` kiểm tra role khi liệt kê/cập nhật đơn.
- Lưu trữ ảnh: Multer lưu vào `backend/uploads`, truy cập qua `/images/<filename>`.

## 7. Phụ lục
- Danh mục dependencies Backend: bcrypt, body-parser, cors, dotenv, express, jsonwebtoken, mongoose, multer, nodemon, stripe, validator.
- Cổng dịch vụ mặc định: 4000 (API), 5173 (frontend), 5174 (admin), 27017 (MongoDB).
