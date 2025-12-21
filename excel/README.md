# Excel Files - Converted from CSV

Thư mục này chứa các file Excel được chuyển đổi từ file CSV trong `test_results_final`.

## Cách sử dụng

### 1. Cài đặt dependency
```bash
npm install
```

### 2. Chạy script chuyển đổi
```bash
npm run convert:csv-to-excel
```

Hoặc chạy trực tiếp:
```bash
node tools/convert-csv-to-excel.js
```

## Mô tả

Script sẽ:
- Tìm tất cả file `.csv` trong thư mục `test_results_final` (bao gồm các thư mục con)
- Chuyển đổi từng file CSV sang định dạng Excel (.xlsx)
- Lưu các file Excel vào thư mục `excel`
- Tên file Excel sẽ bao gồm prefix từ thư mục gốc để dễ phân biệt

## Ví dụ

File CSV: `test_results_final/02_Test_Cases/01_Test_Case_FastFoodOnline_Sheet1_Summary.csv`
→ File Excel: `excel/02_Test_Cases_01_Test_Case_FastFoodOnline_Sheet1_Summary.xlsx`

File CSV: `test_results_final/04_Design_Documents/1.Test_Design_Template.csv`
→ File Excel: `excel/04_Design_Documents_1.Test_Design_Template.xlsx`

## Lưu ý

- File Excel sẽ giữ nguyên encoding UTF-8
- Tất cả dữ liệu trong CSV sẽ được chuyển đổi chính xác sang Excel
- Có thể mở file Excel bằng Microsoft Excel, Google Sheets, hoặc LibreOffice Calc

