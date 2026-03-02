"ui";
// const server = require("./module.server.node.cjs")
// const fs = require("fs")
// const path = require("path")

import server from "./module.server.node.js"
import fs from "fs"
import path from "path"
import { pinyin } from 'pinyin-pro'

const __dirname = path.resolve("./")
server.init(path.join(__dirname, "dist"));
server.app.get("/books", (req, res) => {
    res.json(fs.readdirSync(path.join(__dirname, "books")).sort((name1, name2) => name2.localeCompare(name1)))
})
let booksJson = null;
const booksJsonFilePath = path.join(__dirname, 'books.json');
if (fs.existsSync(booksJsonFilePath)) {
    const txt = fs.readFileSync(booksJsonFilePath, 'utf8');
    if (txt.length !== 0) {
        booksJson = JSON.parse(txt);
    }
}

server.app.get("/books-json", (req, res) => {
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
    function getPinyin(str) {
        return pinyin(str, {
            toneType: 'none',
            type: 'string',
            separator: ' '
        })
    }
    function pinyinIncludes(fullStr = '', regStr = "") {
        if (regStr == "") return true
        fullStr = fullStr.trim().toLowerCase();
        regStr = pinyin(regStr.trim().toLowerCase(), {
            toneType: 'none',
            type: 'string',
            separator: ''
        });
        const p = pinyin(fullStr, {
            toneType: 'none',
            multiple: true,
            type: 'all',
        })
        // fullStr的单字拼音中 是否存在一个时 regStr的开头拼音/字符
        for (let i = 0; i < fullStr.length; i++) {
            const arr = pinyin(fullStr[i], {
                toneType: 'none', // 无声调
                multiple: true, // 多音字，单个字时生效
                type: 'array',
            })
            let matchPinyin = ""; // 单字拼音无声调
            let matchPinyin2 = ""; // 首字母
            for (let j = 0; j < arr.length; j++) {
                const word = arr[j];
                if (regStr.startsWith(word)) {
                    matchPinyin = word;
                    break
                } else if (word.startsWith(regStr)) {
                    return true;
                } else if (regStr.startsWith(word[0])) {
                    matchPinyin2 = word[0];
                }
            }
            if (matchPinyin != "") {
                regStr = regStr.slice(matchPinyin.length);
            } else if (matchPinyin2 != "") {
                regStr = regStr.slice(1);
            }
        }
        if (regStr == "") {
            return true
        } else {
            return false
        }
    }
    /**
     * 获取字符串的拼音首字母
     * @param {string} str 中文字符串
     * @returns {string} 首字母字符串（大写）
     */
    function getInitials(str) {
        const pinyinStr = pinyin(str, {
            toneType: 'none',
            type: 'array'
        })

        return pinyinStr.map((word) => word.charAt(0).toUpperCase()).join('')
    }


    const lowerFilterKey = filterKey.toLowerCase()
    console.time("getFilterJson")
    for (let j = 0; j < booksJson.length; j++) {
        const table = booksJson[j].table
        booksJson[j].mTable = []
        if (filterKey.length > 0) {
            for (let i = 0; i < table.length; i++) {
                let rowCells = Object.values(table[i])
                for (let cellIndex = 0; cellIndex < rowCells.length; cellIndex++) {
                    const cellValueLower = (rowCells[cellIndex] += '').toLowerCase()
                    if (cellValueLower.indexOf(lowerFilterKey) != -1 || pinyinIncludes(cellValueLower, lowerFilterKey)) {
                        booksJson[j].mTable.push(table[i])
                        break
                    }
                }
            }
        } else {
            booksJson[j].mTable = table
        }
    }
    console.timeEnd("getFilterJson")
    return booksJson;
}