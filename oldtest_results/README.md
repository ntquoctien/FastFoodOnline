# TÀI LIỆU KIỂM THỬ - FASTFOODONLINE

Thư mục này chứa toàn bộ tài liệu kiểm thử cho website FastFoodOnline, bao gồm các file Excel và Word theo cấu trúc của các mẫu template.

## ⭐ PHƯƠNG PHÁP LUẬN KIỂM THỬ

**Nguyên tắc cốt lõi:** Mỗi test case được thiết kế để kiểm tra **4-5 chức năng liên quan**, đảm bảo:
- ✅ **Hiệu quả cao:** Một test case phát hiện nhiều lỗi liên quan
- ✅ **Coverage tốt:** Kiểm tra đầy đủ các luồng nghiệp vụ
- ✅ **Phát hiện lỗi tích hợp:** Phát hiện lỗi khi các chức năng tương tác với nhau
- ✅ **Giảm redundancy:** Tránh lặp lại các test case tương tự

**Phương pháp tiếp cận:** Áp dụng mô hình V-Model kết hợp với các kỹ thuật Black Box, Grey Box, và White Box Testing để đảm bảo chất lượng toàn diện.

## CẤU TRÚC TÀI LIỆU

### 1. File Excel (CSV format - có thể mở bằng Excel)

#### Test Case Design với Phương pháp luận:
- **02_Test_Case_Design_Methodology.csv**: Test Case Design với phương pháp luận rõ ràng
  - 25 test cases, mỗi test case test 4-5 chức năng
  - Phương pháp luận cho từng test case
  - Kỹ thuật kiểm thử áp dụng (Equivalence Partitioning, Boundary Value, State Transition, etc.)

#### Test Case Documents (Chi tiết):
- **01_Test_Case_Black_Box_Testing.csv**: Test cases cho Black Box Testing (48 test cases)
  - Authentication (6 test cases)
  - Menu Management (4 test cases)
  - Cart Management (7 test cases)
  - Order Management (9 test cases)
  - Payment Integration (4 test cases)
  - Profile Management (4 test cases)
  - Admin Panel (4 test cases)
  - Boundary Value Testing (4 test cases)
  - Equivalence Partitioning (6 test cases)

- **02_Test_Case_Grey_Box_Testing.csv**: Test cases cho Grey Box Testing (27 test cases)
  - Authentication (3 test cases)
  - Database Operations (4 test cases)
  - Cart (2 test cases)
  - Order (4 test cases)
  - Payment Integration (3 test cases)
  - Authorization (2 test cases)
  - File Upload (2 test cases)
  - Notification (2 test cases)
  - Drone Delivery (2 test cases)
  - API Error Handling (3 test cases)

- **03_Test_Case_White_Box_Testing.csv**: Test cases cho White Box Testing (44 test cases)
  - Statement Coverage (3 test cases)
  - Branch Coverage (6 test cases)
  - Path Coverage (3 test cases)
  - Loop Testing (4 test cases)
  - Condition Coverage (3 test cases)
  - Exception Handling (2 test cases)
  - Middleware Testing (3 test cases)
  - Data Flow Testing (3 test cases)
  - Security Testing (5 test cases)
  - API Controller Testing (4 test cases)
  - Integration Points (3 test cases)
  - Performance Testing (1 test case)
  - Code Coverage (4 test cases)

#### Test Execution Report với Phương pháp luận:
- **03_Test_Execution_Report_Methodology.csv**: Báo cáo thực thi với phương pháp luận
  - 25 test cases (mỗi test case test 4-5 chức năng = 100-125 chức năng)
  - Phân tích kết quả theo module và test type
  - Phương pháp luận đo lường metrics
  - Defect analysis với root cause analysis
  - Recommendations dựa trên phương pháp luận

#### Defect Management với Phương pháp luận:
- **04_Defect_List_Methodology.csv**: Quản lý defects với phương pháp luận
  - Phương pháp luận phân loại defects (Severity, Priority)
  - Root cause analysis methodology
  - Defect metrics và trend analysis
  - Defect resolution workflow
  - Best practices

### 2. File Word (HTML format - có thể mở bằng Word)

#### Test Plan với Phương pháp luận:
- **01_Test_Plan_FastFoodOnline_Methodology.html**: Test Plan với phương pháp luận đầy đủ
  - **Phương pháp luận kiểm thử:** V-Model, Testing Techniques, Test Design Principles
  - **Nguyên tắc:** Mỗi test case test 4-5 chức năng liên quan
  - **Test Strategy:** Multi-level, Multi-technique approach
  - **Test Environment:** Setup methodology
  - **Test Schedule:** Phased approach với phương pháp luận
  - **Success Criteria:** Định lượng với phương pháp luận đo lường
  - **Risk Management:** Phương pháp luận quản lý rủi ro

#### Test Report với Phương pháp luận:
- **05_Test_Report_Methodology.html**: Test Report với phương pháp luận
  - **Phương pháp luận báo cáo:** Structured reporting approach
  - **Test Design Methodology:** Nguyên tắc mỗi test case test 4-5 chức năng
  - **Testing Techniques Applied:** Black Box, Grey Box, White Box với phương pháp luận
  - **Defect Analysis Methodology:** Root cause analysis, trend analysis
  - **Quality Metrics Methodology:** Đo lường chất lượng với công thức rõ ràng
  - **Recommendations:** Dựa trên phương pháp luận và dữ liệu thực tế

## HƯỚNG DẪN SỬ DỤNG

### Mở file Excel (QUAN TRỌNG - ĐỌC KỸ):

**⚠️ LƯU Ý:** File CSV đã được tạo với encoding UTF-8. Khi mở trong Excel, cần chọn đúng encoding để tiếng Việt hiển thị đúng.

**Cách mở file CSV trong Excel với font Times New Roman:**

1. **Mở Excel** → **File** → **Open** → **Browse**
2. Chọn file CSV cần mở
3. Trong hộp thoại **Text Import Wizard**:
   - **Step 1:** Chọn "Delimited", **File origin: "65001: Unicode (UTF-8)"**
   - **Step 2:** Delimiters: Chọn **"Comma"**
   - **Step 3:** Chọn "General" cho tất cả columns
   - Click **Finish**

4. **Áp dụng font Times New Roman:**
   - Chọn toàn bộ sheet (Ctrl+A)
   - **Home** → **Font** → Chọn **"Times New Roman"**
   - **Home** → **Font Size** → Chọn **11** hoặc **12**

5. **Lưu file dưới dạng Excel (.xlsx):**
   - **File** → **Save As** → Chọn **"Excel Workbook (*.xlsx)"**

**Hoặc sử dụng:** Tab **Data** → **From Text/CSV** → Chọn file → File Origin: **"65001: Unicode (UTF-8)"** → Load

**Xem chi tiết:** Đọc file `FIX_ENCODING_README.md` hoặc `HUONG_DAN_MO_FILE_EXCEL.txt` để biết thêm chi tiết.

### Mở file Word:
1. Các file HTML có thể được mở bằng Microsoft Word
   - Mở Word → File → Open → Chọn file HTML
   - Word sẽ tự động convert HTML sang định dạng Word
   - Sau đó có thể lưu lại dưới dạng .docx
2. Hoặc mở bằng trình duyệt web và in ra PDF
3. Có thể chỉnh sửa nội dung, format, và thêm thông tin cần thiết

### Cập nhật kết quả kiểm thử:
1. Mở file **04_Test_Execution_Report.csv**
2. Cập nhật các cột:
   - **Status**: Pass/Fail/Blocked/Not Executed
   - **Executed Date**: Ngày thực thi
   - **Executed By**: Người thực thi
   - **Actual Result**: Kết quả thực tế
   - **Defect ID**: ID của defect nếu có
   - **Remarks**: Ghi chú
3. Cập nhật các metrics trong phần summary

### Tạo báo cáo:
1. Mở file **06_Test_Report_FastFoodOnline.html** trong Word
2. Cập nhật các số liệu từ Test Execution Report
3. Thêm thông tin về defects, issues, và recommendations
4. Export sang PDF để gửi báo cáo

## TỔNG QUAN TEST CASES VỚI PHƯƠNG PHÁP LUẬN

### Tổng số test cases: 25 (với phương pháp luận)
**Mỗi test case kiểm tra 4-5 chức năng = 100-125 chức năng tổng cộng**

### Test Cases với Phương pháp luận (25 test cases):
- **TC-AUTH-FLOW-001:** Quy trình đăng ký và đăng nhập (5 chức năng)
- **TC-AUTH-SEC-001:** Kiểm tra bảo mật authentication (5 chức năng)
- **TC-MENU-BROWSE-001:** Quy trình duyệt và tìm kiếm món ăn (5 chức năng)
- **TC-CART-MANAGE-001:** Quản lý giỏ hàng hoàn chỉnh (5 chức năng)
- **TC-CART-CALC-001:** Tính toán giỏ hàng với các trường hợp đặc biệt (5 chức năng)
- **TC-ORDER-FLOW-001:** Quy trình đặt hàng hoàn chỉnh từ A-Z (5 chức năng)
- **TC-ORDER-STATUS-001:** Quản lý trạng thái đơn hàng (5 chức năng)
- **TC-ORDER-CANCEL-001:** Quy trình hủy đơn hàng (5 chức năng)
- **TC-PAY-VNPAY-001:** Quy trình thanh toán VNPAY hoàn chỉnh (5 chức năng)
- **TC-PAY-MULTI-001:** Test thanh toán với nhiều phương thức (5 chức năng)
- **TC-PROFILE-MANAGE-001:** Quản lý profile người dùng (5 chức năng)
- **TC-ADMIN-FOOD-001:** Quản lý món ăn trong Admin Panel (5 chức năng)
- **TC-ADMIN-ORDER-001:** Quản lý đơn hàng trong Admin Panel (5 chức năng)
- **TC-ADMIN-INVENTORY-001:** Quản lý tồn kho (5 chức năng)
- **TC-DB-INTEGRITY-001:** Kiểm tra tính toàn vẹn dữ liệu (5 chức năng)
- **TC-DB-PERFORMANCE-001:** Kiểm tra hiệu năng database (5 chức năng)
- **TC-API-ENDPOINTS-001:** Test tất cả API endpoints (5 chức năng)
- **TC-API-AUTH-001:** Test authentication và authorization (5 chức năng)
- **TC-SEC-INJECTION-001:** Test bảo mật chống injection attacks (5 chức năng)
- **TC-SEC-PASSWORD-001:** Test bảo mật mật khẩu (5 chức năng)
- **TC-PERF-LOAD-001:** Load testing hệ thống (5 chức năng)
- **TC-INT-E2E-001:** End-to-end testing quy trình hoàn chỉnh (5 chức năng)

### Tổng số test cases chi tiết: 190 (trong các file Excel cũ)

#### Phân loại theo Test Type:
- **Black Box Testing**: 48 test cases
- **Grey Box Testing**: 27 test cases  
- **White Box Testing**: 44 test cases
- **Integration Testing**: 10+ test cases (trong các module)
- **Performance Testing**: 5+ test cases (trong các module)
- **Security Testing**: 10+ test cases (trong các module)

#### Phân loại theo Priority:
- **High Priority**: ~80 test cases
- **Medium Priority**: ~60 test cases
- **Low Priority**: ~50 test cases

#### Phân loại theo Module:
- Authentication: 9 test cases
- Menu: 4 test cases
- Cart: 9 test cases
- Order: 13 test cases
- Payment: 7 test cases
- Profile: 4 test cases
- Admin: 4 test cases
- Database: 4 test cases
- API: 3 test cases
- Code Coverage: 40+ test cases
- Others: 90+ test cases

## PHƯƠNG PHÁP LUẬN KIỂM THỬ

### 1. Nguyên tắc Thiết kế Test Case
- **Mỗi test case kiểm tra 4-5 chức năng liên quan**
- **Lý do:** Tăng hiệu quả, coverage tốt, phát hiện lỗi tích hợp, giảm redundancy

### 2. Kỹ thuật Kiểm thử Áp dụng
- **Black Box Testing:** Equivalence Partitioning, Boundary Value Analysis, Decision Table
- **Grey Box Testing:** Database Testing, API Testing, Integration Testing
- **White Box Testing:** Code Coverage, Security Testing, Performance Testing

### 3. Mô hình Kiểm thử
- **V-Model:** Unit → Integration → System → Acceptance Testing
- **Phased Approach:** 4 phases với phương pháp luận rõ ràng

### 4. Metrics và Đo lường
- **Test Execution Rate:** ≥ 95%
- **Pass Rate:** ≥ 90%
- **Code Coverage:** Statement ≥ 80%, Branch ≥ 75%
- **Defect Density:** < 5 defects/100 test cases

## LƯU Ý

1. **Template Documents với Phương pháp luận:** Các tài liệu này có phương pháp luận rõ ràng và cần được cập nhật với kết quả thực tế.

2. **Test Execution:** Tất cả test cases hiện đang ở trạng thái "Not Executed". Cần thực thi và cập nhật kết quả theo phương pháp luận.

3. **Defect Tracking:** Sử dụng file **04_Defect_List_Methodology.csv** với phương pháp luận quản lý defects.

4. **Code Coverage:** Cần chạy code coverage tools (Jest, Istanbul) để đo lường coverage thực tế.

5. **Test Data:** Cần chuẩn bị test data phù hợp cho từng test case theo phương pháp luận Test Data Management.

## THAM KHẢO

Các mẫu template tham khảo nằm trong thư mục `templates/`:
- Test Case Template: `templates/04_(Chia theo loai test)_Test Case Template.xls`
- Test Execution Report: `templates/05_Test Execution Report.xls`
- Test Report: `templates/05_Test Report.xls`
- Test Plan Template: `templates/02_Test_Plan_Template.dotx`

## LIÊN HỆ

Nếu có câu hỏi hoặc cần hỗ trợ về tài liệu kiểm thử, vui lòng liên hệ với Test Team.

---
**Ngày tạo**: December 17, 2025  
**Version**: 1.0  
**Người soạn**: Test Team

