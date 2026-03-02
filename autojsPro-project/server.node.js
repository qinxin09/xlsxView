"ui";
const server = require("./module.server.node.js")
const fs = require("fs")
const path = require("path")
const { pinyin } = require("pinyin-pro")
const xlsxFreshData = require("./freshXlsxData.js")
// import server from "./module.server.node.js"
// import fs from "fs"
// import path from "path"
// import { pinyin } from 'pinyin-pro'

// const __dirname = path.resolve("./")
server.init(path.join(__dirname, "dist"));
let booksJson = []
xlsxFreshData.onData((data)=>{
    booksJson = data
})
server.app.get("/books", (req, res) => {
    res.json(booksJson.sort((name1, name2) => name2.localeCompare(name1)))
})


server.app.get("/books-json", (req, res) => {
    console.log("booksJson:", booksJson?"true":"false")
    if (booksJson) {
        const filterKey = req.query.filterKey;
        if (filterKey && filterKey.length > 0) {
            return res.json(getFilterJson(filterKey))
        } else {
            booksJson.forEach((item) => {
                item.mTable = item.table
            })
            return res.json(booksJson);
        }
    }
    res.status(404).json({ msg: "出错了" });
})
server.app.post("/download", (req, res) => {
    const filename = req.body.filename
    const fullpath = path.join(__dirname, "books", filename)
    res.download(fullpath, filename)
})
server.start(3000)
console.log("__dirname", __dirname);




function getFilterJson(filterKey) {
    const lowerFilterKey = filterKey.trim().toLowerCase();
    
    // 如果过滤键为空，直接返回所有数据
    if (lowerFilterKey.length === 0) {
        for (let tableIndex = 0; tableIndex < booksJson.length; tableIndex++) {
            booksJson[tableIndex].mTable = booksJson[tableIndex].table;
        }
        return booksJson;
    }

    for (let tableIndex = 0; tableIndex < booksJson.length; tableIndex++) {
        const sourceTable = booksJson[tableIndex].table;
        const indexTable = booksJson[tableIndex].indexTable;
        booksJson[tableIndex].mTable = [];

        // 遍历每一行
        for (let rowIndex = 0; rowIndex < sourceTable.length; rowIndex++) {
            const rowData = sourceTable[rowIndex];
            const rowPinyinFlat = indexTable[rowIndex]; // 这是一个扁平数组：[ [p1], [p2], ..., ["|"], [p3]... ]
            
            let isRowMatched = false;
            let pyPointer = 0; // 拼音数组的指针，指向当前正在处理的字的拼音

            // 遍历该行的每一个单元格
            for (let cellIndex = 0; cellIndex < rowData.length; cellIndex++) {
                const cellValue = rowData[cellIndex];
                
                // 收集当前单元格对应的所有字的拼音数组
                let currentCellPinyins = [];
                
                // 从 rowPinyinFlat 中截取属于当前单元格的拼音段
                while (pyPointer < rowPinyinFlat.length) {
                    const item = rowPinyinFlat[pyPointer];
                    // 遇到分隔符，说明当前单元格结束
                    if (Array.isArray(item) && item.length === 1 && item[0] === "|") {
                        pyPointer++; // 跳过分隔符，准备处理下一个单元格
                        break;
                    }
                    currentCellPinyins.push(item);
                    pyPointer++;
                }

                // 如果单元格是字符串且不为空，进行匹配
                if (cellValue && typeof cellValue === 'string') {
                    if (checkCellMatch(cellValue, currentCellPinyins, lowerFilterKey)) {
                        isRowMatched = true;
                        break; // 只要该行有一个单元格匹配成功，整行保留
                    }
                }
            }

            if (isRowMatched) {
                booksJson[tableIndex].mTable.push(rowData);
            }
            
            // 注意：如果某行前面的单元格没匹配完，pyPointer 可能没走到头，但下一行会重置 pyPointer，所以没问题
        }
    }

    return booksJson;
}

/**
 * 检查单个单元格是否匹配
 * @param {string} cellValue 单元格文本，如 "常山北明"
 * @param {Array<Array<string>>} cellPinyins 该单元格对应的拼音数组列表，如 [ ["chang","zhang"], ["shan"], ["bei"], ["ming"] ]
 * @param {string} filterKey 过滤关键词，如 "csbm"
 */


function checkCellMatch(cellValue, cellPinyins, filterKey) {
    // 如果进入这里 filterKey 为空，说明匹配完成。
    if (!filterKey) return true; 
    for (let wordIndex = 0; wordIndex < cellPinyins.length; wordIndex++) {
        if (filterKey.length === 0) {
            return true;
        }
        const pys = cellPinyins[wordIndex].filter(i=> typeof i === 'string');
        // 多音字只能匹配一次
        for (let pyIndex = 0; pyIndex < pys.length; pyIndex++) {
            if(filterKey.startsWith(pys[pyIndex])){
                filterKey = filterKey.slice(pys[pyIndex].length)
                break;
            }else if(filterKey.startsWith(pys[pyIndex].slice(0,1))){
                filterKey = filterKey.slice(1)
                break;
            }
        }
    }
    return filterKey.length === 0
}