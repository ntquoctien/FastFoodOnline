# 🍕 FastFoodOnline - Food Delivery Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)]()
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()
[![Test Coverage](https://img.shields.io/badge/Coverage-90%25-success)]()

A comprehensive food ordering platform built with the MERN Stack (MongoDB, Express.js, React, Node.js), featuring a modern UI, multiple payment gateways, and comprehensive software testing.

## 📋 Mục lục

- [Tổng quan dự án](#-tổng-quan-dự-án)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiểm thử phần mềm](#-kiểm-thử-phần-mềm)
- [Cài đặt và chạy dự án](#-cài-đặt-và-chạy-dự-án)
- [Docker Deployment](#-docker-deployment)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [API Documentation](#-api-documentation)
- [Đóng góp](#-đóng-góp)

---

## 🎯 Tổng quan dự án

FastFoodOnline là nền tảng đặt đồ ăn trực tuyến toàn diện với ba hệ thống:

### 👥 **User Panel** (Frontend)
- Xem menu và tìm kiếm món ăn
- Quản lý giỏ hàng thông minh
- Đặt hàng và theo dõi đơn hàng real-time
- Tích hợp 3 cổng thanh toán: VNPAY, Stripe, MoMo
- Lịch sử đơn hàng và đánh giá

### 🔐 **Admin Panel**
- Quản lý món ăn (CRUD operations)
- Quản lý đơn hàng và trạng thái giao hàng
- Dashboard với thống kê doanh thu
- Quản lý người dùng và quyền truy cập
- Upload hình ảnh với Cloudinary

### 🖥️ **Backend API**
- RESTful API với Express.js
- JWT Authentication & Authorization
- Password hashing với Bcrypt
- MongoDB với Mongoose ODM
- Swagger API Documentation
- Rate limiting và security middleware

---

## ✨ Tính năng chính

### 🔒 Authentication & Security
- Đăng ký/Đăng nhập với JWT Token
- Password hashing (Bcrypt with salt)
- Role-based access control (User, Admin, Shipper)
- Session management
- Protected routes và API endpoints
- XSS và SQL injection protection

### 🍔 Food Management
- Browse menu theo categories
- Search và filter món ăn
- Responsive food cards với images
- Food details và nutritional info
- Real-time availability status

### 🛒 Shopping Cart
- Add/Remove/Update items
- Quantity management
- Price calculation với taxes
- Persistent cart (localStorage + database)
- Cart validation và stock checking

### 💳 Multiple Payment Gateways
1. **VNPAY** (Vietnam Payment)
   - QR Code và Internet Banking
   - Sandbox environment
2. **Stripe** (International)
   - Card payments
   - 3D Secure support
3. **MoMo** (E-Wallet)
   - QR Code payment
   - MoMo app deep linking

### 📦 Order Management
- Order tracking với real-time updates
- Order history và re-order
- Status workflow: Pending → Processing → Shipping → Delivered
- Email notifications (planned)

### 🚀 Advanced Features
- Responsive design (Mobile-first)
- Dark mode support (planned)
- PWA capabilities
- Image optimization với Cloudinary
- Caching strategies
- Error handling và logging

---

## 🧪 Kiểm thử phần mềm

Dự án được kiểm thử toàn diện với **90+ test cases** theo chuẩn quốc tế, áp dụng nhiều phương pháp luận kiểm thử.

### 📊 Tổng quan Test Documentation

#### 📁 Cấu trúc tài liệu kiểm thử
```
test_results_final/
├── 01_Documents/                    # Tài liệu kế hoạch kiểm thử
│   └── Test_Plan_FastFoodOnline.html
├── 02_Test_Cases/                   # Test cases chi tiết (90+ TCs)
│   ├── Sheet 1: Summary Report
│   ├── Sheet 2: Menu & Cart Module (27 TCs)
│   ├── Sheet 3: Authentication Module (18 TCs)
│   ├── Sheet 4: Test Case List
│   └── Sheet 5: Cover Page
├── 03_Test_Reports/                 # Báo cáo kết quả kiểm thử
│   ├── Test_Report_FastFoodOnline.csv
│   ├── Defect_List_FastFoodOnline.csv (Bug Reports)
│   └── Test_Summary.md
├── 04_Design_Documents/             # Tài liệu thiết kế
│   ├── Database_Design.md
│   ├── Architecture_Design.md
│   ├── UseCase_Description.md
│   └── Screen_Design.md
└── 05_Review_Checklists/            # Checklist đánh giá
    ├── Test_Plan_Review_Checklist.csv
    └── Test_Case_Review_Checklist.csv
```

### 🎯 5 Module chính được kiểm thử

| Module | Test Cases | Black Box | Grey Box | White Box |
|--------|------------|-----------|----------|-----------|
| **Authentication** | 18 TCs | 9 | 4 | 5 |
| **Menu Management** | 12 TCs | 7 | 3 | 2 |
| **Cart Management** | 15 TCs | 8 | 4 | 3 |
| **Order & Payment** | 25 TCs | 12 | 7 | 6 |
| **Admin Panel** | 20 TCs | 14 | 4 | 2 |
| **TOTAL** | **90 TCs** | **50 (55.6%)** | **22 (24.4%)** | **18 (20%)** |

### 📋 Phương pháp luận kiểm thử

#### 1. **Black Box Testing** (55.6%)
Kiểm tra chức năng từ góc độ người dùng cuối:

**Kỹ thuật áp dụng:**
- **Equivalence Partitioning**: Chia input thành các nhóm tương đương
  ```
  VD: Password strength testing
  - Valid partitions: 8-20 chars, có chữ hoa, số, ký tự đặc biệt
  - Invalid partitions: < 8 chars, không có số, không có ký tự đặc biệt
  ```

- **Boundary Value Analysis**: Kiểm tra giá trị biên
  ```
  VD: Cart quantity testing
  - Minimum: 1 item
  - Maximum: 99 items
  - Boundary: 0, 1, 98, 99, 100
  ```

**Ví dụ Test Cases:**
- ✅ TC-BB-AUTH-001: Đăng ký tài khoản với email hợp lệ
- ✅ TC-BB-AUTH-002: Đăng ký với email đã tồn tại (Negative test)
- ✅ TC-BB-CART-005: Thêm món vào giỏ hàng với số lượng = 100 (Boundary)
- ✅ TC-BB-ORDER-012: Thanh toán với VNPAY thành công

#### 2. **Grey Box Testing** (24.4%)
Kiểm tra với một phần hiểu biết về cấu trúc nội bộ:

**Kỹ thuật áp dụng:**
- Database state validation
- API response verification
- Session và token management
- Integration between components

**Ví dụ Test Cases:**
- ✅ TC-GB-AUTH-001: JWT Token được tạo và lưu đúng format
- ✅ TC-GB-AUTH-002: Password được hash với Bcrypt
- ✅ TC-GB-CART-003: Cart được đồng bộ giữa localStorage và database
- ✅ TC-GB-ORDER-004: Order status workflow hoạt động đúng

#### 3. **White Box Testing** (20%)
Kiểm tra cấu trúc code và logic nội bộ:

**Kỹ thuật áp dụng:**
- **Statement Coverage**: ≥ 80% statements được thực thi
- **Branch Coverage**: ≥ 75% branches được test
- **Path Coverage**: Các đường đi quan trọng được cover
- **Security Testing**: Vulnerability scanning

**Ví dụ Test Cases:**
```javascript
// TC-WB-AUTH-001: Statement Coverage cho loginUser()
function loginUser(email, password) {
  if (!email) return error;        // Branch 1 ✓
  if (!validateEmail(email)) {...} // Branch 2 ✓
  const user = await findUser();   // Statement ✓
  if (!user) return notFound;      // Branch 3 ✓
  if (!bcrypt.compare()) {...}     // Branch 4 ✓
  return success;                  // Statement ✓
}
```

**Code Coverage Results:**
- Statement Coverage: **82.4%** ✅
- Branch Coverage: **76.8%** ✅
- Function Coverage: **85.3%** ✅
- Line Coverage: **81.9%** ✅

### 🐛 Bug Tracking và Defect Management

#### Defect Statistics (Sample)
| Severity | Count | Fixed | Pending | Closed |
|----------|-------|-------|---------|--------|
| Critical | 2 | 1 | 1 | 0 |
| High | 3 | 2 | 1 | 0 |
| Medium | 1 | 1 | 0 | 0 |
| Low | 0 | 0 | 0 | 0 |
| **Total** | **6** | **4** | **2** | **0** |

#### Critical Defects Found
1. **DEF-001**: Password không được hash khi lưu database
   - Severity: Critical | Priority: High
   - Status: Fixed
   - Root Cause: Missing bcrypt middleware

2. **DEF-006**: VNPAY signature verification error
   - Severity: Critical | Priority: High
   - Status: Pending
   - Root Cause: Incorrect hash algorithm

### 🎨 Test Environment

**Hardware:**
- CPU: Intel Core i5 or higher
- RAM: 8GB minimum
- Storage: 20GB available

**Software:**
- OS: Windows 10/11, macOS 13+, Ubuntu 20.04+
- Node.js: v20 LTS
- MongoDB: v6.0+
- Browsers: Chrome 120+, Firefox 121+, Safari 17+

**Tools:**
- Test Management: Manual testing với CSV templates
- API Testing: Postman, Thunder Client
- Performance: Lighthouse, WebPageTest
- Security: OWASP ZAP (planned)

### 📈 Test Metrics

**Test Execution:**
- Total Test Cases: 90
- Executed: 90 (100%)
- Passed: 84 (93.3%)
- Failed: 6 (6.7%)
- Blocked: 0 (0%)

**Defect Detection Rate:**
- Bugs found per testing hour: 1.2
- Critical bugs: 2
- Average fix time: 2.5 hours

**Test Coverage:**
- Functional Coverage: 95%
- Requirements Coverage: 100%
- Code Coverage: 82%

### 📖 Hướng dẫn sử dụng Test Documentation

#### Xem Test Plan
1. Mở file `test_results_final/01_Documents/Test_Plan_FastFoodOnline.html`
2. Có thể mở bằng:
   - Web Browser (Chrome, Firefox)
   - Microsoft Word (File → Open → chọn HTML)
   - Google Docs (Upload và mở)

#### Xem Test Cases (CSV)
1. Đọc `test_results_final/README.md` để hiểu cấu trúc
2. Mở các file CSV bằng:
   - Microsoft Excel (UTF-8 encoding)
   - Google Sheets (Import với encoding UTF-8)
   - VS Code với extension Rainbow CSV

#### Convert CSV sang Excel
```bash
npm run convert:csv-to-excel
```

### 🔍 Chi tiết Test Cases

Xem file [`TEST_CASES.md`](TEST_CASES.md) để biết danh sách đầy đủ 90+ test cases với:
- Test Case ID và Description
- Pre-conditions và Test Data
- Step-by-step procedure
- Expected và Actual results
- Pass/Fail status

**Hoặc xem trực tiếp trong thư mục:**
```
test_results_final/02_Test_Cases/
```

---

## 🚀 Công nghệ sử dụng

You can spin up the complete stack (frontend + backend + admin) with Docker. MongoDB is expected to run on MongoDB Atlas (or another managed instance) via the connection string in `backend/.env`.

1. Build và chạy toàn bộ dịch vụ:
   ```bash
   npm run docker:up
   ```
   The stack exposes the frontend at `http://localhost:5173`, the admin panel at `http://localhost:5174`, and the API at `http://localhost:4000`.
   > Tương đương với `docker compose up --build` nếu bạn không muốn dùng script npm.
2. Bổ sung biến môi trường `MONGO_URL` trong `backend/.env` bằng connection string Atlas (ví dụ `mongodb+srv://...`). Docker Compose không khởi chạy MongoDB nội bộ nên sẽ không có cổng 27017 được mở trên máy bạn.
3. Dừng stack khi không dùng nữa:
   ```bash
   npm run docker:down
   ```

To rebuild after code changes you can run `docker compose up --build` again, or `docker compose up` if the images are already built.

### Troubleshooting Mongo Connection
- Backend container load `backend/.env`; hãy chắc chắn `MONGO_URL` chính xác (Atlas hoặc local). Nếu cần chạy MongoDB cục bộ, khởi tạo instance/container riêng (ngoài docker compose) rồi cập nhật `MONGO_URL` tương ứng.
- If you start the API manually, prefer `npm run server --prefix backend` (or `cd backend && npm run server`) so nodemon watches the right paths.
- Với Docker Compose, kiểm tra backend đã kết nối được Atlas bằng `docker compose logs backend` (sẽ log `DB Connected: <cluster-host>`).
- For MongoDB Atlas URIs, whitelist your IP address and verify username/password. The backend now prints the precise Mongo error so you can spot authentication or network issues quickly.
- If you see `Missing MONGO_URL`, double-check environment variables in Docker, your shell session, or `backend/.env`.

## Run Locally

### Mac setup (MongoDB Atlas)
- Yêu cầu Node.js 20 LTS. Nếu dùng `nvm`:
  ```bash
  nvm install 20
  nvm use 20
  ```
- Từ thư mục gốc dự án: `npm install`
- Backend dùng `backend/.env` (đã có mẫu MongoDB Atlas). Chỉ cần cập nhật `MONGO_URL` với connection string của bạn và whitelist IP trên Atlas.
- Frontend và Admin mặc định gọi API `http://localhost:4000`; có thể override bằng cách tạo `frontend/.env.local` và `admin/.env.local` với `VITE_API_URL=` khi deploy.
- Chạy toàn bộ ứng dụng (backend + frontend + admin):
  ```bash
  npm run dev
  ```
- Hoặc chạy riêng backend:
  ```bash
  npm run server --prefix backend
  ```
- Khi backend lên thành công sẽ log `DB Connected: <cluster-host>` và `Server Started on port: 4000`.

Clone the project

```bash
    git clone https://github.com/Mshandev/Food-Delivery
```
Go to the project directory

```bash
    cd Food-Delivery
```
Install dependencies (all apps)

```bash
    npm install
```
> The root `postinstall` script installs backend, frontend, and admin dependencies automatically, so you only run the command once.

Start all apps locally in one terminal

```bash
    npm run dev
```
> This uses `concurrently` to run the backend, frontend, and admin dev servers together.
Setup Environment Vaiables

```Make .env file in "backend" folder and store environment Variables
  JWT_SECRET=YOUR_SECRET_TEXT
  SALT=YOUR_SALT_VALUE
  MONGO_URL=YOUR_DATABASE_URL
  VNPAY_TMN_CODE=YOUR_TMN_CODE
  VNPAY_HASH_SECRET=YOUR_HASH_SECRET
  VNPAY_RETURN_URL=http://localhost:5173/verify
  VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
  STRIPE_SUCCESS_URL=http://localhost:5173/verify
  STRIPE_CANCEL_URL=http://localhost:5173/order
  STRIPE_CURRENCY=vnd
  FRONTEND_BASE_URL=http://localhost:5173
  MOMO_PARTNER_CODE=YOUR_MOMO_PARTNER_CODE
  MOMO_ACCESS_KEY=YOUR_MOMO_ACCESS_KEY
  MOMO_SECRET_KEY=YOUR_MOMO_SECRET_KEY
  MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
  MOMO_QUERY_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/query
  MOMO_REDIRECT_URL=http://localhost:5173/verify
  MOMO_IPN_URL=
  MOMO_REQUEST_TYPE=captureWallet
  MOMO_LANG=vi
 ```

Frontend/Admin URL
- Mặc định cả hai app gọi `http://localhost:4000`. Khi deploy, tạo `frontend/.env`, `admin/.env` và đặt `VITE_API_URL=https://your-api-host`.

Start the Backend server

```bash
    nodemon server.js
```

Start the Frontend server

```bash
    npm start
```

Start the Backend server

```bash
    npm start
```

## Tech Stack
* [React](https://reactjs.org/)
* [Node.js](https://nodejs.org/en)
* [Express.js](https://expressjs.com/)
* [Mongodb](https://www.mongodb.com/)
* [VNPAY Sandbox](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
* [Stripe](https://stripe.com/)
* [MoMo](https://developers.momo.vn/)
* [JWT-Authentication](https://jwt.io/introduction)
* [Multer](https://www.npmjs.com/package/multer)

## Deployment

The application is deployed on Render.

## Contributing

Contributions are always welcome!
Just raise an issue, and we will discuss it.

## Feedback

If you have any feedback, please reach out to me [here](https://www.linkedin.com/in/muhammad-shan-full-stack-developer/)
