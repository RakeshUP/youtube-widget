PopupScript = function (renderCallback) {
  this.main = null;
  this.port = null;
  this.renderCallback = renderCallback;

  this.initialize();
}

PopupScript.prototype.initialize = function () {
  this.port = chrome.runtime.connect(chrome.runtime.id);
  if (chrome.runtime.lastError) {
    console.log("Not able to connect to extension");
    return;
  }
  this.port.onMessage.addListener(this.messageFromBackgroundPage.bind(this));
}

PopupScript.prototype.messageFromBackgroundPage = function (message) {
  this.renderCallback();
}

PopupScript.prototype.sendMessageToBackgroundPage = function (message) {
  this.port.postMessage(message);
}
