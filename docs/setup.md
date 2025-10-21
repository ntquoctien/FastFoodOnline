# Hướng dẫn cài đặt & chạy FastFoodOnline

## 1. Yêu cầu hệ thống
- Node.js 18+ (nếu chạy local không dùng Docker)
- Docker Desktop (nếu chạy bằng Docker)
- MongoDB (tuỳ chọn nếu không dùng Docker service `mongo`)

## 2. Chạy bằng Docker (khuyến nghị)
1. Mở terminal tại thư mục gốc dự án.
2. Chạy:
   - `docker compose up -d --build`
3. Kiểm tra dịch vụ:
   - Backend: http://localhost:4000 (GET `/` -> "API Working")
   - Frontend: http://localhost:5173
   - Admin: http://localhost:5174
   - MongoDB: cổng 27017

Gỡ dịch vụ:
- `docker compose down -v` (xóa cả volume mongo-data)

## 3. Chạy local bằng Node.js
### 3.1 Backend
- Tạo file `backend/.env` với nội dung ví dụ:
```
PORT=4000
MONGO_URL=mongodb://localhost:27017/fooddeliverydb
SALT=10
JWT_SECRET=your_jwt_secret
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

### 3.3 Admin
```
cd admin
npm install
npm run dev
```
- Truy cập http://localhost:5174

## 4. Seed dữ liệu mẫu
```
cd backend
# đảm bảo .env trỏ đúng MONGO_URL
node scripts/seedV2.js
```

## 5. Upload ảnh
- API nhận multipart ở `POST /api/v2/menu/foods` với field `image`.
- Ảnh lưu vào `backend/uploads/` và truy cập qua đường dẫn `/images/<filename>`.

## 6. Lỗi thường gặp
- Kết nối Mongo thất bại: kiểm tra `MONGO_URL` và Mongo đang chạy.
- Ảnh không hiển thị: kiểm tra đã mount volume `backend/uploads` và truy cập đúng URL `/images/...`.
- 401/403 khi gọi API: đảm bảo gửi `Authorization: Bearer <token>` và tài khoản có quyền phù hợp.
