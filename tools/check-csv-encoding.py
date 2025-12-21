#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script kiểm tra encoding của các file CSV
"""

import sys
from pathlib import Path
import chardet

# Fix encoding cho Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def check_csv_encoding():
    """Kiểm tra encoding của các file CSV"""
    
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    test_results_dir = project_root / 'test_results_final'
    
    csv_files = list(test_results_dir.rglob('*.csv'))
    
    print(f"📁 Kiểm tra encoding của {len(csv_files)} file CSV:\n")
    
    for csv_file in csv_files[:5]:  # Kiểm tra 5 file đầu tiên
        try:
            # Đọc một phần file để detect encoding
            with open(csv_file, 'rb') as f:
                raw_data = f.read(10000)  # Đọc 10KB đầu tiên
            
            result = chardet.detect(raw_data)
            encoding = result['encoding']
            confidence = result['confidence']
            
            print(f"📄 {csv_file.name}")
            print(f"   Encoding: {encoding} (confidence: {confidence:.2%})")
            
            # Thử đọc với encoding được detect
            try:
                with open(csv_file, 'r', encoding=encoding) as f:
                    content = f.read(1000)
                    # Kiểm tra có ký tự tiếng Việt không
                    vietnamese_chars = ['ă', 'â', 'ê', 'ô', 'ơ', 'ư', 'đ', 'Ă', 'Â', 'Ê', 'Ô', 'Ơ', 'Ư', 'Đ']
                    has_vietnamese = any(char in content for char in vietnamese_chars)
                    print(f"   Có tiếng Việt: {'Có' if has_vietnamese else 'Không'}")
            except:
                print(f"   ⚠ Không thể đọc với encoding {encoding}")
            
            print()
            
        except Exception as e:
            print(f"✗ Lỗi khi kiểm tra {csv_file.name}: {str(e)}\n")

if __name__ == '__main__':
    try:
        import chardet
    except ImportError:
        print("❌ Cần cài đặt chardet: pip install chardet")
        sys.exit(1)
    
    check_csv_encoding()

