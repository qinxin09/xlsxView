// import * as XLSX from "xlsx";
// import fs from "fs";
// import path from "path";

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const booksJsonFilePath = require("./config.js").booksJsonFile;
const booksDir = require("./config.js").booksDir
const { pinyin } = require("pinyin-pro")
const allData = [];
main();
async function main() {
    if (fs.existsSync(booksDir) && fs.readdirSync(booksDir).length > 0) {
        const jsonData = []
        const arr = fs.readdirSync(booksDir).sort((name1, name2) => name2.localeCompare(name1))
        arr.forEach((fileName) => {
            if (fileName.endsWith(".xlsx")) {
                console.log("解析Excel文件：" + fileName);
                const file = fs.readFileSync(path.join(booksDir, fileName))
                const workbook = XLSX.read(file, { type: "buffer" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                let tableHeader = []
                json.length > 0 &&
                    (tableHeader = json
                        .shift()
                        .map((item, index) => {
                            return { key: index, value: item }
                        })
                        .filter((item) => item.value != ''))
                const indexTable = [];
                json.forEach((rowCells) => {
                    let full = []; // 单字拼音无声调
                    let szm = []; // 首字母
                    // 遍历一行单元格
                    rowCells.forEach(cell => {
                        // 单元格中的值
                        if (typeof cell === 'string') {
                            const txt = cell.trim().toLowerCase()
                            for (let i = 0; i < txt.length; i++) {
                                const arr = pinyin(txt[i], {
                                    toneType: 'none', // 无声调
                                    multiple: true, // 多音字，单个字时生效
                                    type: 'array',
                                })
                                full.push(arr)
                            }
                        }
                        full.push(["|"])
                    })
                    indexTable.push(full
                    )
                })
                jsonData.push({
                    name: fileName,
                    header: tableHeader,
                    table: json,
                    mTable: [],
                    indexTable
                })
            }
        })
        allData.splice(0, allData.length, ...jsonData);
        // fs.writeFileSync(booksJsonFilePath, JSON.stringify(jsonData, null, 2));
        console.log("解析Excel完毕")
    } else {
        console.log("请先创建books文件夹,并将xlsx文件放入其中,第一行表头不能为空")
        console.log("xlsx的文件格式示例：",
            "姓名|年龄|性别|电话|地址\n" +
            "张三|20|男|1234567890|北京市\n" +
            "李四|25|女|0987654321|上海市\n"
        );
    }
}
module.exports = {
    fresh: main,
    onData: (cb)=>{
        if(allData.length==0){
            main()
        }
        console.log("setValue")
        cb(allData)
    }
};
