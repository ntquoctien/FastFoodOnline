# TEST CASES - FASTFOODONLINE WEBSITE

## Thông tin dự án
- **Tên dự án**: FastFoodOnline (Food Delivery Platform)
- **Công nghệ**: MERN Stack (MongoDB, Express, React, Node.js)
- **Phương thức kiểm thử**: Black Box, Grey Box, White Box Testing

---

# 1. BLACK BOX TESTING

Black Box Testing tập trung vào kiểm tra chức năng từ góc độ người dùng cuối mà không quan tâm đến cấu trúc code bên trong.

## 1.1. MODULE AUTHENTICATION (Xác thực người dùng)

### TC-BB-AUTH-001: Đăng ký tài khoản thành công
- **Mục tiêu**: Kiểm tra người dùng có thể đăng ký tài khoản mới
- **Điều kiện tiên quyết**: Email chưa tồn tại trong hệ thống
- **Input**:
  - Name: "Nguyen Van A"
  - Email: "nguyenvana@example.com"
  - Password: "Test@123456"
- **Các bước thực hiện**:
  1. Mở trang chủ website
  2. Click nút "Sign Up"
  3. Nhập thông tin đăng ký
  4. Click nút "Create account"
- **Kết quả mong đợi**:
  - Hiển thị thông báo "Account created successfully"
  - Tự động đăng nhập và chuyển về trang chủ
  - Token được lưu vào localStorage

### TC-BB-AUTH-002: Đăng ký với email đã tồn tại
- **Mục tiêu**: Kiểm tra hệ thống xử lý khi đăng ký với email trùng
- **Điều kiện tiên quyết**: Email đã tồn tại trong database
- **Input**:
  - Email: "existing@example.com"
  - Password: "Test@123"
- **Kết quả mong đợi**:
  - Hiển thị lỗi "User already exists"
  - Không tạo tài khoản mới

### TC-BB-AUTH-003: Đăng ký với mật khẩu yếu
- **Input**:
  - Password: "123" (quá ngắn)
- **Kết quả mong đợi**: Hiển thị thông báo lỗi về độ mạnh mật khẩu

### TC-BB-AUTH-004: Đăng nhập thành công
- **Điều kiện tiên quyết**: Tài khoản đã tồn tại
- **Input**:
  - Email: "user@example.com"
  - Password: "ValidPass123"
- **Kết quả mong đợi**:
  - Đăng nhập thành công
  - Nhận được JWT token
  - Chuyển về trang chủ với trạng thái đã đăng nhập

### TC-BB-AUTH-005: Đăng nhập với sai mật khẩu
- **Input**:
  - Email: "user@example.com"
  - Password: "WrongPassword"
- **Kết quả mong đợi**: Hiển thị "Invalid credentials"

### TC-BB-AUTH-006: Đăng xuất
- **Điều kiện tiên quyết**: Đã đăng nhập
- **Kết quả mong đợi**:
  - Token bị xóa khỏi localStorage
  - Chuyển về trang chủ với trạng thái chưa đăng nhập

---

## 1.2. MODULE MENU (Danh mục món ăn)

### TC-BB-MENU-001: Xem danh sách món ăn
- **Các bước**:
  1. Truy cập trang chủ
  2. Cuộn đến phần "Explore our menu"
- **Kết quả mong đợi**:
  - Hiển thị danh sách món ăn với hình ảnh, tên, giá
  - Các món ăn được hiển thị theo danh mục

### TC-BB-MENU-002: Lọc món ăn theo danh mục
- **Input**: Click vào category "Salad"
- **Kết quả mong đợi**:
  - Chỉ hiển thị món thuộc danh mục Salad
  - Category Salad được highlight

### TC-BB-MENU-003: Tìm kiếm món ăn
- **Input**: Nhập "Pizza" vào ô tìm kiếm
- **Kết quả mong đợi**: Hiển thị các món có từ khóa "Pizza"

### TC-BB-MENU-004: Xem chi tiết món ăn
- **Các bước**: Click vào một món ăn
- **Kết quả mong đợi**:
  - Hiển thị thông tin chi tiết: tên, mô tả, giá, hình ảnh
  - Hiển thị các size nếu có

---

## 1.3. MODULE CART (Giỏ hàng)

### TC-BB-CART-001: Thêm món vào giỏ hàng
- **Điều kiện tiên quyết**: Đã đăng nhập
- **Các bước**:
  1. Chọn một món ăn
  2. Click nút "Add to cart" hoặc icon "+"
- **Kết quả mong đợi**:
  - Số lượng món trong giỏ tăng lên
  - Icon giỏ hàng trên header hiển thị số lượng sản phẩm
  - Toast notification "Item added to cart"

### TC-BB-CART-002: Thêm món khi chưa đăng nhập
- **Điều kiện tiên quyết**: Chưa đăng nhập
- **Kết quả mong đợi**: Hiển thị popup đăng nhập

### TC-BB-CART-003: Tăng số lượng món trong giỏ
- **Các bước**: Click icon "+" trên món trong giỏ
- **Kết quả mong đợi**:
  - Số lượng tăng lên
  - Tổng tiền được cập nhật

### TC-BB-CART-004: Giảm số lượng món trong giỏ
- **Các bước**: Click icon "-" trên món có số lượng > 1
- **Kết quả mong đợi**:
  - Số lượng giảm xuống
  - Tổng tiền được cập nhật

### TC-BB-CART-005: Xóa món khỏi giỏ hàng
- **Các bước**: Click icon "-" khi số lượng = 1 hoặc click icon xóa
- **Kết quả mong đợi**:
  - Món bị xóa khỏi giỏ hàng
  - Tổng tiền được cập nhật

### TC-BB-CART-006: Xem giỏ hàng trống
- **Điều kiện**: Giỏ hàng không có món nào
- **Kết quả mong đợi**: Hiển thị "Your cart is empty"

### TC-BB-CART-007: Tính toán tổng tiền chính xác
- **Input**:
  - Món 1: 50,000đ × 2 = 100,000đ
  - Món 2: 30,000đ × 1 = 30,000đ
  - Phí giao hàng: 20,000đ
- **Kết quả mong đợi**: Total = 150,000đ

---

## 1.4. MODULE ORDER (Đặt hàng)

### TC-BB-ORDER-001: Đặt hàng thành công với COD
- **Điều kiện tiên quyết**: Đã đăng nhập, có món trong giỏ
- **Các bước**:
  1. Vào trang Cart
  2. Click "Proceed to checkout"
  3. Nhập địa chỉ giao hàng
  4. Chọn phương thức "Cash on Delivery"
  5. Click "Place Order"
- **Kết quả mong đợi**:
  - Đơn hàng được tạo với status "CREATED"
  - Hiển thị thông báo thành công
  - Chuyển đến trang My Orders
  - Giỏ hàng được làm rỗng

### TC-BB-ORDER-002: Đặt hàng với VNPAY
- **Phương thức**: VNPAY
- **Kết quả mong đợi**:
  - Redirect đến trang thanh toán VNPAY
  - Sau khi thanh toán thành công, redirect về trang verify
  - Đơn hàng có paymentStatus = "PAID"

### TC-BB-ORDER-003: Đặt hàng với STRIPE
- **Phương thức**: STRIPE
- **Kết quả mong đợi**: Redirect đến Stripe checkout

### TC-BB-ORDER-004: Đặt hàng với MOMO
- **Phương thức**: MOMO
- **Kết quả mong đợi**: Redirect đến trang thanh toán MoMo

### TC-BB-ORDER-005: Đặt hàng thiếu địa chỉ
- **Input**: Không nhập địa chỉ giao hàng
- **Kết quả mong đợi**: Hiển thị lỗi validation "Address is required"

### TC-BB-ORDER-006: Xem lịch sử đơn hàng
- **Các bước**:
  1. Đăng nhập
  2. Vào "My Orders"
- **Kết quả mong đợi**:
  - Hiển thị danh sách đơn hàng của người dùng
  - Mỗi đơn có: thông tin món, tổng tiền, trạng thái, ngày đặt

### TC-BB-ORDER-007: Theo dõi trạng thái đơn hàng
- **Kết quả mong đợi**: Hiển thị timeline với các trạng thái:
  - CREATED → PREPARING → PICKING_UP → DELIVERING → DELIVERED

### TC-BB-ORDER-008: Hủy đơn hàng
- **Điều kiện**: Đơn hàng ở trạng thái CREATED hoặc PREPARING
- **Kết quả mong đợi**:
  - Đơn hàng chuyển sang status "CANCELED"
  - Hiển thị lý do hủy nếu có

### TC-BB-ORDER-009: Xác nhận đã nhận hàng
- **Điều kiện**: Đơn hàng ở trạng thái DELIVERED
- **Kết quả mong đợi**: Đơn hàng chuyển sang COMPLETED

---

## 1.5. MODULE PAYMENT (Thanh toán)

### TC-BB-PAY-001: Thanh toán VNPAY thành công
- **Các bước**:
  1. Tạo đơn hàng với VNPAY
  2. Thanh toán trên cổng VNPAY
  3. Redirect về website
- **Kết quả mong đợi**:
  - Verify payment thành công
  - paymentStatus = "PAID"

### TC-BB-PAY-002: Thanh toán VNPAY thất bại
- **Kết quả mong đợi**:
  - paymentStatus = "FAILED"
  - Đơn hàng vẫn tồn tại với status unpaid

### TC-BB-PAY-003: Thanh toán Stripe thành công
- **Kết quả mong đợi**: Payment verified, order paid

### TC-BB-PAY-004: Thanh toán MoMo thành công
- **Kết quả mong đợi**: Payment verified, order paid

---

## 1.6. MODULE PROFILE (Hồ sơ người dùng)

### TC-BB-PROFILE-001: Xem thông tin cá nhân
- **Điều kiện**: Đã đăng nhập
- **Kết quả mong đợi**: Hiển thị name, email, phone, avatar

### TC-BB-PROFILE-002: Cập nhật thông tin cá nhân
- **Input**:
  - Name: "New Name"
  - Phone: "0901234567"
- **Kết quả mong đợi**:
  - Thông tin được cập nhật
  - Hiển thị thông báo thành công

### TC-BB-PROFILE-003: Đổi mật khẩu
- **Input**:
  - Current Password: "OldPass123"
  - New Password: "NewPass456"
- **Kết quả mong đợi**:
  - Mật khẩu được thay đổi
  - Có thể đăng nhập với mật khẩu mới

### TC-BB-PROFILE-004: Upload avatar
- **Input**: Chọn file ảnh (JPG, PNG)
- **Kết quả mong đợi**:
  - Avatar được upload lên Cloudinary
  - Hiển thị avatar mới

---

## 1.7. MODULE ADMIN - FOOD MANAGEMENT

### TC-BB-ADMIN-001: Thêm món ăn mới
- **Điều kiện**: Đăng nhập với role admin
- **Input**:
  - Name: "Burger Special"
  - Category: "Burger"
  - Price: 75000
  - Image: burger.jpg
- **Kết quả mong đợi**:
  - Món mới xuất hiện trong danh sách
  - Upload hình ảnh thành công

### TC-BB-ADMIN-002: Sửa thông tin món ăn
- **Kết quả mong đợi**: Thông tin được cập nhật

### TC-BB-ADMIN-003: Xóa món ăn (Archive)
- **Kết quả mong đợi**:
  - Món không còn hiển thị cho user
  - Món vẫn tồn tại trong database (soft delete)

### TC-BB-ADMIN-004: Bật/tắt trạng thái món ăn
- **Kết quả mong đợi**: Món có thể set active/inactive

---

## 1.8. MODULE ADMIN - ORDER MANAGEMENT

### TC-BB-ADMIN-005: Xem tất cả đơn hàng
- **Kết quả mong đợi**: Hiển thị danh sách tất cả đơn hàng

### TC-BB-ADMIN-006: Chấp nhận đơn hàng
- **Kết quả mong đợi**: Status chuyển từ CREATED → PREPARING

### TC-BB-ADMIN-007: Đánh dấu sẵn sàng giao hàng
- **Kết quả mong đợi**: Status → READY_TO_SHIP

### TC-BB-ADMIN-008: Cập nhật trạng thái đơn hàng
- **Kết quả mong đợi**: Status được update theo yêu cầu

---

## 1.9. MODULE ADMIN - INVENTORY

### TC-BB-ADMIN-009: Quản lý tồn kho
- **Kết quả mong đợi**: Hiển thị số lượng nguyên liệu

### TC-BB-ADMIN-010: Nhập kho
- **Kết quả mong đợi**: Số lượng tồn kho tăng

### TC-BB-ADMIN-011: Xuất kho
- **Kết quả mong đợi**: Số lượng tồn kho giảm

---

## 1.10. MODULE ADMIN - STAFF & SHIPPER

### TC-BB-ADMIN-012: Thêm nhân viên
- **Kết quả mong đợi**: Tạo user với role staff

### TC-BB-ADMIN-013: Quản lý shipper/drone
- **Kết quả mong đợi**: Hiển thị danh sách shipper

### TC-BB-ADMIN-014: Gán đơn hàng cho drone
- **Kết quả mong đợi**: Order có droneId, missionId

---

## 1.11. BOUNDARY VALUE TESTING

### TC-BB-BV-001: Số lượng tối thiểu trong giỏ hàng
- **Input**: Quantity = 1
- **Kết quả mong đợi**: Accept

### TC-BB-BV-002: Số lượng tối đa trong giỏ hàng
- **Input**: Quantity = 999
- **Kết quả mong đợi**: Accept hoặc hiển thị giới hạn

### TC-BB-BV-003: Giá trị âm
- **Input**: Price = -1000
- **Kết quả mong đợi**: Reject, hiển thị lỗi

### TC-BB-BV-004: Tên món ăn rất dài
- **Input**: Name = 500 ký tự
- **Kết quả mong đợi**: Cắt bớt hoặc hiển thị lỗi validation

---

## 1.12. EQUIVALENCE PARTITIONING

### TC-BB-EP-001: Email hợp lệ
- **Valid**: user@domain.com
- **Invalid**: user@, @domain, user domain

### TC-BB-EP-002: Password
- **Valid**: Tối thiểu 6 ký tự
- **Invalid**: < 6 ký tự

### TC-BB-EP-003: Phone number
- **Valid**: 10-11 chữ số
- **Invalid**: chữ cái, ký tự đặc biệt

---

# 2. GREY BOX TESTING

Grey Box Testing kiểm tra với kiến thức một phần về cấu trúc nội bộ và database.

## 2.1. MODULE AUTHENTICATION

### TC-GB-AUTH-001: Kiểm tra JWT token expiry
- **Mục tiêu**: Kiểm tra token hết hạn
- **Kiến thức cần**: JWT secret, expiry time
- **Các bước**:
  1. Đăng nhập và lấy token
  2. Kiểm tra payload của token (decode JWT)
  3. Đợi token hết hạn
  4. Gọi API với token đã hết hạn
- **Kết quả mong đợi**: API trả về 401 Unauthorized

### TC-GB-AUTH-002: Password hashing với bcrypt
- **Kiểm tra**:
  1. Tạo user với password "Test123"
  2. Query database: `db.users.findOne({email: "test@example.com"})`
  3. Kiểm tra field password
- **Kết quả mong đợi**:
  - Password không được lưu plain text
  - Format: $2b$10$... (bcrypt hash)

### TC-GB-AUTH-003: Session persistence
- **Kiểm tra**:
  1. Đăng nhập
  2. Kiểm tra localStorage: `localStorage.getItem('token')`
  3. Refresh page
- **Kết quả mong đợi**: Token vẫn tồn tại, user vẫn đăng nhập

---

## 2.2. MODULE DATABASE OPERATIONS

### TC-GB-DB-001: Kiểm tra unique constraint cho email
- **Các bước**:
  1. Tạo user với email "test@example.com"
  2. Cố tạo user khác với cùng email
  3. Kiểm tra MongoDB error
- **Kết quả mong đợi**:
  - MongoDB throw duplicate key error (E11000)
  - API trả về "User already exists"

### TC-GB-DB-002: Cascade delete
- **Kiểm tra**:
  1. Tạo user và đơn hàng
  2. Xóa user
  3. Query orders của user đó
- **Kết quả mong đợi**: Orders vẫn tồn tại (không cascade) hoặc được đánh dấu xóa

### TC-GB-DB-003: Index performance
- **Kiểm tra**:
  1. Insert 10,000 orders
  2. Query: `db.orders.find({userId: "xxx"}).explain("executionStats")`
  3. Kiểm tra có sử dụng index không
- **Kết quả mong đợi**:
  - Index được sử dụng
  - executionTimeMillis < 100ms

### TC-GB-DB-004: Kiểm tra GeoJSON location indexing
- **Kiểm tra**:
  1. Insert order với customerLocation (GeoJSON Point)
  2. Query: `db.orders.find({ customerLocation: { $near: {...} } })`
- **Kết quả mong đợi**: 2dsphere index được sử dụng

---

## 2.3. MODULE CART

### TC-GB-CART-001: Cart data structure trong MongoDB
- **Kiểm tra**:
  1. Thêm món vào giỏ
  2. Query: `db.users.findOne({_id: userId})`
  3. Kiểm tra field cartData
- **Kết quả mong đợi**:
  - cartData có format: `{foodId: quantity, ...}`
  - minimize: false để lưu empty object

### TC-GB-CART-002: Cart sync giữa client và server
- **Kiểm tra**:
  1. Thêm món từ client
  2. Kiểm tra API call: POST /api/cart/add
  3. Verify database được update
- **Kết quả mong đợi**: Client state = Server state = DB state

---

## 2.4. MODULE ORDER

### TC-GB-ORDER-001: Order schema validation
- **Kiểm tra**:
  1. Tạo order với invalid data (thiếu required fields)
  2. Kiểm tra Mongoose validation error
- **Kết quả mong đợi**:
  - Mongoose throw ValidationError
  - Các fields required được kiểm tra: userId, branchId, items, totalAmount

### TC-GB-ORDER-002: Timeline tracking
- **Kiểm tra**:
  1. Tạo order
  2. Update status nhiều lần
  3. Query order và kiểm tra timeline array
- **Kết quả mong đợi**:
  - Mỗi thay đổi status được log vào timeline
  - Timeline có: status, actorType, at, actor

### TC-GB-ORDER-003: Transaction rollback khi thanh toán fail
- **Kiểm tra**:
  1. Tạo order
  2. Simulate payment failure
  3. Kiểm tra order status và payment status
- **Kết quả mong đợi**:
  - Order vẫn tồn tại với paymentStatus = "FAILED"
  - Không bị xóa

### TC-GB-ORDER-004: Concurrent order creation
- **Kiểm tra**: Tạo 2 orders cùng lúc từ cùng 1 user
- **Kết quả mong đợi**: Cả 2 orders đều được tạo thành công

---

## 2.5. MODULE PAYMENT INTEGRATION

### TC-GB-PAY-001: VNPAY signature verification
- **Kiểm tra**:
  1. Tạo payment với VNPAY
  2. Kiểm tra request có secure hash (vnp_SecureHash)
  3. Verify callback từ VNPAY
- **Kết quả mong đợi**:
  - Signature được tính đúng với secret key
  - Callback được verify trước khi accept

### TC-GB-PAY-002: Stripe webhook verification
- **Kiểm tra**: Test Stripe webhook signature
- **Kết quả mong đợi**: Webhook signature được verify

### TC-GB-PAY-003: MoMo signature verification
- **Kết quả mong đợi**: Tương tự VNPAY

---

## 2.6. MODULE AUTHORIZATION

### TC-GB-AUTH-004: Role-based access control
- **Kiểm tra**:
  1. Đăng nhập với role "user"
  2. Gọi API admin: POST /api/v2/menu/foods
  3. Kiểm tra middleware auth.js
- **Kết quả mong đợi**: 403 Forbidden

### TC-GB-AUTH-005: Token trong header
- **Kiểm tra**:
  1. Gọi protected API với header: `Authorization: Bearer <token>`
  2. Kiểm tra authMiddleware decode token
- **Kết quả mong đợi**: Request được accept nếu token hợp lệ

---

## 2.7. MODULE FILE UPLOAD

### TC-GB-UPLOAD-001: Cloudinary upload
- **Kiểm tra**:
  1. Upload image qua API
  2. Kiểm tra response có publicUrl
  3. Verify image tồn tại trên Cloudinary
- **Kết quả mong đợi**:
  - Image được upload vào folder: fastfoodonline/menu
  - URL format: https://res.cloudinary.com/...

### TC-GB-UPLOAD-002: Multer validation
- **Kiểm tra**: Upload file không phải image (PDF, TXT)
- **Kết quả mong đợi**: Reject với error "Only images allowed"

---

## 2.8. MODULE NOTIFICATION

### TC-GB-NOTIF-001: Notification được tạo khi order thay đổi
- **Kiểm tra**:
  1. Tạo order
  2. Query: `db.notifications.find({entityType: "order", entityId: orderId})`
- **Kết quả mong đợi**: Notification được tạo với targetRoles: ["admin"]

### TC-GB-NOTIF-002: Real-time notification (nếu có WebSocket)
- **Kiểm tra**: WebSocket connection nhận được notification
- **Kết quả mong đợi**: Client nhận được event ngay lập tức

---

## 2.9. MODULE DRONE DELIVERY

### TC-GB-DRONE-001: Drone assignment
- **Kiểm tra**:
  1. Tạo order
  2. Kiểm tra order có needsDroneAssignment = true
  3. Chạy job assign drone
  4. Verify order có droneId và missionId
- **Kết quả mong đợi**: Drone được gán cho order

### TC-GB-DRONE-002: Mission tracking
- **Kiểm tra**:
  1. Query: `db.missions.findOne({orderId: orderId})`
  2. Kiểm tra mission status
- **Kết quả mong đợi**: Mission có status: ASSIGNED, PICKING_UP, DELIVERING, COMPLETED

---

## 2.10. API ERROR HANDLING

### TC-GB-API-001: 404 Not Found
- **Kiểm tra**: GET /api/v2/orders/invalidObjectId
- **Kết quả mong đợi**: 404 với message "Order not found"

### TC-GB-API-002: 500 Internal Server Error
- **Kiểm tra**: Simulate database connection error
- **Kết quả mong đợi**: 500 với generic error message

### TC-GB-API-003: 400 Bad Request
- **Kiểm tra**: POST order với invalid JSON
- **Kết quả mong đợi**: 400 validation error

---

# 3. WHITE BOX TESTING

White Box Testing kiểm tra cấu trúc code, logic nội bộ, code coverage.

## 3.1. STATEMENT COVERAGE

### TC-WB-STMT-001: User login logic (userService.js)
```javascript
export const login = async (email, password) => {
  // Line 1: Check user exists
  const user = await userModel.findOne({ email });
  if (!user) {
    return { success: false, message: "User doesn't exist" };
  }
  
  // Line 2: Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, message: "Invalid credentials" };
  }
  
  // Line 3: Generate token
  const token = createToken(user._id);
  return { success: true, token };
};
```

**Test Cases**:
- **TC-WB-STMT-001a**: User không tồn tại → Cover line 1, 3
- **TC-WB-STMT-001b**: Sai password → Cover line 1, 4-6
- **TC-WB-STMT-001c**: Đăng nhập thành công → Cover all lines

---

## 3.2. BRANCH COVERAGE

### TC-WB-BRANCH-001: Order creation logic
```javascript
export const createOrder = async ({userId, branchId, items, paymentMethod}) => {
  // Branch 1: Validate items
  if (!items || items.length === 0) {
    return { success: false, message: "Cart is empty" };
  }
  
  // Branch 2: Check branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    return { success: false, message: "Branch not found" };
  }
  
  // Branch 3: Payment method
  if (paymentMethod === "ONLINE") {
    order.paymentStatus = "PENDING";
  } else {
    order.paymentStatus = "unpaid";
  }
  
  return { success: true, order };
};
```

**Test Cases**:
- **TC-WB-BRANCH-001a**: items = [] → Branch 1 (true)
- **TC-WB-BRANCH-001b**: items có data → Branch 1 (false)
- **TC-WB-BRANCH-001c**: branchId invalid → Branch 2 (true)
- **TC-WB-BRANCH-001d**: branchId valid → Branch 2 (false)
- **TC-WB-BRANCH-001e**: paymentMethod = "ONLINE" → Branch 3 (true)
- **TC-WB-BRANCH-001f**: paymentMethod = "COD" → Branch 3 (false)

---

## 3.3. PATH COVERAGE

### TC-WB-PATH-001: Cart add/remove logic
```javascript
export const addToCart = async (req, res) => {
  const { itemId } = req.body;
  const userId = req.userId;
  
  let userData = await userModel.findById(userId);
  let cartData = userData.cartData || {};
  
  if (!cartData[itemId]) {
    cartData[itemId] = 1;
  } else {
    cartData[itemId] += 1;
  }
  
  await userModel.findByIdAndUpdate(userId, { cartData });
  res.json({ success: true });
};
```

**Paths**:
1. Path 1: User exists, item chưa có trong cart → cartData[itemId] = 1
2. Path 2: User exists, item đã có trong cart → cartData[itemId] += 1
3. Path 3: User không tồn tại → Error

**Test Cases**:
- **TC-WB-PATH-001a**: Add item lần đầu → Path 1
- **TC-WB-PATH-001b**: Add item đã có → Path 2
- **TC-WB-PATH-001c**: userId invalid → Path 3

---

## 3.4. LOOP TESTING

### TC-WB-LOOP-001: Calculate order total
```javascript
const calculateTotal = (items) => {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].quantity * items[i].unitPrice;
  }
  return total;
};
```

**Test Cases**:
- **TC-WB-LOOP-001a**: items = [] → 0 iterations
- **TC-WB-LOOP-001b**: items có 1 phần tử → 1 iteration
- **TC-WB-LOOP-001c**: items có nhiều phần tử → N iterations
- **TC-WB-LOOP-001d**: items = null → Error handling

---

## 3.5. CONDITION COVERAGE

### TC-WB-COND-001: Order status validation
```javascript
const canCancelOrder = (order) => {
  return order.status === "CREATED" || order.status === "PREPARING";
};
```

**Truth Table**:
| status = CREATED | status = PREPARING | Result |
|------------------|-------------------|--------|
| True             | -                 | True   |
| False            | True              | True   |
| False            | False             | False  |

**Test Cases**:
- **TC-WB-COND-001a**: status = "CREATED" → true
- **TC-WB-COND-001b**: status = "PREPARING" → true
- **TC-WB-COND-001c**: status = "DELIVERING" → false

---

## 3.6. EXCEPTION HANDLING

### TC-WB-EXC-001: Database connection error
```javascript
try {
  const user = await userModel.findById(userId);
  return user;
} catch (error) {
  console.error("DB Error:", error);
  throw new Error("Database error");
}
```

**Test Cases**:
- **TC-WB-EXC-001a**: Database disconnect → Catch block được thực thi
- **TC-WB-EXC-001b**: Normal operation → Try block thành công

---

## 3.7. MIDDLEWARE TESTING

### TC-WB-MW-001: Auth middleware (middleware/auth.js)
```javascript
const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;
  
  if (!token) {
    return res.json({ success: false, message: "Not Authorized" });
  }
  
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = token_decode.id;
    next();
  } catch (error) {
    res.json({ success: false, message: "Invalid token" });
  }
};
```

**Test Cases**:
- **TC-WB-MW-001a**: No token → Return "Not Authorized"
- **TC-WB-MW-001b**: Invalid token → Catch block, "Invalid token"
- **TC-WB-MW-001c**: Valid token → Call next(), set req.userId

---

## 3.8. DATA FLOW TESTING

### TC-WB-DF-001: Variable lifecycle trong order creation
```javascript
export const createOrder = async (data) => {
  let subtotal = 0;                    // Definition
  
  data.items.forEach(item => {
    subtotal += item.totalPrice;       // Use & Redefinition
  });
  
  const deliveryFee = 20000;           // Definition
  const totalAmount = subtotal + deliveryFee;  // Use
  
  const order = new OrderModel({
    subtotal,                          // Use
    deliveryFee,                       // Use
    totalAmount                        // Use
  });
  
  return order;
};
```

**Test Cases**:
- **TC-WB-DF-001a**: Trace subtotal: def → use → redef → use
- **TC-WB-DF-001b**: Trace deliveryFee: def → use
- **TC-WB-DF-001c**: Trace totalAmount: def → use

---

## 3.9. SECURITY TESTING

### TC-WB-SEC-001: SQL/NoSQL Injection
```javascript
// Vulnerable code
const user = await userModel.findOne({ email: req.body.email });

// Test with malicious input
email: { $ne: null }  // MongoDB operator injection
```

**Test Cases**:
- **TC-WB-SEC-001a**: Input: `{"email": {"$ne": null}}` → Should be rejected
- **TC-WB-SEC-001b**: Input: `email@example.com` → Normal operation

### TC-WB-SEC-002: XSS Prevention
```javascript
// Input: <script>alert('XSS')</script>
```

**Test Cases**:
- **TC-WB-SEC-002a**: Submit food name với script tag
- **Kết quả mong đợi**: Script được escape hoặc sanitize

### TC-WB-SEC-003: Password strength validation
**Test Cases**:
- **TC-WB-SEC-003a**: Password = "123" → Reject
- **TC-WB-SEC-003b**: Password = "Test@1234" → Accept

---

## 3.10. API CONTROLLER TESTING

### TC-WB-API-001: Order controller error handling
```javascript
export const getOrderByIdV2 = async (req, res) => {
  try {
    const user = await getUser(req.userId);
    const result = await orderService.getOrderById(req.params.id, user);
    res.json(result);
  } catch (error) {
    return handleCommonError(res, error, "Get order error");
  }
};
```

**Test Cases**:
- **TC-WB-API-001a**: Valid orderId → Return order
- **TC-WB-API-001b**: Invalid orderId → 404 error
- **TC-WB-API-001c**: User not authorized → 403 error
- **TC-WB-API-001d**: Database error → 500 error

---

## 3.11. INTEGRATION POINTS

### TC-WB-INT-001: VNPAY integration (utils/vnpay.js)
```javascript
export const createPaymentUrl = (orderId, amount, ipAddress) => {
  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_Amount: amount * 100,
    vnp_TxnRef: orderId,
    // ...
  };
  
  // Sort params
  vnp_Params = sortObject(vnp_Params);
  
  // Create signature
  const signData = querystring.stringify(vnp_Params);
  const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
  vnp_Params['vnp_SecureHash'] = signed;
  
  return vnpUrl + '?' + querystring.stringify(vnp_Params);
};
```

**Test Cases**:
- **TC-WB-INT-001a**: Verify signature algorithm
- **TC-WB-INT-001b**: Verify URL format
- **TC-WB-INT-001c**: Verify parameter sorting

---

## 3.12. PERFORMANCE TESTING

### TC-WB-PERF-001: Query optimization
```javascript
// Unoptimized
const orders = await OrderModel.find({ userId }).lean();

// Optimized with select
const orders = await OrderModel.find({ userId })
  .select('status totalAmount createdAt')
  .lean();
```

**Test Cases**:
- Measure execution time với 1000 orders
- So sánh performance với/không có .lean()
- Kiểm tra index usage

---

## 3.13. CODE COVERAGE TARGET

**Mục tiêu Coverage**:
- **Statement Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: ≥ 85%
- **Line Coverage**: ≥ 80%

**Tools**:
- Jest với coverage reporter
- Istanbul/nyc
- Codecov cho visualization

---

# 4. INTEGRATION TESTING

## TC-INT-001: End-to-end order flow
1. Register user
2. Login
3. Browse menu
4. Add to cart
5. Checkout
6. Payment
7. Verify order created

**Expected**: Toàn bộ flow hoạt động liền mạch

---

# 5. PERFORMANCE TESTING

## TC-PERF-001: Load testing
- 100 concurrent users đặt hàng
- Response time < 2s
- No errors

## TC-PERF-002: Stress testing
- 1000 users cùng lúc
- Hệ thống vẫn hoạt động hoặc graceful degradation

---

# 6. SECURITY TESTING

## TC-SEC-001: Authentication bypass
- Cố gắng access protected routes không có token
- **Expected**: 401 Unauthorized

## TC-SEC-002: CORS testing
- Request từ domain khác
- **Expected**: CORS headers cho phép hoặc reject

---

# 7. TEST EXECUTION PLAN

## 7.1. Test Environment Setup
- **Backend**: Node.js server chạy local (port 4000)
- **Frontend**: React app (port 5173)
- **Admin**: React app (port 5174)
- **Database**: MongoDB Atlas hoặc local MongoDB
- **Payment**: Sandbox environment cho VNPAY, Stripe, MoMo

## 7.2. Test Data Preparation
- Tạo test users với các roles khác nhau
- Seed database với sample foods, categories
- Chuẩn bị test images

## 7.3. Test Execution Order
1. **Phase 1**: Black Box Testing - Functional tests
2. **Phase 2**: Grey Box Testing - Database và API tests
3. **Phase 3**: White Box Testing - Code analysis
4. **Phase 4**: Integration & Performance tests

## 7.4. Test Tools
- **API Testing**: Postman, Thunder Client, Axios
- **UI Testing**: Selenium, Cypress, Playwright
- **Unit Testing**: Jest, Mocha
- **Database**: MongoDB Compass, Studio 3T
- **Performance**: JMeter, Artillery
- **Code Coverage**: Istanbul, Jest Coverage

---

# 8. BUG REPORTING TEMPLATE

```markdown
## Bug ID: BUG-XXX
**Title**: [Short description]
**Severity**: Critical / High / Medium / Low
**Priority**: P1 / P2 / P3
**Module**: [Authentication / Order / Cart / etc.]
**Environment**: Development / Staging / Production

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Logs**:
[Attach if applicable]

**Test Case Reference**: TC-XX-XXX-XXX
```

---

# 9. TEST METRICS

## 9.1. Test Coverage Metrics
- Total test cases: 150+
- Executed: X
- Passed: Y
- Failed: Z
- Blocked: W

## 9.2. Defect Metrics
- Total bugs found: X
- Critical: A
- High: B
- Medium: C
- Low: D

## 9.3. Code Coverage
- Line coverage: X%
- Branch coverage: Y%
- Function coverage: Z%

---

# 10. CONCLUSION

Bộ test cases này bao gồm:
- **Black Box**: 50+ test cases kiểm tra chức năng từ góc độ người dùng
- **Grey Box**: 30+ test cases kiểm tra database, API, và integration
- **White Box**: 40+ test cases kiểm tra code logic, coverage, security

**Total**: 120+ test cases chi tiết cho website FastFoodOnline.

---

**Người soạn**: [Your Name]  
**Ngày**: December 17, 2025  
**Version**: 1.0
