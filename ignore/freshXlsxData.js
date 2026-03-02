import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

// const XLSX = require("xlsx");
// const fs = require("fs");
// const path = require("path");

console.time()
const jsonData = []
const arr = fs.readdirSync(path.resolve("./books")).sort((name1, name2) => name2.localeCompare(name1))
arr.forEach((fileName) => {
    if (fileName.endsWith(".xlsx")) {
        const file = fs.readFileSync(path.resolve("./books/" + fileName))
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
        jsonData.push({
            name: fileName,
            header: tableHeader,
            table: json,
            mTable: []
        })
    }
})
console.timeEnd();
fs.writeFileSync(path.resolve("./books.json"), JSON.stringify(jsonData,null,2))