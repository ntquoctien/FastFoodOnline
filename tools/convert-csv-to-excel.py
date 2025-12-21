#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script chuyển đổi tất cả file CSV trong test_results_final thành file Excel (.xlsx)
và lưu vào thư mục excel
"""

import os
import sys
import pandas as pd
from pathlib import Path

# Fix encoding cho Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def convert_csv_to_excel():
    """Chuyển đổi tất cả file CSV thành Excel"""
    
    # Đường dẫn
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    test_results_dir = project_root / 'test_results_final'
    excel_dir = project_root / 'excel'
    
    # Tạo thư mục excel nếu chưa tồn tại
    excel_dir.mkdir(exist_ok=True)
    print(f"✓ Thư mục đích: {excel_dir}\n")
    
    # Tìm tất cả file CSV
    csv_files = list(test_results_dir.rglob('*.csv'))
    print(f"📁 Tìm thấy {len(csv_files)} file CSV trong test_results_final\n")
    
    if len(csv_files) == 0:
        print("⚠ Không tìm thấy file CSV nào!")
        return
    
    success_count = 0
    error_count = 0
    
    for csv_file in csv_files:
        try:
            # Đọc file CSV với encoding UTF-8 (ưu tiên UTF-8 để giữ font tiếng Việt)
            # Thử nhiều encoding và các options khác nhau để xử lý CSV phức tạp
            df = None
            encodings = ['utf-8-sig', 'utf-8', 'utf-8', 'latin-1', 'cp1252']  # Ưu tiên UTF-8
            
            for encoding in encodings:
                try:
                    # Thử đọc với các options khác nhau
                    try:
                        # Thử với quoting và escapechar
                        df = pd.read_csv(
                            csv_file, 
                            encoding=encoding, 
                            dtype=str, 
                            keep_default_na=False,
                            quoting=1,  # QUOTE_ALL
                            escapechar='\\',
                            on_bad_lines='skip'  # Bỏ qua dòng lỗi
                        )
                        break
                    except:
                        # Nếu không được, thử với sep tự động
                        try:
                            df = pd.read_csv(
                                csv_file, 
                                encoding=encoding, 
                                dtype=str, 
                                keep_default_na=False,
                                sep=',',
                                quotechar='"',
                                on_bad_lines='skip'
                            )
                            break
                        except:
                            # Cuối cùng, thử với engine='python' (chậm hơn nhưng linh hoạt hơn)
                            df = pd.read_csv(
                                csv_file, 
                                encoding=encoding, 
                                dtype=str, 
                                keep_default_na=False,
                                engine='python',
                                on_bad_lines='skip'
                            )
                            break
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    # Nếu vẫn lỗi, thử encoding tiếp theo
                    continue
            
            if df is None:
                raise Exception("Không thể đọc file với các encoding đã thử")
            
            # Tạo tên file Excel từ đường dẫn CSV
            relative_path = csv_file.relative_to(test_results_dir)
            dir_name = relative_path.parent
            base_name = csv_file.stem
            
            # Tạo tên file Excel với prefix thư mục
            if str(dir_name) == '.':
                excel_filename = f"{base_name}.xlsx"
            else:
                # Thay thế dấu / hoặc \ bằng _
                dir_prefix = str(dir_name).replace('/', '_').replace('\\', '_')
                excel_filename = f"{dir_prefix}_{base_name}.xlsx"
            
            excel_file_path = excel_dir / excel_filename
            
            # Ghi file Excel với openpyxl để có thể set font
            from openpyxl import Workbook
            from openpyxl.styles import Font
            from openpyxl.utils.dataframe import dataframe_to_rows
            
            # Tạo workbook mới
            wb = Workbook()
            ws = wb.active
            ws.title = "Sheet1"
            
            # Set font mặc định cho toàn bộ sheet (Times New Roman, UTF-8)
            default_font = Font(name='Times New Roman', size=11)
            ws.sheet_properties.tabColor = None
            
            # Ghi dữ liệu từ DataFrame
            for r_idx, row in enumerate(dataframe_to_rows(df, index=False, header=True), 1):
                for c_idx, value in enumerate(row, 1):
                    cell = ws.cell(row=r_idx, column=c_idx)
                    # Xử lý giá trị - giữ nguyên string UTF-8
                    if value is None or (isinstance(value, float) and pd.isna(value)):
                        cell.value = ''
                    elif isinstance(value, str):
                        # Giữ nguyên string, không encode/decode
                        cell.value = value
                    else:
                        cell.value = str(value)
                    # Set font cho cell (Times New Roman hỗ trợ tiếng Việt)
                    cell.font = default_font
            
            # Auto-adjust column widths
            for column in ws.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                ws.column_dimensions[column_letter].width = adjusted_width
            
            # Lưu file
            wb.save(excel_file_path)
            
            print(f"✓ Đã chuyển đổi: {relative_path} → {excel_filename}")
            success_count += 1
            
        except Exception as e:
            print(f"✗ Lỗi khi chuyển đổi {csv_file.name}: {str(e)}")
            error_count += 1
    
    print(f"\n{'='*60}")
    print(f"📊 Kết quả:")
    print(f"   ✓ Thành công: {success_count} file")
    print(f"   ✗ Lỗi: {error_count} file")
    print(f"   📁 Thư mục đích: {excel_dir}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    try:
        # Kiểm tra pandas và openpyxl
        try:
            import pandas as pd
        except ImportError:
            print("❌ Lỗi: Thư viện 'pandas' chưa được cài đặt.")
            print("📦 Vui lòng chạy lệnh: pip install pandas openpyxl")
            sys.exit(1)
        
        try:
            import openpyxl
        except ImportError:
            print("❌ Lỗi: Thư viện 'openpyxl' chưa được cài đặt.")
            print("📦 Vui lòng chạy lệnh: pip install openpyxl")
            sys.exit(1)
        
        convert_csv_to_excel()
        
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        sys.exit(1)

