// popup.js - 彈出窗口的腳本
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggleBtn');
  
  toggleBtn.addEventListener('click', async function() {
    try {
      // 請求麥克風權限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 獲取後立即釋放資源
      stream.getTracks().forEach(track => track.stop());
      
      // 向當前標籤頁發送消息
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleRecording"}, function(response) {
          console.log("語音輸入請求已發送", response);
          window.close(); // 關閉彈出窗口
        });
      });
    } catch (error) {
      console.error("無法獲取麥克風權限:", error);
      // 顯示錯誤信息
      const statusDiv = document.querySelector('.status');
      statusDiv.innerHTML = "錯誤: 無法獲取麥克風權限，請在瀏覽器設置中允許使用麥克風。";
      statusDiv.style.color = "#d32f2f";
      statusDiv.style.backgroundColor = "#ffebee";
    }
  });
});