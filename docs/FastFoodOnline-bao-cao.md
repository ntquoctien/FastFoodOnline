**FASTFOOD ONLINE – HỆ THỐNG ĐẶT ĐỒ ĂN TRỰC TUYẾN**

# 1. Problem Alignment

- Khách hàng cần đặt món trực tuyến nhanh, tiện lợi, dễ theo dõi trạng thái đơn hàng theo thời gian thực.
- Nhà hàng/chuỗi cửa hàng cần hệ thống quản lý menu, chi nhánh, tồn kho, nhân sự và đơn hàng để giảm sai sót khi lưu thông tin thủ công.
- Doanh nghiệp cần thanh toán trực tuyến an toàn (VNPAY), phân quyền rõ ràng (khách, nhân viên, quản trị) và khả năng mở rộng nhiều chi nhánh.
- Triển khai linh hoạt: chạy cục bộ và đóng gói bằng Docker để dễ vận hành, thử nghiệm và triển khai.

## 1.1 High Level Approach

- Xây dựng web app tương thích desktop/mobile: trang khách hàng (Frontend) và trang quản trị/nhân sự (Admin).
- Backend Node.js/Express cung cấp REST API v2, xác thực JWT, quản lý menu, đơn hàng, tồn kho, shipper, chi nhánh.
- Tích hợp VNPAY cho quy trình thanh toán; lưu trạng thái thanh toán và đơn hàng trong MongoDB.
- Phân quyền theo vai trò (user, admin, staff/shipper) tại middleware và từng service.
- Đóng gói bằng Docker Compose: Backend, Frontend, Admin và MongoDB khởi chạy đồng bộ.
- Lưu ảnh món ăn qua multipart (Multer) vào thư mục uploads và phục vụ tĩnh qua đường dẫn /images/...

## 1.2 Narrative

Kịch bản Khách hàng (User):

- Truy cập website, xem menu theo chi nhánh, thêm món (biến thể/size) vào giỏ hàng và đặt đơn.
- Thanh toán trực tuyến (VNPAY) hoặc phương thức hỗ trợ, nhận thông báo trạng thái: pending → confirmed → preparing → delivered.
- Tra cứu lịch sử đơn hàng của chính mình.

Kịch bản Admin/Nhà hàng (Admin/Staff):

- Đăng nhập cổng quản trị; quản lý danh mục, món ăn, biến thể theo chi nhánh; cập nhật tồn kho.
- Xem/duyệt đơn, cập nhật trạng thái theo luồng vận hành; quản lý chi nhánh, nhân sự (staff/shipper).

Kịch bản Shipper:

- Nhận phân công giao hàng (delivery assignment), cập nhật trạng thái sẵn sàng/bận, đánh dấu đã giao.

# Goals

- Trải nghiệm đặt món nhanh, đơn giản, minh bạch trạng thái đơn hàng.
- Hỗ trợ nhiều chi nhánh; menu/biến thể theo chi nhánh; quản lý tồn kho theo thực tế.
- Thanh toán an toàn, lưu vết thanh toán, đồng bộ dữ liệu.
- Phân quyền rõ ràng; API được bảo vệ bởi JWT; dữ liệu bền vững trong MongoDB.
- Dễ triển khai (Docker), dễ phát triển (MERN), dễ mở rộng trong tương lai.


# 2. Solution Alignment (Techniques)

Xem sơ đồ tổng quan và ERD trong `docs/diagrams.md` (Mermaid: kiến trúc triển khai + mô hình dữ liệu).

## 2.1 Key Features

1. Ứng dụng web 2 phần: Frontend (khách hàng) và Admin (quản trị/nhân sự), đều dùng Vite (5173, 5174).
2. REST API v2 trên Node.js/Express (cổng 4000), JWT auth, phân quyền theo role.
3. Menu theo danh mục và biến thể (size/price) theo chi nhánh; upload ảnh món (Multer).
4. Quản lý đơn hàng end-to-end: tạo đơn, theo dõi trạng thái, lịch sử người dùng; phân công shipper.
5. Tồn kho theo chi nhánh và biến thể; cập nhật và kiểm soát số lượng thực tế.
6. Thanh toán VNPAY: tạo intent, xác nhận; lưu Payment liên kết Order.
7. Quản trị chi nhánh, danh mục, món ăn, nhân sự/shipper; xem danh sách và cập nhật trạng thái.
8. Docker Compose khởi chạy đầy đủ stack; MongoDB Atlas hoặc container nội bộ làm nguồn dữ liệu.

Future considerations:

- Realtime (WebSocket/SSE) cho trạng thái đơn hàng/shipper; thông báo đẩy.
- Báo cáo doanh thu/tồn kho theo thời gian; dashboard cho quản trị.
- Đa phương thức thanh toán, khuyến mãi/voucher, gợi ý món thông minh.

## 2.2 User Scenarios

2.2.1 Khách hàng

- Đăng ký/Đăng nhập; duyệt menu theo chi nhánh; thêm món vào giỏ; đặt hàng và thanh toán.
- Xem lịch sử đơn hàng; theo dõi trạng thái từng đơn.

2.2.2 Admin/Nhà hàng

- Đăng nhập quản trị; tạo/cập nhật danh mục, món và biến thể; cấu hình chi nhánh.
- Duyệt và cập nhật trạng thái đơn; quản lý tồn kho, nhân sự/shipper.

2.2.3 Shipper

- Xem danh sách phân công; cập nhật trạng thái available/busy/inactive; đánh dấu đã giao.

## Screens

- Frontend: Trang chủ, danh mục & món, chi tiết/biến thể, giỏ hàng, thanh toán, lịch sử đơn, hồ sơ.
- Admin: Đăng nhập, dashboard, chi nhánh, danh mục/món/biến thể, đơn hàng, tồn kho, shipper, nhân viên.

## 2.3 Key Flows

- Operational flow (tổng quát): Frontend/Admin → REST API → MongoDB; ảnh → uploads; thanh toán → VNPAY.
- Order processing flow: create order → confirm → preparing → assigned (shipper) → delivered/cancelled.
- Payment processing flow: init intent (VNPAY) → confirm → update Payment + Order.paymentStatus.
- Inventory flow: nhập/xuất theo biến thể-chi nhánh; kiểm soát số lượng trước khi xác nhận đơn.
- User/Role flow: đăng nhập JWT, middleware gắn `req.user`, kiểm soát quyền theo route/service.

## 2.4 Key logic

2.4.1 Client tách biệt: Frontend (khách) và Admin (quản trị/nhân sự). Cùng tiêu thụ API v2.

2.4.2 Backend nghiệp vụ: Express + Mongoose; module hóa theo v2 (menu, order, inventory, shipper, branch...).

2.4.3 Xác thực/Bảo mật: JWT; middleware `auth` đọc token, inject user/role; kiểm tra quyền theo route/service.

2.4.4 Lưu trữ: MongoDB; model hoá Restaurant, Branch, Category, Food, FoodVariant, Inventory, Order, Payment, ShipperProfile, DeliveryAssignment...

2.4.5 Upload ảnh: Multer nhận multipart `image`, lưu vào `backend/uploads/`, truy cập qua `/images/<filename>`.

2.4.6 Triển khai: Docker Compose khởi chạy 4 dịch vụ (backend, frontend, admin, mongo); cấu hình qua env.

---

## Launch Plan

| TARGET DATE | MILESTONE | DESCRIPTION |
| --- | --- | --- |
| Tuần 1 | Hoàn thiện setup & Docker | Chạy đủ 4 dịch vụ; cấu hình env; kiểm tra kết nối MongoDB |
| Tuần 2 | Menu + Đơn hàng cơ bản | Duyệt menu, tạo đơn, theo dõi trạng thái; upload ảnh |
| Tuần 3 | Thanh toán VNPAY | Tạo/confirm payment intent; cập nhật Payment/Order |
| Tuần 4 | Tồn kho + Shipper | Cập nhật inventory; phân công shipper; báo cáo cơ bản |

---

## Appendix

| DATE | DESCRIPTION |
| --- | --- |
| 2025-10-26 | Bản trình bày theo mẫu “CNPM – Đồ án” áp dụng cho FastFoodOnline |

## Component Diagram

Tham khảo `docs/diagrams.md` mục “Kien truc trien khai” (Mermaid).

## Deployment Diagram

Triển khai chuẩn bằng Docker Compose (4 services). Có thể mở rộng lên VM/K8s; tách MongoDB managed.


# Backend design

**Mục tiêu:** Thiết kế backend cho hệ thống đặt món đa chi nhánh, tối ưu khả dụng, an toàn, dễ mở rộng; hỗ trợ shipper (không dùng drone).

## Sub-systems

- Payment (VNPAY): tạo payment intent, xác nhận kết quả; đồng bộ Payment ↔ Order.
- Order Processing: tạo/đọc đơn, cập nhật status, tạo timeline; lọc theo user/branch/role.
- Dispatch Shipper: quản lý `ShipperProfile`, trạng thái available/busy/inactive; `DeliveryAssignment` gắn với Order.
- Inventory: theo dõi tồn kho ở cấp `FoodVariant`-`Branch`; cập nhật khi chuẩn bị/giao hàng.

## App

- Backend: Node.js (Express), REST API v2, Mongoose, JWT auth, Multer upload.
- MongoDB: lưu dữ liệu document; index theo khoá tìm kiếm.
- Frontend & Admin: React + Vite (5173/5174), gọi API qua `VITE_API_URL`.
- Container: Docker Compose dựng backend/frontend/admin/mongo.

## Data

- Dùng bộ model trong `backend/models/v2`: restaurant, branch, category, food, foodVariant, inventory, order, payment, shipperProfile, deliveryAssignment...
- Upload ảnh: thư mục `backend/uploads/`, đường dẫn public `/images/...`.

## APIs (trích yếu)

- Base URL: `http://localhost:4000/api/v2`.
- Menu: GET `/menu/default?branchId=...`, POST `/menu/categories`, `/menu/foods`, DELETE `/menu/foods/:id`.
- Orders: POST `/orders`, GET `/orders/me`, PATCH `/orders/:id/status`, POST `/orders/pay/vnpay`, `/orders/confirm-payment`.
- Inventory: GET/POST `/inventory` (theo branch, foodVariant).
- Branches/Shippers: CRUD branch; shipper list + cập nhật trạng thái.

## Monitoring (đề xuất)

- Ghi log ứng dụng (winston/pino), healthcheck endpoint; thu thập metric cơ bản (request, error, DB latency).
- Theo dõi lỗi client (Sentry) và cảnh báo.

## Entity Relation Diagram

Xem Mermaid ERD trong `docs/diagrams.md` mục “Mo hinh du lieu (chi tiet)”.

---

## Hướng dẫn chạy nhanh (trích `docs/setup.md`)

- Docker: `docker compose up -d --build` → Frontend 5173, Admin 5174, API 4000, Mongo 27017; tắt bằng `docker compose down -v`.
- Local: cấu hình `backend/.env`, chạy `npm install` và `npm run server` (backend), `npm run dev` (frontend/admin).
