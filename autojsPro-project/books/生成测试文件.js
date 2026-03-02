const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const config = {
    COLUMN_COUNT: 30, // 表格列数
    ROW_COUNT: 10000 // 表格行数
}
async function generateLargeExcelWithXlsx() {
    const fileName = path.join(__dirname, 'large_data_xlsx_output.xlsx');
    
    const COLUMN_COUNT = config.COLUMN_COUNT; // 表格列数
    const ROW_COUNT = config.ROW_COUNT;        // 表格行数

    console.log(`[xlsx 库] 开始构建数据: ${COLUMN_COUNT} 列 x ${ROW_COUNT} 行...`);
    console.warn(`⚠️  警告: 此操作将占用大量内存。如果崩溃，请使用 "node --max-old-space-size=4096 generate_with_xlsx.js" 运行`);
    
    const startTime = Date.now();

    // 1. 准备表头
    const headers = [];
    for (let i = 1; i <= COLUMN_COUNT; i++) {
        headers.push(`属性_${i}`);
    }

    // 2. 构建数据数组 (AoA - Array of Arrays)
    // 预分配主数组长度，略微提升性能
    const data = new Array(ROW_COUNT);
    
    console.log('正在生成行数据...');

    for (let i = 0; i < ROW_COUNT; i++) {
        const row = new Array(COLUMN_COUNT);
        const rowNum = i + 1; // 行号从 1 开始

        for (let j = 0; j < COLUMN_COUNT; j++) {
            const colNum = j + 1;
            
            // 模拟数据逻辑
            if (j === 0) {
                // 第一列：纯数字行号
                row[j] = rowNum;
            } else if (j === 1) {
                // 第二列：日期字符串 (避免直接传 Date 对象以减少内部转换开销，xlsx 库能识别标准日期字符串)
                row[j] = "2026-03-01"; 
            } else {
                // 其他列：字符串
                // 使用模板字符串可能会稍慢，但在 JS 中是最清晰的。
                // 极致优化可改为: 'Data_R' + rowNum + '_C' + colNum
                row[j] = `Data_R${rowNum}_C${colNum}`;
            }
        }
        
        data[i] = row;

        // 进度日志
        if (rowNum % 20000 === 0) {
            const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            console.log(`已生成 ${rowNum} / ${ROW_COUNT} 行 (当前内存: ${usedMem} MB)`);
        }
    }

    // 3. 合并表头和数据
    // unshift 会在数组头部插入元素，对于大数组这可能涉及内存移动，但比创建新数组好
    console.log('合并表头与工作表数据...');
    data.unshift(headers);

    // 4. 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    
    // aoa_to_sheet: Array of Arrays to Sheet
    // 这是处理大数据最快的方法
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 可选：设置列宽 (注意：遍历 100 列设置宽度很快，但如果数据量极大，渲染时会慢)
    const colWidths = [];
    for(let k=0; k<COLUMN_COUNT; k++) {
        colWidths.push({ wch: 15 }); // 每列宽度 15
    }
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    console.log('数据构建完成，正在写入文件...');

    // 5. 写入文件
    // writeFile 会自动处理压缩和 XML 生成，这是最耗 CPU 和内存的步骤
    XLSX.writeFile(workbook, fileName);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ 成功生成文件 (xlsx 库): ${fileName}`);
    console.log(`⏱️ 总耗时: ${duration} 秒`);

    const stats = fs.statSync(fileName);
    console.log(`📦 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 最终内存检查
    const finalMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    console.log(`💾 最终堆内存占用: ${finalMem} MB`);
}

generateLargeExcelWithXlsx().catch(err => {
    console.error('❌ 发生错误:', err.message);
    if (err.message.includes('heap')) {
        console.error('\n💡 解决建议: 你的内存不足。请尝试使用以下命令运行脚本以增加内存限制:');
        console.error(`node --max-old-space-size=4096 ${process.argv[1] || 'script.js'}`);
    }
    process.exit(1);
});