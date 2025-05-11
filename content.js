// content.js - 在頁面中運行的腳本
// Version 1.0.0
let isRecording = false;
let recognition = null;
let statusIndicator = null;

// 初始化 UI 元素
function initUI() {
  if (!statusIndicator) {
    statusIndicator = document.createElement('div');
    statusIndicator.id = 'voice-input-status';
    statusIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      display: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(statusIndicator);
    
    // 添加脈動動畫樣式
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(styleElement);
  }
}

// 初始化語音識別
function initSpeechRecognition() {
  if (!recognition) {
    // 檢查瀏覽器支援
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification("您的瀏覽器不支援語音識別功能");
      return false;
    }
    
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'zh-TW'; // 直接設定為繁體中文識別
      
      recognition.onresult = (event) => {
        try {
          const transcript = event.results[0][0].transcript;
          console.log("識別結果:", transcript);
          
          // 直接使用繁體中文識別結果
          insertTextToActiveElement(transcript);
        } catch (error) {
          console.error("處理語音結果時出錯:", error);
          showNotification("處理語音時出錯");
        } finally {
          stopRecording();
        }
      };
      
      recognition.onerror = (event) => {
        console.error("語音識別錯誤:", event.error);
        showNotification(`語音識別錯誤: ${event.error}`);
        stopRecording();
      };
      
      recognition.onend = () => {
        if (isRecording) {
          stopRecording();
        }
      };
      
      return true;
    } catch (error) {
      console.error("初始化語音識別時出錯:", error);
      showNotification("無法初始化語音識別");
      return false;
    }
  }
  return true;
}

// 請求麥克風權限
async function requestMicrophonePermission() {
  try {
    // 請求麥克風權限的簡單方法
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // 獲取後立即釋放資源
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error("麥克風權限請求失敗:", error);
    showNotification("無法獲取麥克風權限，請允許使用麥克風");
    return false;
  }
}

// 開始錄音
async function startRecording() {
  initUI();
  
  // 首先請求麥克風權限
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) return;
  
  if (!initSpeechRecognition()) return;
  
  try {
    isRecording = true;
    recognition.start();
    showStatusIndicator();
    showNotification("語音識別已啟動");
  } catch (error) {
    console.error("啟動錄音時出錯:", error);
    showNotification("無法啟動語音識別");
    isRecording = false;
  }
}

// 停止錄音
function stopRecording() {
  if (isRecording) {
    isRecording = false;
    try {
      recognition.stop();
    } catch (error) {
      console.error("停止錄音時出錯:", error);
    }
    hideStatusIndicator();
    showNotification("語音識別已停止");
  }
}

// 切換錄音狀態
async function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

// 顯示狀態指示器
function showStatusIndicator() {
  initUI();
  statusIndicator.innerHTML = '🎤 正在聆聽...';
  statusIndicator.style.display = 'block';
  statusIndicator.style.animation = 'pulse 1.5s infinite';
}

// 隱藏狀態指示器
function hideStatusIndicator() {
  if (statusIndicator) {
    statusIndicator.style.display = 'none';
  }
}

// 顯示通知
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      try {
        document.body.removeChild(notification);
      } catch (e) {
        // 忽略若元素已被移除的錯誤
      }
    }, 500);
  }, 2000);
}

// 將文字插入到當前活動元素
function insertTextToActiveElement(text) {
  const activeElement = document.activeElement;
  
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
    // 對於input和textarea元素
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      const startPos = activeElement.selectionStart || 0;
      const endPos = activeElement.selectionEnd || 0;
      const beforeText = activeElement.value.substring(0, startPos);
      const afterText = activeElement.value.substring(endPos);
      
      activeElement.value = beforeText + text + afterText;
      
      // 設置光標位置到插入文字之後
      const newCursorPos = startPos + text.length;
      try {
        activeElement.setSelectionRange(newCursorPos, newCursorPos);
      } catch (e) {
        console.error("設置光標位置時出錯:", e);
      }
    } 
    // 對於contentEditable元素
    else if (activeElement.isContentEditable) {
      try {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          
          // 設置光標位置到插入文字之後
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // 如果沒有選擇範圍，直接將文字添加到元素末尾
          activeElement.innerHTML += text;
        }
      } catch (e) {
        console.error("插入文字到contentEditable元素時出錯:", e);
        // 作為備選方案，直接添加到元素末尾
        activeElement.innerHTML += text;
      }
    }
    
    // 觸發input事件，確保輸入框知道值已經改變
    try {
      const inputEvent = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(inputEvent);
    } catch (e) {
      console.error("觸發input事件時出錯:", e);
    }
    
    showNotification("文字已插入");
  } else {
    console.log("沒有找到活動的輸入元素");
    showNotification("請先點擊一個輸入框");
  }
}

// 監聽擴充功能的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleRecording") {
    toggleRecording();
    sendResponse({success: true});
  }
  return true;
});

// 監聽Alt+Q快捷鍵
document.addEventListener('keydown', (event) => {
  if (event.altKey && event.key.toLowerCase() === 'q') {
    event.preventDefault();
    toggleRecording();
  }
});

// 初始化UI
document.addEventListener('DOMContentLoaded', initUI);
