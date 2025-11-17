# TOMATO - Food Ordering Website

This repository hosts the source code for TOMATO, a dynamic food ordering website built with the MERN Stack. It offers a user-friendly platform for seamless online food ordering.

## Demo

- User Panel: [https://food-delivery-frontend-s2l9.onrender.com/](https://food-delivery-frontend-s2l9.onrender.com/)
- Admin Panel: [https://food-delivery-admin-wrme.onrender.com/](https://food-delivery-admin-wrme.onrender.com/)

## Features

- User Panel
- Admin Panel
- JWT Authentication
- Password Hashing with Bcrypt
- VNPAY Payment Integration
- Stripe Payment Integration
- MoMo Payment Integration
- Login/Signup
- Logout
- Add to Cart
- Place Order
- Order Management
- Products Management
- Filter Food Products
- Login/Signup
- Authenticated APIs
- REST APIs
- Role-Based Identification
- Beautiful Alerts

## Screenshots

![Hero](https://i.ibb.co/59cwY75/food-hero.png)
- Hero Section

![Products](https://i.ibb.co/JnNQPyQ/food-products.png)
- Products Section

![Cart](https://i.ibb.co/t2LrQ8p/food-cart.png)
- Cart Page

![Login](https://i.ibb.co/s6PgwkZ/food-login.png)
- Login Popup

## Docker Compose Setup

You can spin up the complete stack (frontend + backend + admin + MongoDB) with Docker:

1. Build và chạy toàn bộ dịch vụ:
   ```bash
   npm run docker:up
   ```
   The stack exposes the frontend at `http://localhost:5173`, the admin panel at `http://localhost:5174`, and the API at `http://localhost:4000`.
   > Tương đương với `docker compose up --build` nếu bạn không muốn dùng script npm.
2. Kết nối MongoDB từ host (Compass, mongosh, v.v.) qua `mongodb://localhost:27017/fooddeliverydb`. Cổng 27017 đã được
   publish nên bạn có thể xem/sửa dữ liệu trực tiếp mà không cần vào container.
3. Dừng stack khi không dùng nữa:
   ```bash
   npm run docker:down
   ```

To rebuild after code changes you can run `docker compose up --build` again, or `docker compose up` if the images are already built.

### Troubleshooting Mongo Connection
- Backend container load `backend/.env`; hãy chắc chắn `MONGO_URL` chính xác (Atlas hoặc local). Muốn dùng Mongo container nội bộ, đặt `MONGO_URL=mongodb://mongo:27017/fooddeliverydb`.
- If you start the API manually, prefer `npm run server --prefix backend` (or `cd backend && npm run server`) so nodemon watches the right paths.
- Với Docker Compose, kiểm tra `backend` đã thấy Atlas bằng log `docker compose logs backend`. Nếu dùng Mongo container, xem trạng thái bằng `docker compose logs mongo`.
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
