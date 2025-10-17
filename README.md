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
- Stripe Payment Integration
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

You can spin up the complete stack with Docker:

1. Build and start the services:
   ```bash
   docker compose up --build
   ```
   The stack exposes the frontend at `http://localhost:5173`, the admin panel at `http://localhost:5174`, and the API at `http://localhost:4000`.
2. Seed default accounts (one customer and one admin):
   ```bash
   docker compose exec backend node scripts/seedUsers.js
   ```
   This creates/updates:
   - Customer: `user@example.com` / `user1234`
   - Admin: `admin@example.com` / `admin1234`
3. Kết nối MongoDB từ host (Compass, mongosh, v.v.) qua `mongodb://localhost:27017/fooddeliverydb`. Cổng 27017 đã được
   publish nên bạn có thể xem/sửa dữ liệu trực tiếp mà không cần vào container.

To rebuild after code changes you can run `docker compose up --build` again, or `docker compose up` if the images are already built.

## Run Locally

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
  STRIPE_SECRET_KEY=YOUR_KEY
 ```

Setup the Frontend and Backend URL
   - App.jsx in Admin folder
      const url = YOUR_BACKEND_URL
     
  - StoreContext.js in Frontend folder
      const url = YOUR_BACKEND_URL

  - orderController in Backend folder
      const frontend_url = YOUR_FRONTEND_URL 

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

### Seed accounts without Docker

If you are running the stack manually, you can still create the default users with:

```bash
cd backend
node scripts/seedUsers.js
```

The script uses `backend/.env` for connection settings and updates/creates the same credentials listed above.
## Tech Stack
* [React](https://reactjs.org/)
* [Node.js](https://nodejs.org/en)
* [Express.js](https://expressjs.com/)
* [Mongodb](https://www.mongodb.com/)
* [Stripe](https://stripe.com/)
* [JWT-Authentication](https://jwt.io/introduction)
* [Multer](https://www.npmjs.com/package/multer)

## Deployment

The application is deployed on Render.

## Contributing

Contributions are always welcome!
Just raise an issue, and we will discuss it.

## Feedback

If you have any feedback, please reach out to me [here](https://www.linkedin.com/in/muhammad-shan-full-stack-developer/)
