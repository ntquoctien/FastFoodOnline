const fs = require('fs');
const path = require('path');

// Kiểm tra xem xlsx đã được cài đặt chưa
let XLSX;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.error('❌ Lỗi: Thư viện "xlsx" chưa được cài đặt.');
  console.error('📦 Vui lòng chạy lệnh: npm install xlsx --save-dev');
  console.error('   hoặc: npm install');
  process.exit(1);
}

/**
 * Chuyển đổi tất cả file CSV trong test_results_final thành file Excel (.xlsx)
 * và lưu vào thư mục excel
 */
function convertCsvToExcel() {
  const testResultsDir = path.join(__dirname, '..', 'test_results_final');
  const excelDir = path.join(__dirname, '..', 'excel');
  
  // Tạo thư mục excel nếu chưa tồn tại
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, { recursive: true });
    console.log(`✓ Đã tạo thư mục: ${excelDir}`);
  }

  // Hàm đệ quy để tìm tất cả file CSV
  function findCsvFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findCsvFiles(filePath, fileList);
      } else if (file.endsWith('.csv')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }

  // Tìm tất cả file CSV
  const csvFiles = findCsvFiles(testResultsDir);
  console.log(`\n📁 Tìm thấy ${csvFiles.length} file CSV trong test_results_final\n`);

  let successCount = 0;
  let errorCount = 0;

  csvFiles.forEach(csvFilePath => {
    try {
      // Đọc file CSV
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      
      // Parse CSV (xử lý encoding UTF-8 với BOM nếu có)
      const cleanContent = csvContent.replace(/^\uFEFF/, ''); // Remove BOM
      
      // Chuyển đổi CSV sang workbook
      const workbook = XLSX.read(cleanContent, {
        type: 'string',
        raw: false,
        codepage: 65001, // UTF-8
        sheetStubs: false
      });

      // Tạo tên file Excel từ đường dẫn CSV
      const relativePath = path.relative(testResultsDir, csvFilePath);
      const dirName = path.dirname(relativePath);
      const baseName = path.basename(csvFilePath, '.csv');
      
      // Tạo tên file Excel với prefix thư mục
      let excelFileName;
      if (dirName === '.') {
        excelFileName = `${baseName}.xlsx`;
      } else {
        // Thay thế dấu / hoặc \ bằng _
        const dirPrefix = dirName.replace(/[\/\\]/g, '_');
        excelFileName = `${dirPrefix}_${baseName}.xlsx`;
      }
      
      const excelFilePath = path.join(excelDir, excelFileName);

      // Ghi file Excel
      XLSX.writeFile(workbook, excelFilePath, {
        bookType: 'xlsx',
        type: 'buffer',
        cellStyles: true
      });

      console.log(`✓ Đã chuyển đổi: ${relativePath} → ${excelFileName}`);
      successCount++;

    } catch (error) {
      console.error(`✗ Lỗi khi chuyển đổi ${csvFilePath}:`, error.message);
      errorCount++;
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Kết quả:`);
  console.log(`   ✓ Thành công: ${successCount} file`);
  console.log(`   ✗ Lỗi: ${errorCount} file`);
  console.log(`   📁 Thư mục đích: ${excelDir}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Chạy hàm chuyển đổi
if (require.main === module) {
  try {
    convertCsvToExcel();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

module.exports = { convertCsvToExcel };

