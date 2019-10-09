Main = function () {
  this.tabControllers = new Object();
  this.popupPort = null;
  this.isYoutubeMuted = false;

  this.initialize();
}

Main.prototype.connectCallback = function (contentScriptPort) {
  if (!contentScriptPort.sender.tab) {
    this.popupPort = new PopupController(contentScriptPort, this.forwardMessageToTab.bind(this), this.disconnectCallback.bind(this));
    return;
  }
  this.tabControllers[contentScriptPort.sender.tab.id] = new TabController(contentScriptPort, this.forwardMessageToPopup.bind(this), this.disconnectCallback.bind(this));
  chrome.tabs.get(contentScriptPort.sender.tab.id, this.getTabDetails.bind(this));
}

Main.prototype.disconnectCallback = function (ID) {
  if (typeof ID == "string") {
    this.popupPort = null;
    return;
  }
  delete this.tabControllers[ID];
}

Main.prototype.forwardMessageToPopup = function (message) {
  if (this.popupPort != null) {
    this.popupPort.forwardMessage();
  }
}

Main.prototype.forwardMessageToTab = function (message) {
  this.tabControllers[message.tabID].messageToTab(message);
}

Main.prototype.tabUpdatedCallback = function (tabID, changeInfo) {
  if (this.tabControllers[tabID]) {
    if (changeInfo.mutedInfo) {
      this.isYoutubeMuted = changeInfo.mutedInfo.muted;
      this.forwardMessageToPopup();
    }
  }
}

Main.prototype.getTabDetails = function (tab) {
  if (tab.mutedInfo) {
    this.isYoutubeMuted = tab.mutedInfo.muted;
  }
}

Main.prototype.initialize = function () {
  chrome.runtime.onConnect.addListener(this.connectCallback.bind(this));
  chrome.tabs.onUpdated.addListener(this.tabUpdatedCallback.bind(this));
}

var main = new Main();