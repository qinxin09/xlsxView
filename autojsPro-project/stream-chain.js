// npm install stream-json stream-chain
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
const fs = require("fs");
const path = require('path');
const pipeline = chain([
  fs.createReadStream(path.join(__dirname, 'books.json')), // 创建读取流
  parser(),                               // 将文本流解析为 JSON 事件流
  streamArray(),                          // 专门处理 JSON 数组，每次 emit 一个对象
  data => {
    // 这里处理每一个单独的对象 (data.key 是索引, data.value 是对象)
    const record = data.value;
    console.log(data)
    
    // 模拟耗时操作
    // processRecord(record); 
    
    // 注意：不要在这里累积所有结果到一个大数组中！
    // 如果需要写入数据库，直接写入即可
    console.log('处理了一条数据:', record.id);
  }
]);

pipeline.on('error', error => console.error('解析错误:', error));
pipeline.on('end', () => console.log('所有数据处理完毕'));