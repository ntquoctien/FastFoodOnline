# ARCHITECTURE DESIGN - FastFoodOnline

## SYSTEM OVERVIEW

FastFoodOnline là một nền tảng đặt đồ ăn nhanh trực tuyến được xây dựng trên **MERN Stack** (MongoDB, Express, React, Node.js).

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐         ┌────────────────────┐          │
│  │   Frontend (User)  │         │  Admin Dashboard   │          │
│  │   React (Vite)     │         │   React (Vite)     │          │
│  │   Port: 5173       │         │   Port: 5174       │          │
│  │                    │         │                    │          │
│  │  - Home            │         │  - Food Management │          │
│  │  - Menu            │         │  - Order Management│          │
│  │  - Cart            │         │  - User Management │          │
│  │  - Checkout        │         │  - Statistics      │          │
│  │  - My Orders       │         │  - Reports         │          │
│  │  - Profile         │         │                    │          │
│  └────────┬───────────┘         └────────┬───────────┘          │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTP/HTTPS
                           │ REST API
┌──────────────────────────▼───────────────────────────────────────┐
│                      APPLICATION LAYER                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │             Backend API Server                           │    │
│  │             Node.js + Express.js                         │    │
│  │             Port: 4000                                   │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │              API Routes                            │ │    │
│  │  │  /api/v2/user     - Authentication                 │ │    │
│  │  │  /api/v2/menu     - Food Management                │ │    │
│  │  │  /api/v2/cart     - Cart Operations                │ │    │
│  │  │  /api/v2/order    - Order Processing               │ │    │
│  │  │  /api/v2/payment  - Payment Integration            │ │    │
│  │  │  /api/v2/branch   - Branch Management              │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │              Middleware                            │ │    │
│  │  │  - authMiddleware (JWT verification)               │ │    │
│  │  │  - multer (File upload)                            │ │    │
│  │  │  - cors (Cross-origin)                             │ │    │
│  │  │  - errorHandler                                    │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │              Services                              │ │    │
│  │  │  - userService     - User business logic           │ │    │
│  │  │  - orderService    - Order processing              │ │    │
│  │  │  - paymentService  - Payment handling              │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │              Utils                                 │ │    │
│  │  │  - vnpay.js       - VNPAY integration              │ │    │
│  │  │  - stripe.js      - Stripe integration             │ │    │
│  │  │  - momo.js        - MoMo integration               │ │    │
│  │  │  - cloudinary.js  - Image upload                   │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │ Mongoose ODM
┌───────────────────────────▼───────────────────────────────────────┐
│                       DATA LAYER                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MongoDB Database                           │    │
│  │              (Atlas / Local)                            │    │
│  │                                                          │    │
│  │  Collections:                                           │    │
│  │  - users          - User accounts                       │    │
│  │  - foods          - Food items                          │    │
│  │  - categories     - Food categories                     │    │
│  │  - orders         - Customer orders                     │    │
│  │  - branches       - Store branches                      │    │
│  │  - notifications  - System notifications                │    │
│  │  - drones         - Delivery drones (optional)          │    │
│  │  - missions       - Drone missions (optional)           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## THIRD-PARTY INTEGRATIONS

```
┌──────────────────────────────────────────────────────────┐
│              External Services                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │  Payment        │    │  File Storage   │            │
│  │  Gateways       │    │                 │            │
│  │                 │    │  Cloudinary     │            │
│  │  - VNPAY        │    │  - Image Upload │            │
│  │  - Stripe       │    │  - CDN          │            │
│  │  - MoMo         │    │                 │            │
│  └─────────────────┘    └─────────────────┘            │
│                                                           │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │  Email Service  │    │  SMS Service    │            │
│  │  (Optional)     │    │  (Optional)     │            │
│  │                 │    │                 │            │
│  │  - NodeMailer   │    │  - Twilio       │            │
│  └─────────────────┘    └─────────────────┘            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## TECHNOLOGY STACK

### Frontend (Client)
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: Context API / React Hooks
- **HTTP Client**: Axios
- **Styling**: CSS3, Tailwind (optional)

### Backend (Server)
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Validation**: express-validator (optional)

### Database
- **Database**: MongoDB 6.x
- **ODM**: Mongoose
- **Connection**: MongoDB Atlas / Local

### Third-party Services
- **Payment**: VNPAY, Stripe, MoMo
- **Storage**: Cloudinary
- **Email**: NodeMailer (optional)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **API Testing**: Postman, Thunder Client
- **Database GUI**: MongoDB Compass

---

## API STRUCTURE

### Authentication APIs
```
POST   /api/v2/user/register    - Đăng ký tài khoản
POST   /api/v2/user/login       - Đăng nhập
GET    /api/v2/user/profile     - Xem profile (Protected)
PUT    /api/v2/user/profile     - Cập nhật profile (Protected)
POST   /api/v2/user/logout      - Đăng xuất (Protected)
```

### Menu APIs
```
GET    /api/v2/menu/foods       - Lấy danh sách món ăn
GET    /api/v2/menu/foods/:id   - Lấy chi tiết món ăn
POST   /api/v2/menu/foods       - Thêm món ăn (Admin)
PUT    /api/v2/menu/foods/:id   - Cập nhật món ăn (Admin)
DELETE /api/v2/menu/foods/:id   - Xóa món ăn (Admin)
```

### Cart APIs
```
POST   /api/v2/cart/add         - Thêm vào giỏ (Protected)
POST   /api/v2/cart/remove      - Xóa khỏi giỏ (Protected)
GET    /api/v2/cart             - Xem giỏ hàng (Protected)
```

### Order APIs
```
POST   /api/v2/order/create     - Tạo đơn hàng (Protected)
GET    /api/v2/order/user       - Lịch sử đơn hàng (Protected)
GET    /api/v2/order/:id        - Chi tiết đơn hàng (Protected)
PUT    /api/v2/order/:id/status - Cập nhật trạng thái (Admin)
DELETE /api/v2/order/:id        - Hủy đơn hàng (Protected)
```

### Payment APIs
```
POST   /api/v2/payment/vnpay/create     - Tạo payment VNPAY
GET    /api/v2/payment/vnpay/return     - VNPAY callback
POST   /api/v2/payment/stripe/create    - Tạo payment Stripe
GET    /api/v2/payment/stripe/success   - Stripe callback
POST   /api/v2/payment/momo/create      - Tạo payment MoMo
GET    /api/v2/payment/momo/return      - MoMo callback
```

---

## DATA FLOW

### 1. User Registration Flow
```
User → Frontend
       ↓ POST /api/v2/user/register
       Backend (Validate input)
       ↓ Hash password with bcrypt
       MongoDB (Save user)
       ↓ Generate JWT token
       Frontend (Store token in localStorage)
       ↓ Redirect to home
```

### 2. Order Creation Flow
```
User → Cart (Frontend)
       ↓ Add items
       Cart (Update state)
       ↓ POST /api/v2/cart/add
       Backend (authMiddleware verify token)
       ↓ Update user.cartData
       MongoDB (Save)
       ↓ Checkout
       POST /api/v2/order/create
       ↓ Validate items, calculate total
       MongoDB (Create order)
       ↓ If payment online
       Redirect to payment gateway
       ↓ Payment success
       Update order.paymentStatus = "PAID"
       ↓ Notification to admin
```

### 3. Payment Flow (VNPAY)
```
User → Click "Pay with VNPAY"
       ↓ POST /api/v2/payment/vnpay/create
       Backend (Create payment URL with signature)
       ↓ Redirect to VNPAY
       User completes payment
       ↓ VNPAY redirect to /api/v2/payment/vnpay/return
       Backend (Verify signature)
       ↓ Update order.paymentStatus
       MongoDB (Save)
       ↓ Redirect to order confirmation page
```

---

## SECURITY

### Authentication
- **JWT Token**: Stored in localStorage
- **Token Expiry**: 1 hour (configurable)
- **Password**: Hashed with bcrypt (salt rounds: 10)

### Authorization
- **Middleware**: authMiddleware verifies token
- **Role-based**: admin, user, staff roles
- **Protected Routes**: Require valid token

### Input Validation
- **Email**: Regex validation
- **Password**: Minimum 6 characters
- **Sanitization**: Prevent NoSQL injection

### CORS
- **Allowed Origins**: Frontend URLs
- **Methods**: GET, POST, PUT, DELETE
- **Credentials**: true

---

## DEPLOYMENT

### Development Environment
```
npm run dev          # Run all services (concurrently)
npm run server       # Backend only
npm run admin        # Admin dashboard only
```

### Production Environment
- **Backend**: Deploy to Heroku / AWS / DigitalOcean
- **Frontend**: Deploy to Vercel / Netlify
- **Database**: MongoDB Atlas
- **Environment Variables**: .env file (not committed)

### Environment Variables (.env)
```
PORT=4000
MONGO_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
VNP_TMN_CODE=...
VNP_HASH_SECRET=...
STRIPE_SECRET_KEY=...
MOMO_PARTNER_CODE=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## SCALABILITY

### Horizontal Scaling
- **Load Balancer**: Nginx / AWS ELB
- **Multiple Instances**: PM2 cluster mode
- **Database**: MongoDB sharding (if needed)

### Caching
- **Redis**: Cache frequently accessed data (optional)
- **CDN**: Cloudinary for images

### Optimization
- **Database Indexes**: On frequently queried fields
- **Image Optimization**: Compress before upload
- **Lazy Loading**: Frontend images and components

---

**Version**: 1.0  
**Date**: 17-Dec-2025  
**Architect**: Development Team

