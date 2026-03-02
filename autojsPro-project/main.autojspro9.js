"ui";
require("rhino").install();
const Color = android.graphics.Color;
const Build = android.os.Build;

const ui = require('ui');
const path = require('path');
require("./server.node.js")


class WebActivity extends ui.Activity {
    get initialStatusBar() {
        return {
            color: '#000000',
            light: false
        };
    }

    get layoutXml() {
        return `
<vertical>
    <webview id="web" w="*" h="*"/>
</vertical>
        `
    }

    onContentViewSet(contentView) {
        this.webview = contentView.binding.web;
        this.initializeWebView(this.webview);
        logLocation(this.webview.jsBridge);
    }
    onResume() {
        super.onResume()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            this.getWindow().setNavigationBarColor(Color.BLACK);
        }
    }

    initializeWebView(webview) {
        // webview.loadUrl(`file://${__dirname}/dist/index.html`);
        webview.loadUrl(`http://localhost:3000`);
        // webview.loadUrl(`http://192.168.43.31:5173`);
        // webview.loadUrl(`http://localhost:3000/#/giftbook`);
        // 监听WebView的控制台消息，打印到控制台
        // webview.on('console_message', (event, msg) => {
        //     console.log(`${path.basename(msg.sourceId())}:${msg.lineNumber()}: ${msg.message()}`);
        // });
        const jsBridge = webview.jsBridge;
        // 监听Web的listFiles请求，返回文件夹的文件列表
        jsBridge.handle('listFiles', async (event, args) => {
            const dir = args.path;
            return [];
        });
        // 监听Web的finish请求，销毁界面
        jsBridge.handle('finish', () => {
            this.finish();
        });
    }

    // 监听Activity的返回事件
    onBackPressed() {
        super.onBackPressed();
        process.exit(0)
        //不调用 super.onBackPressed()，避免返回时销毁界面
        // 通知web返回上一级目录
        this.webview.jsBridge.invoke('go-back').then((dir) => console.log(`go back to ${dir}`));
    }
}
ui.setMainActivity(WebActivity);

async function logLocation(jsBridge) {
    const href = await jsBridge.eval("window.location.href");
    console.log(decodeURI(href));
}