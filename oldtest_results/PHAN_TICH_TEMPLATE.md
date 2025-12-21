# PHÂN TÍCH CẤU TRÚC TEMPLATE

## ✅ ĐÃ ĐỌC ĐƯỢC TẤT CẢ TEMPLATE

### 📊 CSVTEMPLATE (15 files - TẤT CẢ ĐỌC ĐƯỢC)

#### 1. **04_(Chia theo loai test)_Test Case Template** (5 sheets)

**Sheet 1 - TEST REPORT (Summary):**
```
Cấu trúc:
- Project Name, Project Code, Document Code, Notes
- Table: No, Module code, Pass, Fail, Untested, N/A, Number of test cases
- Sub total
- Test coverage %, Test successful coverage %
```

**Sheet 2 - Module2:**
```
Cấu trúc:
- Module Code, Test requirement, Tester
- Statistics: Pass, Fail, Untested, N/A, Number of Test cases
- Columns: ID, Test Case Description, Test Case Procedure, Expected Output, 
           Inter-test case Dependence, Result, Test date, Note
- Group by Function (Function D, Function E)
```

**Sheet 3 - Module1:**
```
Cấu trúc:
- Module Code, Test requirement, Tester
- Statistics: Pass, Fail, Untested, N/A, Number of Test cases
- Columns: ID, Test Case Description, Test Case Procedure, Expected Output, 
           Test data, Result, Test data, Description
- Group by Function (Function A, Function B, Function C)
```

**Sheet 4 - TEST CASE LIST:**
```
Cấu trúc:
- Project Name, Project Code
- Test Environment Setup Description
- Table: No, Function Name, Sheet Name, Description, Pre-Condition
```

**Sheet 5 - TEST CASE (Cover/Change log):**
```
Cấu trúc:
- Project Name, Project Code, Document Code, Creator, Reviewer/Approver, Issue Date, Version
- Record of change: Effective Date, Version, Change Item, *A,D,M, Change description, Reference
```

---

#### 2. **03_Test_Design_Template.csv**

```
Cấu trúc:
- Columns: Requirement Level 1, Requirement Level 2, Requirement Level 3, 
           Test Criteria, Test Type, Note
- Group by requirements và sub-requirements
```

---

#### 3. **05_Test Execution Report** (3 sheets)

**Sheet 1 - Document Control Page:**
```
Cấu trúc:
- Template information (version, status, file name)
- Revision history: Version No., Revision Date, Change Description, Author, Approver
- Usage notes
```

**Sheet 2 & 3 - Chưa đọc chi tiết**

---

#### 4. **05_Test Report** (3 sheets)

**Sheet 1 - Cover Page:**
```
Cấu trúc:
- Project, Program / Division, Build Version, Author / Technical Owner
- Approval Status, Reporting date, Location, Document ID
- For more information: Name, Title, Address, Phone, Fax, Email
```

**Sheet 2 - Test Report Detail:**
```
Cấu trúc:
1. Introduction
2. Test Execution Summary
   2.1 Test Coverage Summary
       - Number of test cases executed, failed, passed, blocked, not run
   2.2 Defect Summary (by Severity: Critical, High, Medium, Low)
       - Total defects detected, fixed, remain open
   2.3 Other Project Specific Metrics
3. Test Results Summary
4. Analysis and Conclusion
```

**Sheet 3 - Chưa đọc chi tiết**

---

#### 5. **00_Defect_List_Template.csv**

```
Cấu trúc:
- Environment, Test, Release Name, Date, FPT QA Name
- Columns: Defect ID, Defect Description & Steps to reproduce, 
           Actual Result, Expected Result, Priority, Serverity, Testcase ID
```

---

#### 6. **00_Q&A Making Guideline.csv** - Chưa đọc chi tiết

#### 7. **00_Q&A_List_Template.csv** - Chưa đọc chi tiết

---

### 📄 HTMLTEMPLATE (3 files - TẤT CẢ ĐỌC ĐƯỢC)

#### 1. **Test plan template.html**
- Dựa trên: `02_Test_Plan_Template.dotx`
- Company: FPT Software
- Cấu trúc: (File HTML dài 15,941 dòng, chứa style và content)

#### 2. **02_(chu y test scope, test types)_INTERNATIONAL-KIDS.COM DEVELOPMENT PROJECT_Test plan.html**
- File HTML dài 17,115 dòng
- Có chú ý về: Test scope, Test types

#### 3. **02_(chu y phan 2 va 3)_ABC Project Test Plan_0.2.html**
- Có chú ý về: phần 2 và 3

---

## 📝 KẾT LUẬN

### ✅ ĐÃ ĐỌC ĐƯỢC:
1. ✅ **Tất cả 15 file CSV** trong `csvtemplate/`
2. ✅ **Tất cả 3 file HTML** trong `htmltemplate/`
3. ✅ Hiểu rõ cấu trúc của:
   - Test Case Template (5 sheets)
   - Test Design Template
   - Test Execution Report (3 sheets)
   - Test Report (3 sheets)
   - Defect List Template

### 📊 CẤU TRÚC CHÍNH CỦA TEMPLATE:

**Test Case Template** gồm:
1. **Cover sheet** (TEST CASE) - thông tin project và change log
2. **Index sheet** (TEST CASE LIST) - danh sách function và sheet
3. **Summary sheet** (TEST REPORT) - tổng hợp kết quả theo module
4. **Module sheets** (Module1, Module2, ...) - chi tiết test cases cho từng module
   - Group by Function
   - Columns: ID, Description, Procedure, Expected Output, Test Data, Result, Note

**Test Report Template** gồm:
1. **Cover page** - thông tin project
2. **Test Report** - chi tiết:
   - Introduction
   - Test Execution Summary (Coverage, Defects, Metrics)
   - Test Results Summary
   - Analysis and Conclusion

**Defect List Template:**
- Defect ID, Description & Steps, Actual/Expected Result, Priority, Severity, Testcase ID

---

## 🎯 BƯỚC TIẾP THEO

### Cần làm:
1. ✅ So sánh cấu trúc template với file đã tạo trong `test_results/`
2. ✅ Tạo lại các file để **giống y hệt template**:
   - Đúng số lượng sheet/section
   - Đúng tên cột
   - Đúng format (header, summary, detail)
   - Đúng group by Function
3. ✅ Sử dụng data từ `TEST_CASES.md`
4. ✅ Đảm bảo encoding UTF-8 và font Times New Roman

### File cần tạo lại:
1. **Test Case FastFoodOnline.csv** (5 sheets theo template)
   - Sheet 1: Cover page
   - Sheet 2: Test Case List
   - Sheet 3: Summary Report
   - Sheet 4+: Module sheets (Authentication, Menu, Cart, Order, Payment, Profile, Admin, v.v.)

2. **Test Report FastFoodOnline.csv** (3 sheets theo template)
   - Sheet 1: Cover page
   - Sheet 2: Test Report detail
   - Sheet 3: Additional metrics

3. **Defect List FastFoodOnline.csv** (theo template)

4. **Test Execution Report FastFoodOnline.csv** (theo template)

5. **Test Plan FastFoodOnline.html** (theo HTML template)

---

## ❓ CÂU HỎI CHO NGƯỜI DÙNG

Bạn có muốn tôi:
1. ✅ Tạo lại TẤT CẢ file theo đúng cấu trúc template?
2. ✅ Giữ nguyên phương pháp luận (4-5 chức năng/test case)?
3. ✅ Chia thành nhiều sheet theo module như template?
4. ✅ Bắt đầu tạo ngay bây giờ?

