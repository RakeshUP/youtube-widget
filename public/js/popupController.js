PopupController = function (popupPort, forwardMessageToTab, disconnectCallback) {
  this.port = popupPort;
  this.ID = popupPort.sender.url;
  this.disconnectCallback = disconnectCallback;
  this.forwardMessageToTab = forwardMessageToTab;

  this.initialize();
};

PopupController.prototype.initialize = function () {
  this.port.onMessage.addListener(this.messageFromPopup.bind(this));
  this.port.onDisconnect.addListener(this.disconnectPopup.bind(this, this.port));
}

PopupController.prototype.disconnectPopup = function () {
  this.disconnectCallback(this.ID);
}

PopupController.prototype.forwardMessage = function (message) {
  this.port.postMessage({
    'command': 'forwardMessageFromTab'
  });
}

PopupController.prototype.makeYoutubeTabActive = function (message) {
  chrome.tabs.get(message.tabID, function (tab) {
    chrome.windows.update(tab.windowId, { 'focused': true }, function (tab, window) {
      chrome.tabs.update(tab.id, { 'active': true });
    }.bind(this, tab));
  });
}

PopupController.prototype.closeTab = function (message) {
  chrome.tabs.remove(message.tabID);
}

PopupController.prototype.openTab = function () {
  chrome.tabs.create({
    url: "https://www.youtube.com/"
  });
}

PopupController.prototype.messageFromPopup = function (message) {
  if (message.action === "makeTabActive" || message.action === "launch") {
    this.makeYoutubeTabActive(message);
  } else if (message.action === "close") {
    this.closeTab(message);
  } else if (message.action === "check") {
    this.openTab();
  } else {
    this.forwardMessageToTab(message);
  }
}