# USE CASE SPECIFICATION - FastFoodOnline

## Actors

### 1. User (Customer)
- Người dùng cuối sử dụng website để đặt đồ ăn
- **Goals**: Browse menu, order food, track delivery

### 2. Admin
- Quản trị viên quản lý hệ thống
- **Goals**: Manage foods, orders, users, view statistics

### 3. Staff
- Nhân viên xử lý đơn hàng
- **Goals**: Update order status, manage inventory

### 4. System
- Hệ thống tự động xử lý
- **Goals**: Process payments, send notifications

---

## USE CASES

### UC-01: Register Account
**Actor**: User  
**Precondition**: User chưa có tài khoản  
**Main Flow**:
1. User truy cập trang đăng ký
2. User nhập thông tin: name, email, password
3. System validate thông tin
4. System hash password
5. System lưu user vào database
6. System tạo JWT token
7. System redirect user về trang chủ

**Alternative Flow**:
- 3a. Email đã tồn tại → Show error "User already exists"
- 3b. Password quá ngắn → Show validation error

---

### UC-02: Login
**Actor**: User  
**Precondition**: User đã có tài khoản  
**Main Flow**:
1. User truy cập trang login
2. User nhập email và password
3. System verify credentials
4. System tạo JWT token
5. System lưu token vào localStorage
6. System redirect về trang chủ

**Alternative Flow**:
- 3a. Sai email/password → Show "Invalid credentials"

---

### UC-03: Browse Menu
**Actor**: User  
**Precondition**: Không có  
**Main Flow**:
1. User truy cập trang menu
2. System lấy danh sách foods từ database
3. System hiển thị foods theo categories
4. User xem danh sách

**Extension**:
- User có thể filter by category
- User có thể search by keyword

---

### UC-04: Add to Cart
**Actor**: User  
**Precondition**: User đã đăng nhập  
**Main Flow**:
1. User chọn món ăn
2. User click "Add to cart"
3. System verify user đã login
4. System thêm item vào user.cartData
5. System cập nhật database
6. System hiển thị cart badge

**Alternative Flow**:
- 3a. User chưa login → Show login popup

---

### UC-05: Checkout & Place Order
**Actor**: User  
**Precondition**: User đã đăng nhập, có items trong cart  
**Main Flow**:
1. User vào trang Cart
2. User click "Proceed to checkout"
3. User nhập địa chỉ giao hàng
4. User chọn phương thức thanh toán (COD/VNPAY/Stripe/MoMo)
5. User click "Place Order"
6. System validate thông tin
7. System tạo order trong database
8. **If payment = COD**:
   - System set paymentStatus = "unpaid"
   - System redirect về "My Orders"
9. **If payment = Online**:
   - System tạo payment URL
   - System redirect đến payment gateway
   - User thanh toán
   - Payment gateway redirect về website
   - System verify payment signature
   - System update paymentStatus = "PAID"
10. System làm rỗng cart
11. System gửi notification cho admin

**Alternative Flow**:
- 6a. Thiếu address → Show validation error
- 9a. Payment failed → Set paymentStatus = "FAILED"

---

### UC-06: View Order History
**Actor**: User  
**Precondition**: User đã đăng nhập  
**Main Flow**:
1. User click "My Orders"
2. System lấy orders của user từ database
3. System hiển thị danh sách orders với status
4. User xem chi tiết order

---

### UC-07: Track Order Status
**Actor**: User  
**Precondition**: User đã đặt hàng  
**Main Flow**:
1. User vào "My Orders"
2. User click vào order cụ thể
3. System hiển thị timeline:
   - CREATED → PREPARING → READY_TO_SHIP → DELIVERING → DELIVERED
4. User theo dõi real-time status

---

### UC-08: Cancel Order
**Actor**: User  
**Precondition**: Order ở status CREATED hoặc PREPARING  
**Main Flow**:
1. User vào order detail
2. User click "Cancel Order"
3. System verify status có thể cancel
4. User nhập lý do (optional)
5. System update status = "CANCELED"
6. System ghi log vào timeline

**Alternative Flow**:
- 3a. Order đang DELIVERING → Cannot cancel

---

### UC-09: Manage Foods (Admin)
**Actor**: Admin  
**Precondition**: Admin đã đăng nhập  
**Main Flow**:
1. Admin vào Food Management
2. **Add Food**:
   - Admin click "Add Food"
   - Admin nhập name, description, price, category
   - Admin upload image
   - System upload image lên Cloudinary
   - System lưu food vào database
3. **Edit Food**:
   - Admin click "Edit" trên food
   - Admin cập nhật thông tin
   - System save changes
4. **Delete Food**:
   - Admin click "Delete"
   - System set isArchived = true (soft delete)

---

### UC-10: Manage Orders (Admin)
**Actor**: Admin  
**Precondition**: Admin đã đăng nhập  
**Main Flow**:
1. Admin vào Order Management
2. System hiển thị tất cả orders
3. Admin có thể filter by status, date, branch
4. **Update Order Status**:
   - Admin click order
   - Admin chọn status mới (PREPARING, READY_TO_SHIP, etc.)
   - System update status
   - System log vào timeline
5. **View Order Details**:
   - Admin xem customer info, items, payment status

---

### UC-11: Payment Processing (VNPAY)
**Actor**: User, System  
**Precondition**: User đã tạo order với payment = VNPAY  
**Main Flow**:
1. System tạo VNPAY payment URL với:
   - Order info
   - Amount
   - Return URL
   - Signature (HMAC SHA512)
2. System redirect user đến VNPAY
3. User nhập thông tin thanh toán trên VNPAY
4. User confirm payment
5. VNPAY redirect về website với params
6. System verify signature
7. **If signature valid**:
   - System update order.paymentStatus = "PAID"
   - System show success message
8. **If signature invalid**:
   - System log error
   - System show failed message

---

### UC-12: Update Profile
**Actor**: User  
**Precondition**: User đã đăng nhập  
**Main Flow**:
1. User vào Profile page
2. User cập nhật name, phone
3. User click "Save"
4. System validate input
5. System update database
6. System show success message

**Extension**:
- User có thể upload avatar
- User có thể change password

---

## USE CASE DIAGRAM (Text Description)

```
┌─────────────────────────────────────────────────────────┐
│                    FastFoodOnline System                 │
│                                                          │
│  User:                                                   │
│    - Register Account (UC-01)                           │
│    - Login (UC-02)                                       │
│    - Browse Menu (UC-03)                                 │
│    - Add to Cart (UC-04)                                 │
│    - Checkout & Place Order (UC-05)                      │
│    - View Order History (UC-06)                          │
│    - Track Order Status (UC-07)                          │
│    - Cancel Order (UC-08)                                │
│    - Update Profile (UC-12)                              │
│                                                          │
│  Admin:                                                  │
│    - Manage Foods (UC-09)                                │
│    - Manage Orders (UC-10)                               │
│    - View Statistics                                     │
│                                                          │
│  System:                                                 │
│    - Payment Processing (UC-11)                          │
│    - Send Notifications                                  │
│    - Generate Reports                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## USE CASE PRIORITY

### High Priority (Must Have):
- UC-01: Register Account
- UC-02: Login
- UC-03: Browse Menu
- UC-04: Add to Cart
- UC-05: Checkout & Place Order
- UC-09: Manage Foods
- UC-10: Manage Orders

### Medium Priority (Should Have):
- UC-06: View Order History
- UC-07: Track Order Status
- UC-08: Cancel Order
- UC-11: Payment Processing
- UC-12: Update Profile

### Low Priority (Nice to Have):
- Real-time notifications
- Drone delivery tracking
- Reviews & Ratings

---

**Version**: 1.0  
**Date**: 17-Dec-2025  
**Author**: Business Analyst Team

**Note**: Để có Use Case Diagram hình ảnh, sử dụng tools như:
- Draw.io (https://draw.io)
- Lucidchart
- PlantUML
- Visual Paradigm

