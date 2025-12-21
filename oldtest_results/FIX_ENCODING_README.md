# HƯỚNG DẪN SỬA LỖI PHÔNG CHỮ TRONG FILE EXCEL

## VẤN ĐỀ

Khi mở file CSV trong Excel, tiếng Việt có thể bị hiển thị sai (ví dụ: "ÄÄƒng kÃ½" thay vì "Đăng ký"). Đây là do Excel không nhận diện đúng encoding UTF-8.

## GIẢI PHÁP

### Cách 1: Mở file CSV đúng cách trong Excel (KHUYẾN NGHỊ)

1. **Mở Excel** → **File** → **Open** → **Browse**
2. Chọn file CSV cần mở
3. Trong hộp thoại **Text Import Wizard**:
   - **Step 1:** Chọn "Delimited", File origin: **"65001: Unicode (UTF-8)"**
   - **Step 2:** Delimiters: Chọn **"Comma"**
   - **Step 3:** Chọn "General" cho tất cả columns
   - Click **Finish**

4. **Áp dụng font Times New Roman:**
   - Chọn toàn bộ sheet (Ctrl+A)
   - **Home** → **Font** → Chọn **"Times New Roman"**
   - **Home** → **Font Size** → Chọn **11** hoặc **12**

5. **Lưu file dưới dạng Excel:**
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

### Cách 3: Sửa file CSV bằng Notepad++

Nếu file CSV đã bị lỗi encoding:

1. Mở file CSV bằng **Notepad++**
2. Kiểm tra encoding ở góc dưới bên phải
3. Nếu không phải UTF-8:
   - **Encoding** → **Convert to UTF-8**
   - **File** → **Save**
4. Mở lại trong Excel theo Cách 1

## DANH SÁCH FILE CSV CẦN SỬA

Các file CSV trong thư mục `test_results/`:

1. `01_Test_Case_Black_Box_Testing.csv`
2. `02_Test_Case_Design_Methodology.csv`
3. `02_Test_Case_Grey_Box_Testing.csv`
4. `03_Test_Case_White_Box_Testing.csv`
5. `03_Test_Execution_Report_Methodology.csv`
6. `04_Defect_List_Methodology.csv`
7. `04_Test_Execution_Report.csv`

## KIỂM TRA ENCODING

Để kiểm tra file CSV có encoding đúng:

1. Mở file bằng **Notepad++**
2. Xem encoding ở góc dưới bên phải
3. Phải là **"UTF-8"** hoặc **"UTF-8-BOM"**
4. Nếu không đúng, chuyển sang UTF-8 và Save

## LƯU Ý

- Tất cả file CSV đã được tạo với encoding **UTF-8**
- Excel cần được hướng dẫn để nhận diện UTF-8 khi mở file
- Sau khi mở đúng, áp dụng font **Times New Roman** và lưu lại dưới dạng **.xlsx**
- Nên dùng **Excel 2016 trở lên** để hỗ trợ UTF-8 tốt hơn

## HỖ TRỢ

Nếu vẫn gặp vấn đề:
- Kiểm tra version Excel (nên dùng Excel 2016 trở lên)
- Cài đặt language pack tiếng Việt cho Windows
- Kiểm tra Regional Settings trong Windows Control Panel

