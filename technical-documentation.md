# 繁中語音輸入助手 - 技術實現細節

## 主要技術元素

### 1. Web Speech API

核心功能基於瀏覽器原生的 Web Speech API，特別是 `SpeechRecognition` 介面：

```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'zh-TW'; // 直接設定為繁體中文識別
```

主要參數設定：
- `continuous: false` - 說完一段話後自動停止辨識
- `interimResults: false` - 只返回最終結果，不返回中間結果
- `lang: 'zh-TW'` - 指定語言為繁體中文

### 2. Chrome 擴充功能 API

使用了多個 Chrome 擴充功能 API：

- **commands API**: 處理全局快捷鍵 (Alt+Q)
- **tabs API**: 與當前活動標籤頁通信
- **runtime API**: 處理擴充功能內部通信
- **permissions API**: 請求並管理麥克風權限

### 3. 事件處理設計

擴充功能採用事件驅動架構：

```javascript
// 語音識別事件
recognition.onresult = (event) => { ... };
recognition.onerror = (event) => { ... };
recognition.onend = () => { ... };

// 擴充功能消息事件
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { ... });

// 鍵盤快捷鍵事件
document.addEventListener('keydown', (event) => { ... });
```

### 4. 錯誤處理策略

採用多層錯誤處理確保穩定性：

```javascript
try {
  // 主要操作
} catch (error) {
  console.error("詳細錯誤信息:", error);
  showNotification("用戶友好的錯誤信息");
} finally {
  // 確保清理工作
  stopRecording();
}
```

### 5. 用戶界面設計

動態創建 UI 元素，避免修改頁面結構：

```javascript
function initUI() {
  statusIndicator = document.createElement('div');
  statusIndicator.id = 'voice-input-status';
  statusIndicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    // 其他樣式...
  `;
  document.body.appendChild(statusIndicator);
}
```

### 6. 文字插入機制

支援多種輸入元素：

```javascript
function insertTextToActiveElement(text) {
  const activeElement = document.activeElement;
  
  if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
    // 處理標準輸入框
    const startPos = activeElement.selectionStart || 0;
    const endPos = activeElement.selectionEnd || 0;
    const beforeText = activeElement.value.substring(0, startPos);
    const afterText = activeElement.value.substring(endPos);
    
    activeElement.value = beforeText + text + afterText;
    
  } else if (activeElement.isContentEditable) {
    // 處理富文本編輯器
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      // 設置光標位置...
    }
  }
}
```

## 架構設計

### 文件結構與職責

1. **manifest.json**: 擴充功能配置和權限定義
2. **background.js**: 後台腳本，處理全局事件和快捷鍵
3. **content.js**: 注入頁面的腳本，實現語音識別核心功能
4. **popup.html/js**: 彈出視窗界面和用戶交互

### 通信流程

1. 用戶按下 Alt+Q 或點擊擴充功能按鈕
2. background.js 捕獲事件並發送消息給 content.js
3. content.js 啟動語音識別
4. 語音識別完成後，文字被插入當前輸入框

### 安全考量

1. **麥克風權限**: 明確請求並提供視覺反饋
2. **內容隔離**: content script 限制在頁面沙盒中
3. **錯誤處理**: 防止未處理的異常影響用戶體驗

## 優化考量

1. **性能優化**:
   - 按需創建 UI 元素
   - 使用事件委託減少事件監聽器
   - 避免不必要的 DOM 操作

2. **用戶體驗優化**:
   - 視覺反饋指示當前狀態
   - 錯誤信息友好化
   - 最小化用戶操作步驟

3. **擴展性設計**:
   - 模組化代碼結構
   - 清晰的函數職責
   - 預留配置選項接口
