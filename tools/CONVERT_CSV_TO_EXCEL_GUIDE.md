# Hướng dẫn chuyển đổi CSV sang Excel

## 📋 Yêu cầu

- Node.js đã được cài đặt
- npm đã được cài đặt

## 🚀 Các bước thực hiện

### Bước 1: Cài đặt thư viện xlsx

Mở terminal/command prompt tại thư mục gốc của project và chạy:

```bash
npm install xlsx --save-dev
```

Hoặc nếu muốn cài tất cả dependencies:

```bash
npm install
```

### Bước 2: Chạy script chuyển đổi

Có 2 cách để chạy:

#### Cách 1: Sử dụng npm script (khuyến nghị)
```bash
npm run convert:csv-to-excel
```

#### Cách 2: Chạy trực tiếp
```bash
node tools/convert-csv-to-excel.js
```

### Bước 3: Kiểm tra kết quả

Sau khi chạy xong, các file Excel sẽ được lưu trong thư mục `excel/`.

## 📁 Cấu trúc file

Script sẽ tìm tất cả file `.csv` trong `test_results_final/` và các thư mục con, sau đó chuyển đổi sang Excel.

**Ví dụ:**
- `test_results_final/02_Test_Cases/01_Test_Case_FastFoodOnline_Sheet1_Summary.csv`
  → `excel/02_Test_Cases_01_Test_Case_FastFoodOnline_Sheet1_Summary.xlsx`

- `test_results_final/04_Design_Documents/1.Test_Design_Template.csv`
  → `excel/04_Design_Documents_1.Test_Design_Template.xlsx`

## ⚙️ Tính năng

- ✅ Tự động tìm tất cả file CSV trong thư mục và thư mục con
- ✅ Xử lý encoding UTF-8 (bao gồm BOM)
- ✅ Giữ nguyên cấu trúc dữ liệu
- ✅ Tạo tên file Excel rõ ràng với prefix thư mục
- ✅ Báo cáo kết quả chi tiết (số file thành công/lỗi)

## 🔧 Xử lý lỗi

Nếu gặp lỗi "xlsx is not defined":
- Chạy lại: `npm install xlsx --save-dev`

Nếu gặp lỗi encoding:
- Script đã tự động xử lý UTF-8 và BOM
- Nếu vẫn lỗi, kiểm tra file CSV có đúng định dạng không

## 📝 Lưu ý

- File Excel có thể mở bằng Microsoft Excel, Google Sheets, hoặc LibreOffice Calc
- Tất cả dữ liệu trong CSV sẽ được chuyển đổi chính xác
- File Excel sẽ được ghi đè nếu đã tồn tại

