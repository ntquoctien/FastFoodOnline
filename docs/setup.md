# Hướng dẫn cài đặt & chạy FastFoodOnline

## 1. Yêu cầu hệ thống
- Node.js 18+ (nếu chạy local không dùng Docker)
- Docker Desktop (nếu chạy bằng Docker)
- Tài khoản MongoDB Atlas hoặc một connection string MongoDB hợp lệ (điền vào `backend/.env` qua biến `MONGO_URL`)

## 2. Chạy bằng Docker (khuyến nghị)
1. Mở terminal tại thư mục gốc dự án.
2. Chạy:
   - `docker compose up -d --build`
3. Kiểm tra dịch vụ:
   - Backend: http://localhost:4000 (GET `/` -> "API Working")
   - Frontend: http://localhost:5173
   - Admin: http://localhost:5174
   - MongoDB: kết nối bằng `MONGO_URL` (Atlas). Stack không mở cổng 27017 local.

Gỡ dịch vụ:
- `docker compose down`

## 3. Chạy local bằng Node.js
### 3.1 Backend
- Tạo file `backend/.env` với nội dung ví dụ:
```
PORT=4000
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster-host>/fooddeliverydb
SALT=10
JWT_SECRET=your_jwt_secret
MAPTILER_KEY=oFQ2QWBEZhgrPxVs2Ewh
```
- Cài dependencies và chạy:
```
cd backend
npm install
npm run server
```
- Mặc định API chạy http://localhost:4000

### 3.2 Frontend
```
cd frontend
npm install
npm run dev
```
- Truy cập http://localhost:5173
- Đặt `VITE_API_URL` (qua môi trường hoặc `.env`) nếu cần.
- Map tiles (Leaflet/MapTiler): dùng style `https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.png?key=oFQ2QWBEZhgrPxVs2Ewh` hoặc viewer `https://api.maptiler.com/maps/openstreetmap/?key=oFQ2QWBEZhgrPxVs2Ewh#0.7/22.80535/2.86559`.

### 3.3 Admin
```
cd admin
npm install
npm run dev
```
- Truy cập http://localhost:5174

## 4. Upload ảnh
- API nhận multipart ở `POST /api/v2/menu/foods` với field `image`.
- Ảnh lưu vào `backend/uploads/` và truy cập qua đường dẫn `/images/<filename>`.

## 5. Lỗi thường gặp
- Kết nối Mongo thất bại: kiểm tra `MONGO_URL`, whitelist IP trên Atlas hoặc chắc chắn instance tự host đang hoạt động.
- Ảnh không hiển thị: kiểm tra đã mount volume `backend/uploads` và truy cập đúng URL `/images/...`.
- 401/403 khi gọi API: đảm bảo gửi `Authorization: Bearer <token>` và tài khoản có quyền phù hợp.
