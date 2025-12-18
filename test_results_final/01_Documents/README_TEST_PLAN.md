# TEST PLAN - FastFoodOnline

## ✅ HOÀN THÀNH

Đã tạo thành công **TEST_PLAN hoàn chỉnh** cho dự án FastFoodOnline.

### 📄 File chính

**`Test_Plan_FastFoodOnline_Final.html`** (58KB)

- **Format**: HTML (có thể mở bằng Microsoft Word hoặc Web Browser)
- **Font**: Times New Roman, 13pt, line-height 1.5
- **Charset**: UTF-8
- **Pages**: Approximately 15-20 pages

### 📋 NỘI DUNG TEST PLAN

#### 1. COVER PAGE
- Project Name: FastFoodOnline (Food Delivery Platform)
- Project Code: FFO
- Document Code: FFO_TestPlan_v1.0
- Version: 1.0
- Date: 18-Dec-2025
- Prepared By / Reviewed By / Approved By

#### 2. REVISION HISTORY
- Lịch sử thay đổi document

#### 3. MỤC LỤC (Table of Contents)
- 10 sections chính
- Links đến từng section

#### 4. GIỚI THIỆU (Introduction)
- 1.1. Mục đích tài liệu
- 1.2. Phạm vi tài liệu
- 1.3. Định nghĩa và từ viết tắt (10 thuật ngữ)
- 1.4. Tài liệu tham khảo (7 documents)

#### 5. PHẠM VI KIỂM THỬ (Test Scope)
- **2.1. In-scope**: 5 chức năng chính
  1. Authentication (18 TCs)
  2. Menu Management (12 TCs)
  3. Cart Management (15 TCs)
  4. Order & Payment (25 TCs)
  5. Admin Management (20 TCs)
  - **Tổng: 90 test cases**
- **2.2. Out-of-scope**: 7 items
- **2.3. Phân bố test cases**:
  - Black Box: 50 TCs (55.6%)
  - Grey Box: 20 TCs (22.2%)
  - White Box: 20 TCs (22.2%)

#### 6. CHIẾN LƯỢC KIỂM THỬ (Test Strategy)
- **3.1. Các loại kiểm thử**:
  - Black Box Testing
  - Grey Box Testing
  - White Box Testing
- **3.2. Phương pháp luận (7 methodologies)**:
  1. **Equivalence Partitioning** - Phân vùng tương đương
  2. **Boundary Value Analysis** - Phân tích giá trị biên
  3. **Statement Coverage** - Độ bao phủ câu lệnh (Target ≥80%)
  4. **Branch Coverage** - Độ bao phủ nhánh (Target ≥75%)
  5. **Path Coverage** - Độ bao phủ đường đi
  6. **Integration Testing** - Kiểm thử tích hợp
  7. **Security Testing** - Kiểm thử bảo mật
  - **Mỗi methodology có**:
    - Khái niệm
    - Ví dụ code
    - Test cases minh họa
    - Tables với data cụ thể

#### 7. MÔI TRƯỜNG KIỂM THỬ (Test Environment)
- 4.1. Hardware Requirements
- 4.2. Software Requirements
- 4.3. Test Environment Setup:
  - Backend Server (localhost:4000)
  - Frontend User (localhost:5173)
  - Frontend Admin (localhost:5174)
  - Database (MongoDB)
  - Third-party Services (VNPAY, Stripe, MoMo, Cloudinary)
- 4.4. Test Tools (6 tools)
- 4.5. Test Data

#### 8. LỊCH TRÌNH KIỂM THỬ (Test Schedule)
- **5.1. Test Phases**: 4 phases (25 days total)
  1. Test Planning (5 days) - ✅ Completed
  2. Test Execution (10 days) - ⏳ In Progress
  3. Bug Fixing & Regression (7 days) - 🔜 Pending
  4. Test Closure (3 days) - 🔜 Pending
- **5.2. Milestones**: 7 milestones với target dates

#### 9. NGUỒN LỰC KIỂM THỬ (Test Resources)
- **6.1. Test Team**: 5 roles
  - Test Lead
  - Test Engineer 1, 2, 3
  - QA Manager
- **6.2. Developer Support**
- **6.3. Tools và Licenses** (6 tools - all FREE)

#### 10. RỦI RO VÀ BIỆN PHÁP (Risks & Mitigation)
- **8 risks** với Impact, Likelihood, Mitigation Strategy:
  1. Third-party services không khả dụng
  2. Database connection errors
  3. Code changes trong quá trình testing
  4. Không đạt code coverage target
  5. Test data không đầy đủ
  6. Test environment không ổn định
  7. Thiếu resources/nhân sự
  8. Timeline bị trễ

#### 11. TÓM TẮT TEST CASES (Test Cases Summary)
- **8.1. Test Cases by Module** (table với 5 modules)
- **8.2. Test Execution Status**:
  - Pass: 0 (0%)
  - Fail: 0 (0%)
  - Untested: 90 (100%)
  - N/A: 0 (0%)
- **8.3. Code Coverage Targets**:
  - Statement Coverage: ≥80%
  - Branch Coverage: ≥75%
  - Function Coverage: ≥85%
  - Line Coverage: ≥80%

#### 12. DEFECTS FOUND (Sample)
- **9.1. Defect Summary**:
  - Critical: 2 (33.3%)
  - High: 3 (50.0%)
  - Medium: 1 (16.7%)
  - Low: 0 (0%)
  - **Total: 6 sample defects**
- **9.2. Top Defects** (table với 6 defects):
  - DEF-001: Password không được hash
  - DEF-002: Tổng tiền không cập nhật khi xóa cart
  - DEF-003: Thiếu validation cho address
  - DEF-004: Search không hoạt động với tiếng Việt
  - DEF-005: VNPAY signature verification error
  - DEF-006: Không có confirmation dialog khi xóa
- **9.3. Defect Resolution Status**

#### 13. PHÊ DUYỆT (Approval)
- Approval table với 4 roles:
  - Prepared By (Test Lead)
  - Reviewed By (QA Manager)
  - Approved By (Project Manager)
  - Acknowledged By (Development Lead)
- Notes/Comments section
- End of document marker

#### 14. PHỤ LỤC (Appendix)
- A. Tài liệu tham khảo chi tiết (7 documents)
- B. Test Case Files (6 CSV files)
- C. Review Checklists (2 files)
- D. Contact Information (4 contacts)
- E. Glossary (7 terms)

---

## 📊 THỐNG KÊ

- **Total Sections**: 14 major sections
- **Total Tables**: 40+ tables
- **Total Test Cases Covered**: 90
- **Total Defects (Sample)**: 6
- **Total Methodologies**: 7
- **Total Pages**: ~15-20 pages (khi in ra)
- **File Size**: 58,584 bytes (~58KB)

---

## 🎯 NGUỒN DỮ LIỆU

Test Plan này được xây dựng dựa trên:

1. **TEST_CASES.md** - 120+ test cases chi tiết (Black Box, Grey Box, White Box)
2. **Test_Summary.md** - Executive summary về test execution
3. **Defect_List_FastFoodOnline.csv** - 6 sample defects
4. **Database_Design.md** - MongoDB schemas và relationships
5. **Architecture_Design.md** - MERN stack architecture
6. **UseCase_Description.md** - Use cases và user flows
7. **Screen_Design.md** - UI design và components

---

## 💡 CÁCH SỬ DỤNG

### Mở bằng Microsoft Word:
1. Mở Microsoft Word
2. File → Open → Chọn `Test_Plan_FastFoodOnline_Final.html`
3. Word sẽ tự động convert HTML sang Word format
4. (Optional) Save As → Word Document (.docx)

### Mở bằng Web Browser:
1. Double-click file `Test_Plan_FastFoodOnline_Final.html`
2. File sẽ mở trong browser mặc định
3. Có thể Print to PDF từ browser

### Chỉnh sửa:
- Mở bằng VSCode hoặc text editor bất kỳ
- HTML structure rõ ràng với comments
- CSS inline trong `<style>` tag

---

## ✅ CHECKLIST HOÀN THÀNH

### Đã có:
- [x] Test Plan hoàn chỉnh (HTML)
- [x] Cover page với project info
- [x] Revision History
- [x] Table of Contents
- [x] 10 major sections
- [x] 7 test methodologies với examples
- [x] 90 test cases summary
- [x] 6 sample defects
- [x] Approval section
- [x] Appendix với references
- [x] Professional formatting (Times New Roman 13pt, line-height 1.5)

### Template compliance:
- [x] Theo đúng HTML template từ folder `templates/htmltemplate`
- [x] Kết hợp với TEST_CASES.MD
- [x] Kết hợp với test reports từ folder test_results_final

---

## 📝 NOTES

- File sử dụng UTF-8 encoding để hiển thị đúng tiếng Việt
- Tables có borders và professional styling
- Page breaks được set cho printing
- Font Times New Roman 13pt với line-height 1.5 (chuẩn academic)
- Có thể mở và edit trực tiếp bằng Word

---

**Created**: 18-Dec-2025  
**Version**: 1.0  
**Status**: ✅ COMPLETE  
**Author**: Test Team


