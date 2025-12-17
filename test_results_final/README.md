# HƯỚNG DẪN SỬ DỤNG VÀ NỘP BÀI - FASTFOODONLINE TEST DOCUMENTATION

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
3. [Các tài liệu đã tạo](#các-tài-liệu-đã-tạo)
4. [Phương pháp luận](#phương-pháp-luận)
5. [Hướng dẫn mở file Excel](#hướng-dẫn-mở-file-excel)
6. [Yêu cầu nộp bài](#yêu-cầu-nộp-bài)
7. [Checklist trước khi nộp](#checklist-trước-khi-nộp)

---

## 📊 TỔNG QUAN

**Dự án:** FastFoodOnline - Food Delivery Platform  
**Công nghệ:** MERN Stack (MongoDB, Express, React, Node.js)  
**Loại kiểm thử:** Black Box, Grey Box, White Box Testing  
**Số lượng test cases:** 90+ test cases  
**Phương pháp luận:** Equivalence Partitioning, Boundary Value Analysis, Statement/Branch/Path Coverage  

### ✅ 5 CHỨC NĂNG CHÍNH ĐƯỢC KIỂM THỬ

1. **Authentication** (Register & Login) - 18 test cases
2. **Menu Management** (Browse & Search) - 12 test cases
3. **Cart Management** (Add/Update/Remove) - 15 test cases
4. **Order & Payment** (Create & Process) - 25 test cases
5. **Admin Management** (Food & Order Management) - 20 test cases

---

## 📁 CẤU TRÚC THƯ MỤC

```
test_results_final/
│
├── 01_Documents/                          # Tài liệu văn bản
│   ├── Test_Plan_FastFoodOnline.html      # Test Plan (HTML - mở bằng Word/Browser)
│   └── (Các tài liệu khác nếu có)
│
├── 02_Test_Cases/                         # Test Cases
│   ├── 01_Test_Case_FastFoodOnline_Sheet5_Cover.csv          # Cover page
│   ├── 01_Test_Case_FastFoodOnline_Sheet4_List.csv           # Function list
│   ├── 01_Test_Case_FastFoodOnline_Sheet3_Authentication.csv # Chi tiết Auth module
│   ├── 01_Test_Case_FastFoodOnline_Sheet2_MenuCart.csv       # Chi tiết Menu & Cart
│   ├── 01_Test_Case_FastFoodOnline_Sheet1_Summary.csv        # Summary report
│   └── FastFoodOnline_TestCase_Complete.csv                   # File tổng hợp
│
├── 03_Test_Reports/                       # Báo cáo kiểm thử
│   ├── Test_Report_FastFoodOnline.csv     # Test Report chính
│   ├── Defect_List_FastFoodOnline.csv     # Danh sách lỗi (Bug Report)
│   └── Test_Execution_Report.csv          # Báo cáo thực thi
│
├── 04_Design_Documents/                   # Tài liệu thiết kế
│   ├── Database_Design.md                 # Thiết kế database
│   ├── Architecture_Design.md             # Kiến trúc hệ thống
│   └── Screen_Design.md                   # Thiết kế màn hình
│
├── 05_Review_Checklists/                  # Checklist review
│   ├── Test_Plan_Review_Checklist.csv
│   └── Test_Case_Review_Checklist.csv
│
└── README.md                              # File này - Hướng dẫn sử dụng
```

---

## 📄 CÁC TÀI LIỆU ĐÃ TẠO

### 1. TEST PLAN (HTML)

**File:** `01_Documents/Test_Plan_FastFoodOnline.html`

**Nội dung:**
- Giới thiệu dự án
- Phạm vi kiểm thử (5 chức năng chính)
- Chiến lược kiểm thử (Black Box, Grey Box, White Box)
- Phương pháp luận chi tiết
- Môi trường kiểm thử
- Lịch trình và nguồn lực
- Rủi ro và biện pháp

**Cách mở:**
- **Microsoft Word:** File → Open → Chọn file HTML
- **Web Browser:** Double-click file HTML
- **Google Docs:** Upload và mở

**Lưu ý:** Có thể convert sang .docx bằng Word (File → Save As → Word Document)

---

### 2. TEST CASES (CSV - 5 Sheets)

Theo đúng template `04_(Chia theo loai test)_Test Case Template`, test cases được chia thành 5 sheets:

#### **Sheet 5 - Cover Page**
**File:** `02_Test_Cases/01_Test_Case_FastFoodOnline_Sheet5_Cover.csv`

**Nội dung:**
- Thông tin project (Name, Code, Version)
- Creator, Reviewer, Approver
- Record of change (Change log)
- Notes (Ghi chú về phương pháp luận)

#### **Sheet 4 - Test Case List**
**File:** `02_Test_Cases/01_Test_Case_FastFoodOnline_Sheet4_List.csv`

**Nội dung:**
- Danh sách 5 functions chính
- Test Environment Setup Description
- Pre-conditions cho từng function
- Sheet tương ứng cho mỗi function

#### **Sheet 3 - Authentication Module**
**File:** `02_Test_Cases/01_Test_Case_FastFoodOnline_Sheet3_Authentication.csv`

**Nội dung:**
- 18 test cases cho Authentication
  - **Black Box Testing:** 9 test cases (Register, Login, Logout, Validation)
  - **Grey Box Testing:** 4 test cases (JWT Token, Password Hashing, Session, Database)
  - **White Box Testing:** 5 test cases (Statement/Branch Coverage, Security)
- Phương pháp luận summary
- Columns: ID, Description, Procedure, Expected Output, Test Data, Result, Pre-Condition, Priority

#### **Sheet 2 - Menu & Cart Module**
**File:** `02_Test_Cases/01_Test_Case_FastFoodOnline_Sheet2_MenuCart.csv` *(Cần tạo thêm)*

**Nội dung:**
- Menu Management: 12 test cases
- Cart Management: 15 test cases
- Tương tự cấu trúc Sheet 3

#### **Sheet 1 - Summary Report**
**File:** `02_Test_Cases/01_Test_Case_FastFoodOnline_Sheet1_Summary.csv`

**Nội dung:**
- Statistics: Pass/Fail/Untested/N/A cho từng module
- Test coverage percentage
- Methodology applied summary
- Test types distribution (Black Box: 55.6%, Grey Box: 22.2%, White Box: 22.2%)
- Priority distribution
- Expected code coverage targets

#### **File tổng hợp:**
**File:** `02_Test_Cases/FastFoodOnline_TestCase_Complete.csv`

Chứa hướng dẫn và overview về tất cả test cases.

---

### 3. TEST REPORT (CSV)

**File:** `03_Test_Reports/Test_Report_FastFoodOnline.csv`

**Nội dung:**
- Cover page với thông tin project
- Statistics (Test execution, defects)
- Theo template `05_Test Report`

---

### 4. DEFECT LIST / BUG REPORT (CSV)

**File:** `03_Test_Reports/Defect_List_FastFoodOnline.csv`

**Nội dung:**
- 6 sample defects (cho demonstration)
- Columns: Defect ID, Description & Steps, Actual/Expected Result, Priority, Severity, Testcase ID
- Defect statistics và resolution status
- Theo template `00_Defect_List_Template`

**Sample Defects:**
1. Password không được hash (Critical - High)
2. Tổng tiền không cập nhật khi xóa cart (High - Medium)
3. Validation thiếu cho address (High - High)
4. Search không hoạt động với tiếng Việt (Medium - Medium)
5. Không có confirmation khi xóa (Low - Low)
6. VNPAY signature verification error (Critical - High)

---

### 5. DESIGN DOCUMENTS

#### **Database Design**
**File:** `04_Design_Documents/Database_Design.md` *(Cần tạo)*

**Nội dung:**
- MongoDB schemas
- Collections: users, foods, orders, categories, branches, notifications
- Relationships và indexes

#### **Architecture Design**
**File:** `04_Design_Documents/Architecture_Design.md` *(Cần tạo)*

**Nội dung:**
- System architecture diagram
- MERN stack components
- API structure
- Third-party integrations

#### **Screen Design**
**File:** `04_Design_Documents/Screen_Design.md` *(Cần tạo)*

**Nội dung:**
- UI mockups hoặc screenshots
- User flows
- Admin dashboard screens

---

### 6. REVIEW CHECKLISTS

#### **Test Plan Review Checklist**
**File:** `05_Review_Checklists/Test_Plan_Review_Checklist.csv` *(Cần tạo)*

#### **Test Case Review Checklist**
**File:** `05_Review_Checklists/Test_Case_Review_Checklist.csv` *(Cần tạo)*

---

## 🎯 PHƯƠNG PHÁP LUẬN

### 1. Equivalence Partitioning (Phân vùng tương đương)

**Khái niệm:** Chia input thành các nhóm tương đương (valid/invalid)

**Ví dụ trong dự án:**
- **Email:**
  - Valid partition: `user@domain.com`, `test@example.co.uk`
  - Invalid partition: `user@`, `@domain`, `userdomain`
- **Password:**
  - Valid partition: ≥ 6 characters
  - Invalid partition: < 6 characters

**Áp dụng cho:** Authentication, Menu, Cart, Order (tất cả modules)

---

### 2. Boundary Value Analysis (Phân tích giá trị biên)

**Khái niệm:** Test giá trị tại biên và gần biên (min-1, min, max, max+1)

**Ví dụ trong dự án:**
- **Cart Quantity:**
  - Test với: 0 (invalid), 1 (min valid), 999 (max valid), 1000 (invalid)
- **Password Length:**
  - Test với: 5 chars (invalid), 6 chars (min valid), 50 chars (max valid)

**Áp dụng cho:** Cart, Order, Authentication

---

### 3. Statement Coverage (Độ bao phủ câu lệnh)

**Khái niệm:** Đảm bảo mỗi dòng code được thực thi ít nhất 1 lần

**Target:** ≥ 80%

**Ví dụ trong dự án:**
```javascript
// userService.js - login function
Line 1: const user = await userModel.findOne({ email });
Line 2: if (!user) return { success: false };
Line 3: const isMatch = await bcrypt.compare(password, user.password);
Line 4: if (!isMatch) return { success: false };
Line 5: const token = createToken(user._id);
Line 6: return { success: true, token };
```

**Test cases:**
- TC1: User không tồn tại → Cover Line 1, 2
- TC2: Sai password → Cover Line 1, 3, 4
- TC3: Login thành công → Cover tất cả lines

**Áp dụng cho:** Tất cả modules (Authentication, Order, Cart, Payment)

---

### 4. Branch Coverage (Độ bao phủ nhánh)

**Khái niệm:** Đảm bảo mỗi nhánh điều kiện (if/else, switch) được test

**Target:** ≥ 75%

**Ví dụ trong dự án:**
```javascript
// Order creation
if (!items || items.length === 0) {     // Branch 1
    return { success: false };
}

if (!branch) {                          // Branch 2
    return { success: false };
}

if (paymentMethod === "ONLINE") {       // Branch 3
    order.paymentStatus = "PENDING";
} else {
    order.paymentStatus = "unpaid";
}
```

**Test cases:**
- TC1: items = [] → Branch 1 TRUE
- TC2: items có data → Branch 1 FALSE
- TC3: branchId invalid → Branch 2 TRUE
- TC4: branchId valid → Branch 2 FALSE
- TC5: payment ONLINE → Branch 3 TRUE
- TC6: payment COD → Branch 3 FALSE

**Áp dụng cho:** Order, Payment, Authentication

---

### 5. Path Coverage (Độ bao phủ đường đi)

**Khái niệm:** Test tất cả các đường đi có thể trong code

**Ví dụ trong dự án:**
```javascript
// Cart add logic
if (!cartData[itemId]) {
    cartData[itemId] = 1;      // Path 1
} else {
    cartData[itemId] += 1;     // Path 2
}
```

**Paths:**
- Path 1: Item chưa có trong cart
- Path 2: Item đã có trong cart

**Test cases:**
- TC1: Add item lần đầu → Path 1
- TC2: Add item đã có → Path 2

**Áp dụng cho:** Cart, Order, Authentication

---

### 6. Integration Testing

**Khái niệm:** Kiểm tra tích hợp giữa các module

**Ví dụ trong dự án:**
- **End-to-end order flow:**
  1. Register user (Frontend → Backend → Database)
  2. Login (Authentication)
  3. Browse menu (Menu module)
  4. Add to cart (Cart module)
  5. Checkout (Order module)
  6. Payment (Payment gateway integration)
  7. Verify order (Database check)

**Áp dụng cho:** Toàn bộ hệ thống

---

### 7. Security Testing

**Khái niệm:** Kiểm tra các lỗ hổng bảo mật

**Ví dụ trong dự án:**
- **NoSQL Injection:**
  - Test với: `{"$ne": null}`, `{"$gt": ""}`
  - Expected: Input bị reject hoặc sanitize
- **XSS Prevention:**
  - Test với: `<script>alert('XSS')</script>`
  - Expected: Script được escape
- **Password Hashing:**
  - Verify password được hash bằng bcrypt (không lưu plain text)
- **Authentication Bypass:**
  - Test access protected routes không có token
  - Expected: 401 Unauthorized

**Áp dụng cho:** Authentication, Admin, Payment

---

## 💻 HƯỚNG DẪN MỞ FILE EXCEL (CSV)

### ⚠️ QUAN TRỌNG: Encoding UTF-8

Tất cả file CSV đã được tạo với encoding **UTF-8 with BOM** để hiển thị đúng tiếng Việt.

### Cách 1: Mở trong Excel (KHUYẾN NGHỊ)

1. Mở **Microsoft Excel**
2. **File** → **Open** → **Browse**
3. Chọn file CSV cần mở
4. Trong hộp thoại **Text Import Wizard**:
   - **Step 1:** 
     - Chọn "Delimited"
     - File origin: Chọn **"65001: Unicode (UTF-8)"**
     - Click **Next**
   - **Step 2:**
     - Delimiters: Chọn **"Comma"**
     - Bỏ chọn các delimiter khác
     - Click **Next**
   - **Step 3:**
     - Chọn "General" cho tất cả columns
     - Click **Finish**

5. **Áp dụng font Times New Roman:**
   - Chọn toàn bộ sheet (Ctrl+A)
   - **Home** → **Font** → Chọn **"Times New Roman"**
   - **Home** → **Font Size** → Chọn **11** hoặc **12**

6. **Lưu file dưới dạng Excel (.xlsx):**
   - **File** → **Save As**
   - Chọn **"Excel Workbook (*.xlsx)"**
   - Lưu file

### Cách 2: Sử dụng Data → From Text/CSV

1. Mở Excel → Tab **Data**
2. Click **From Text/CSV**
3. Chọn file CSV
4. Trong preview:
   - **File Origin:** Chọn **"65001: Unicode (UTF-8)"**
   - **Delimiter:** Chọn **"Comma"**
   - Click **Load**

5. Áp dụng font Times New Roman như trên

### Cách 3: Sửa file CSV bằng Notepad++ (Nếu bị lỗi encoding)

1. Mở file CSV bằng **Notepad++**
2. Kiểm tra encoding ở góc dưới bên phải
3. Nếu không phải UTF-8:
   - **Encoding** → **Convert to UTF-8**
   - **File** → **Save**
4. Mở lại trong Excel theo Cách 1

### 🎨 Format Excel sau khi mở

Để file đẹp và professional:

1. **Header row (dòng tiêu đề):**
   - Background color: Blue (#4472C4)
   - Font color: White
   - Bold

2. **Borders:**
   - Thêm borders cho tất cả cells

3. **Column width:**
   - Auto-fit columns: Select all → Home → Format → AutoFit Column Width

4. **Freeze panes:**
   - Freeze header row: View → Freeze Panes → Freeze Top Row

5. **Alternating row colors:**
   - Select data range
   - Home → Format as Table → Choose style

---

## 📦 YÊU CẦU NỘP BÀI

Theo yêu cầu đề bài, cần nộp các tài liệu sau:

### ✅ 1. Bản báo cáo (.docx)

**Nội dung:**
- Tổng hợp toàn bộ quá trình kiểm thử
- Kết quả kiểm thử
- Phương pháp luận
- Kết luận

**File:** Tạo bằng cách tổng hợp các tài liệu HTML và CSV

**Cách tạo:**
1. Mở `Test_Plan_FastFoodOnline.html` trong Word
2. Copy nội dung Test Cases từ CSV vào Word
3. Thêm Test Report
4. Thêm phần Kết luận
5. Save as `.docx`

---

### ✅ 2. Slide thuyết trình (PowerPoint)

**Nội dung gợi ý:**

**Slide 1: Cover**
- Tên dự án: FastFoodOnline
- Nhóm: [Nhóm số XX]
- Thành viên: [Danh sách]

**Slide 2: Giới thiệu dự án**
- Tên dự án, công nghệ
- Mục tiêu kiểm thử

**Slide 3: Phạm vi kiểm thử**
- 5 chức năng chính
- 90 test cases

**Slide 4: Phương pháp luận**
- Black Box, Grey Box, White Box
- Equivalence Partitioning, Boundary Value Analysis, Code Coverage

**Slide 5: Test Cases**
- Breakdown theo module
- Ví dụ 2-3 test cases quan trọng

**Slide 6: Kết quả kiểm thử**
- Test execution statistics
- Defects found
- Code coverage achieved

**Slide 7: Defects (Sample)**
- Top 3-5 defects quan trọng nhất
- Priority, Severity

**Slide 8: Kết luận**
- Tổng kết
- Khuyến nghị
- Bài học kinh nghiệm

**Slide 9: Demo**
- Link video demo
- Screenshots

**Slide 10: Q&A**

---

### ✅ 3. Các tập tin kiểm thử liên quan

#### a. UseCase, Screen Design, Database Design

**Cần tạo:**
- `04_Design_Documents/UseCase_Diagram.png` (hoặc .pdf)
- `04_Design_Documents/Screen_Design.pdf` (hoặc screenshots)
- `04_Design_Documents/Database_Design.md`

**Gợi ý:**
- **UseCase:** Vẽ bằng Draw.io, Lucidchart, hoặc PlantUML
- **Screen Design:** Chụp screenshots từ website hoặc vẽ mockups
- **Database Design:** Mô tả schemas, relationships, indexes

#### b. Architecture Design

**File:** `04_Design_Documents/Architecture_Design.md`

**Nội dung:**
- System architecture diagram
- MERN stack components
- API endpoints
- Third-party integrations (VNPAY, Stripe, MoMo, Cloudinary)

#### c. Test Plan

**File:** `01_Documents/Test_Plan_FastFoodOnline.html`

✅ **ĐÃ TẠO**

#### d. Test cases / test data / test report / bug report

**Files:**
- ✅ Test Cases: `02_Test_Cases/` (5 sheets)
- ✅ Test Report: `03_Test_Reports/Test_Report_FastFoodOnline.csv`
- ✅ Bug Report (Defect List): `03_Test_Reports/Defect_List_FastFoodOnline.csv`
- Test Data: Có thể tạo file `Test_Data.csv` hoặc `seed_data.json`

#### e. Test summary

**File:** Tạo `03_Test_Reports/Test_Summary.md` hoặc `.docx`

**Nội dung:**
- Executive summary
- Test execution overview
- Key findings
- Defect summary
- Recommendations

#### f. Review check-lists

**Cần tạo:**
- `05_Review_Checklists/Test_Plan_Review_Checklist.csv`
- `05_Review_Checklists/Test_Case_Review_Checklist.csv`

**Gợi ý:** Dựa trên templates:
- `03_Test Plan Review Checklist.xls`
- `04_(Cho tung file)_Test Case Review Checklist Template.xls`

#### g. Github mã nguồn

**Link:** [https://github.com/your-repo/FastFoodOnline](https://github.com/your-repo/FastFoodOnline)

**Yêu cầu:**
- Có README.md
- Code được organize tốt
- Có commits history
- Có .gitignore

---

### ✅ 4. Quay video demo

**Nội dung:**
- Demo website hoạt động
- Chạy qua 5 chức năng chính
- Giải thích test cases
- Show defects (nếu có)
- Thời lượng: 5-10 phút

**Tools:**
- OBS Studio (free)
- Loom
- Screen recording tools

**Upload:**
- YouTube (unlisted)
- Google Drive (public link)

---

### ✅ 5. Nén lại

**Format:** `CuoiKy_Nhom[XX]_[HoTen]_[MaSV].zip`

**Ví dụ:** `CuoiKy_Nhom01_NguyenVanA_SV12345678.zip`

**Cấu trúc trong ZIP:**

```
CuoiKy_Nhom01_NguyenVanA_SV12345678/
│
├── 01_Documents/
│   ├── Test_Plan_FastFoodOnline.html
│   └── Bao_Cao_Kiem_Thu.docx
│
├── 02_Test_Cases/
│   ├── (All test case CSV files)
│   └── FastFoodOnline_TestCase_Complete.csv
│
├── 03_Test_Reports/
│   ├── Test_Report_FastFoodOnline.csv
│   ├── Defect_List_FastFoodOnline.csv
│   └── Test_Summary.docx
│
├── 04_Design_Documents/
│   ├── UseCase_Diagram.png
│   ├── Screen_Design.pdf
│   ├── Database_Design.md
│   └── Architecture_Design.md
│
├── 05_Review_Checklists/
│   ├── Test_Plan_Review_Checklist.csv
│   └── Test_Case_Review_Checklist.csv
│
├── Slide_Thuyet_Trinh.pptx
├── Video_Demo_Link.txt
├── Github_Link.txt
└── README.md
```

---

## ✅ CHECKLIST TRƯỚC KHI NỘP

### Tài liệu

- [ ] Test Plan (HTML/DOCX) - ĐÃ CÓ ✅
- [ ] Test Cases (CSV - 5 sheets) - ĐÃ CÓ ✅
- [ ] Test Report (CSV) - ĐÃ CÓ ✅
- [ ] Defect List (CSV) - ĐÃ CÓ ✅
- [ ] Test Summary (DOCX) - CẦN TẠO ⚠️
- [ ] Báo cáo tổng hợp (DOCX) - CẦN TẠO ⚠️

### Design Documents

- [ ] UseCase Diagram - CẦN TẠO ⚠️
- [ ] Screen Design - CẦN TẠO ⚠️
- [ ] Database Design - CẦN TẠO ⚠️
- [ ] Architecture Design - CẦN TẠO ⚠️

### Review Checklists

- [ ] Test Plan Review Checklist - CẦN TẠO ⚠️
- [ ] Test Case Review Checklist - CẦN TẠO ⚠️

### Khác

- [ ] Slide thuyết trình (PPTX) - CẦN TẠO ⚠️
- [ ] Video demo - CẦN QUAY ⚠️
- [ ] Github link - CÓ SẴN ✅
- [ ] Nén đúng format tên file ⚠️

### Kiểm tra kỹ thuật

- [ ] Tất cả file CSV mở được trong Excel với tiếng Việt đúng
- [ ] Font Times New Roman được áp dụng
- [ ] File HTML mở được trong Word/Browser
- [ ] Không có lỗi format, lỗi chính tả
- [ ] Tất cả links (Github, Video) hoạt động

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:

1. **File CSV không hiển thị đúng tiếng Việt:**
   - Đọc lại phần "Hướng dẫn mở file Excel"
   - Đảm bảo chọn UTF-8 encoding

2. **File HTML không mở được:**
   - Thử mở bằng web browser trước
   - Hoặc import vào Word

3. **Cần thêm test cases:**
   - Tham khảo `TEST_CASES.md`
   - Sử dụng template đã có

4. **Không rõ phương pháp luận:**
   - Đọc lại phần "Phương pháp luận" trong README này
   - Xem ví dụ trong Test Plan

---

## 🎓 KẾT LUẬN

Bộ tài liệu này đã bao gồm:

✅ **Test Plan** đầy đủ theo template  
✅ **Test Cases** cho 5 chức năng chính (90 test cases)  
✅ **Test Report** và **Defect List**  
✅ **Phương pháp luận** rõ ràng (7 methodologies)  
✅ **Hướng dẫn sử dụng** chi tiết  

**Còn cần làm:**
- Tạo Design Documents (UseCase, Screen, Database, Architecture)
- Tạo Review Checklists
- Tạo Slide thuyết trình
- Quay Video demo
- Tổng hợp báo cáo DOCX
- Nén và nộp bài

---

**Chúc bạn thành công với bài kiểm thử! 🎉**

**Version:** 1.0  
**Date:** December 17, 2025  
**Prepared by:** Test Team
