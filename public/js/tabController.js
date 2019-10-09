TabController = function (contentScriptPort, forwardMessageToPopup, disconnectCallback) {
  this.port = contentScriptPort;
  this.tabID = contentScriptPort.sender.tab.id;
  this.trackName = null;
  this.isPreviousAvailable = false;
  this.isNextAvailable = true;
  this.currentTime = null;
  this.totalDuration = null;
  this.playbackRate = null;
  this.isMakingSound = false;
  this.ticker = null;
  this.animationPeriod = 200;
  this.forwardMessageToPopupCallback = forwardMessageToPopup;
  this.disconnectCallback = disconnectCallback;

  this.initialize();
};

TabController.prototype.initialize = function () {
  this.port.onMessage.addListener(this.messageFromContentScript.bind(this));
  this.port.onDisconnect.addListener(this.disconnectContentScript.bind(this, this.port));
}

TabController.prototype.messageFromContentScript = function (message) {
  this.trackName = message.trackName;
  this.isPreviousAvailable = message.prevButtonVisible;
  this.isNextAvailable = message.nextButtonVisible;
  this.currentTime = message.currentTime;
  this.totalDuration = message.totalDuration;
  this.playbackRate = message.playbackRate;
  switch (message.event) {
    case "playing":
    case "pageLoaded":
      this.isMakingSound = true;
      if (!this.ticker) {
        this.ticker = setInterval(this.timeCalculator.bind(this), this.animationPeriod);
      }
      break;
    case "pause":
    case "stalled":
    case "suspend":
    case "waiting":
    case "abort":
    case "ended":
    case "seeking":
    case "seeked":
      this.isMakingSound = false;
      if (this.ticker) {
        clearInterval(this.ticker);
        this.ticker = null;
      }
      break;
  }
  this.forwardMessageToPopupCallback(message);
}

TabController.prototype.messageToTab = function (message) {
  this.port.postMessage(message);
}

TabController.prototype.timeCalculator = function () {
  this.currentTime = this.currentTime + (this.animationPeriod / 1000 * this.playbackRate);
}

TabController.prototype.disconnectContentScript = function () {
  this.disconnectCallback(this.tabID);
  this.forwardMessageToPopupCallback("tabClosed");
}
