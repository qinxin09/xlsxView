// const host = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://localhost:3000'
const host = `http://${location.hostname}:3000`
const api = {
    books: host + "/books",
    booksJson: host + "/books-json",
    download: host + "/download",
}
console.log(process.env.NODE_ENV)
export default api;