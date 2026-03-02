<template>
  <div>
    <el-row style="height: 5vh; justify-content: center">
      <el-col :span="12" style="height: 5vh; min-height: 40px">
        <el-input v-model="filterKey" placeholder="字/拼音/首字母" clearable @input="onInput">
          <template #prefix>
            <i class="el-icon-search"></i>
          </template>
        </el-input>
      </el-col>
    </el-row>

    <el-scrollbar height="90vh">
      <!-- loading 绑定到局部变量或保持原样 -->
      <div v-loading="loading" style="min-height: 300px">
        <!-- ✅ 关键修改 1: key 使用唯一标识 book.name，而不是索引 i -->
        <div v-for="book in books" :key="book.name" style="margin-top: 30px">
          <el-link :clickable="true" @click="onBookClick(book)" :underline="false" type="primary">
            {{ book.name }}【{{ book.mTable ? book.mTable.length : 0 }}条记录】
          </el-link>
            <!-- {{  book.mTable.length }}--{{ book.table.length }} -->
          <el-table
            v-if="book.mTable && book.mTable.length > 0 && book.mTable.length != book.table.length"
            :data="book.mTable"
            style="width: 100%"
            max-height="500px"
            :border="true"
          >
            <!-- ✅ 关键修改 2: 内部列的 key 也要稳定 -->
            <el-table-column v-for="(item, j) in book.header" :key="item.key" :prop="item.key + ''" :label="item.value"></el-table-column>
          </el-table>
        </div>

        <!-- 空状态提示 -->
        <div v-if="!loading && books && books.length === 0" style="text-align: center; padding: 20px">没有找到匹配的记录</div>
      </div>
    </el-scrollbar>

    <!-- Drawer 部分保持不变，但建议检查 book.table 访问的安全性 -->
    <el-drawer :title="drawer.title" v-model="drawer.visible" direction="btt" size="90%">
      <div style="display: flex; height: -webkit-fill-available">
        <!-- <el-table 
          v-if="drawer.book && drawer.book.table && drawer.book.table.length > 10" 
          :data="drawer.book.table" 
          style="width: 100%; height: auto; display: flex" 
          :border="true" 
          @row-click="onRowClick"
        >
          <el-table-column 
            v-for="(item, j) in drawer.book.header" 
            :key="'drawer' + item.key" 
            :prop="item.key + ''" 
            :label="item.value"
          ></el-table-column>
        </el-table> -->
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              :columns="columns"
              :data="data"
              :width="width"
              :height="height"
              fixed
              style="width: 100%; height: auto; display: flex; justify-content: center"
            />
          </template>
        </el-auto-resizer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="GiftBook">
import api from '@/api'
import { onMounted, ref, reactive, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'

const filterKey = ref('')
const allBooks = ref([])
const books = computed(() => {
  if (!filterKey.value) {
    return allBooks.value
  }
  // ⚠️ 警告：如果你没有把后端的拼音过滤逻辑搬到前端，这里无法工作。
  // 如果你能搬到前端，这是最完美的解法。
  // 伪代码：
  // return filterDataLocally(allBooks.value, filterKey.value)

  // 临时方案：如果还没搬逻辑，先返回全量，避免报错，但无法过滤
  return allBooks.value
})
const loading = ref(false)
const drawer = reactive({ title: '', visible: false, book: {} })
let timer = null

onMounted(() => {
  init()
})

async function init() {
  loading.value = true
  try {
    const response = await fetch(api.booksJson)
    const data = await response.json()
    console.log('data');
    allBooks.value.splice(0,allBooks.value.length, ...data) // 存入全量
    // books.value = data // 初始显示全部
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

function onInput() {
  if (timer) clearTimeout(timer)
  // 防抖时间稍微加长一点，减少请求频率
  timer = setTimeout(() => {
    updateTable()
  }, 500)
}

async function updateTable() {
  // 如果关键词为空，可以直接用初始数据（如果 init 里存了一份的话），或者继续请求
  // 这里保持你的请求逻辑，但优化处理过程

  const currentKey = filterKey.value
  loading.value = true

  try {
    const response = await fetch(api.booksJson + '?filterKey=' + encodeURIComponent(currentKey))
    if (!response.ok) throw new Error('Network response was not ok')

    const data = await response.json()

    // ✅ 关键修复：在赋值前检查是否还是当前的搜索词（防止竞态）
    if (filterKey.value === currentKey) {
      // 强制触发一次 nextTick 确保 DOM 稳定后再赋值？通常不需要。
      // 主要是确保 key 的稳定性（已在模板中修改为 book.name）
      allBooks.value.splice(0,allBooks.value.length, ...data) // 存入全量
    }
  } catch (error) {
    console.error('Fetch error:', error)
  } finally {
    // 只有当当前请求对应的关键词仍然是最新关键词时，才关闭 loading
    if (filterKey.value === currentKey) {
      loading.value = false
    }
  }
}
const columns = ref([])
const data = ref([])
// ... 其他函数 (onRowClick, onBookClick) 保持不变 ...
function onBookClick(book) {
  columns.value = book.header.map((item) => {
    return {
      key: item.key,
      dataKey: item.key + '',
      title: item.value,
      width: 150
    }
  })
  drawer.title = book.name
  data.value = book.table.map((cells, rowIndex) => {
    const mData = {
      ...columns.value[0],
      id: `cell-${rowIndex}`,
      parentId: null
    }
    cells.forEach((cell, cellIndex) => {
      mData[columns.value[cellIndex].dataKey] = cell
    })
    return mData
  })
  drawer.visible = true
  console.log(data.value)
  return

  ElMessage({
    message: '查看全部',
    duration: 500,
    customClass: 'show-page-message',
    placement: 'bottom'
  })
}

function onRowClick(row, column, event) {
  // ... 原有逻辑 ...
  const strJoin = row.join('')
  if (strJoin == '') return
  let message = []
  let page = 1
  if (!drawer.book || !drawer.book.table) return

  drawer.book.table.forEach((item, index) => {
    const mStrJoin = item.join('')
    page += mStrJoin === '' ? 1 : 0
    if (mStrJoin == strJoin) {
      message.push(`<p>在第${page}页</p>`)
    }
  })

  if (page > 2) {
    ElMessage({
      dangerouslyUseHTMLString: true,
      message: message.join(''),
      type: 'success',
      duration: 500,
      customClass: 'show-page-message',
      placement: 'bottom',
      center: true
    })
  }
}

const generateColumns = (length = 10, prefix = 'column-', props) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150
  }))

const generateData = (columns = [], length = 200, prefix = 'row-') =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null
      }
    )
  })
</script>
