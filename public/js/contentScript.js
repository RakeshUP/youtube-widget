ContentScript = function () {
  this.port = null;
  this.videoTagNode = null;
  this.DOMNodeObserver = null;
  this.trackNameObserver = null;

  this.connectToExtension();
  this.DOMNodeAddedObserver();
  setInterval(this.pollSkipAd.bind(this), 1000);
};

ContentScript.prototype.connectToExtension = function () {
  this.port = chrome.runtime.connect(chrome.runtime.id);
  if (chrome.runtime.lastError) {
    console.log("Not able to connect to extension");
    return;
  }
  this.port.onMessage.addListener(this.onMessageReceived.bind(this));
}

ContentScript.prototype.DOMNodeAddedObserver = function () {
  if (document.getElementsByTagName("video")[0]) {
    this.addVideoEventListeners();
    return;
  }

  this.DOMNodeObserver = new MutationObserver(this.DOMNodeAddedCallback.bind(this, this.addVideoEventListeners.bind(this)));

  this.DOMNodeObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

ContentScript.prototype.DOMNodeAddedCallback = function (callback, mutations) {
  mutations.forEach(function (mutation) {
    if (!mutation.addedNodes)
      return;

    for (let i = 0; i < mutation.addedNodes.length; i++) {
      let node = mutation.addedNodes[i];
      if (node.tagName && node.tagName.toLowerCase() === "video") {
        this.DOMNodeObserver.disconnect();
        callback();
      }
    }
  }.bind(this));
}

ContentScript.prototype.TrackNameObserverInit = function () {
  if (document.getElementsByClassName("ytp-title-text")[0] && this.trackNameObserver == null) {
    this.trackNameObserver = new MutationObserver(this.TrackNameObserverCallback.bind(this, this.sendMediaDetails.bind(this, "trackNameMutation")));

    this.trackNameObserver.observe(document.getElementsByClassName("ytp-title-text")[0], {
      childList: true,
      subtree: true
    });
  }
}

ContentScript.prototype.TrackNameObserverCallback = function (callback, mutations) {
  mutations.forEach(function (mutation) {
    callback();
  }.bind(this));
}

ContentScript.prototype.addVideoEventListeners = function () {
  if (document.getElementsByTagName("video")[0]) {
    this.videoTagNode = document.getElementsByTagName("video")[0];
    this.sendMediaDetails("pageLoaded");
    this.videoTagNode.addEventListener("abort", this.sendMediaDetails.bind(this, "abort"));
    this.videoTagNode.addEventListener("durationchange", this.sendMediaDetails.bind(this, "durationchange"));
    this.videoTagNode.addEventListener("ended", this.sendMediaDetails.bind(this, "ended"));
    this.videoTagNode.addEventListener("loadeddata", this.sendMediaDetails.bind(this, "loadeddata"));
    this.videoTagNode.addEventListener("loadstart", this.sendMediaDetails.bind(this, "loadstart"));
    this.videoTagNode.addEventListener("pause", this.sendMediaDetails.bind(this, "pause"));
    this.videoTagNode.addEventListener("play", this.sendMediaDetails.bind(this, "play"));
    this.videoTagNode.addEventListener("playing", this.sendMediaDetails.bind(this, "playing"));
    this.videoTagNode.addEventListener("ratechange", this.sendMediaDetails.bind(this, "ratechange"));
    this.videoTagNode.addEventListener("seeked", this.sendMediaDetails.bind(this, "seeked"));
    this.videoTagNode.addEventListener("seeking", this.sendMediaDetails.bind(this, "seeking"));
    this.videoTagNode.addEventListener("stalled", this.sendMediaDetails.bind(this, "stalled"));
    this.videoTagNode.addEventListener("suspend", this.sendMediaDetails.bind(this, "suspend"));
    this.videoTagNode.addEventListener("waiting", this.sendMediaDetails.bind(this, "waiting"));
  }
}

ContentScript.prototype.sendMediaDetails = function (event) {
  let prevButtonVisible, nextButtonVisible, trackName, currentTime, totalDuration, playbackRate;

  this.TrackNameObserverInit();
  trackName = document.getElementsByClassName("ytp-title-text")[0].innerText;
  currentTime = this.videoTagNode.currentTime;
  playbackRate = this.videoTagNode.playbackRate;
  totalDuration = this.videoTagNode.duration;

  if (!document.getElementsByClassName("ytp-prev-button")[0]) {
    prevButtonVisible = false;
  } else if (document.getElementsByClassName("ytp-prev-button")[0].style.display == "none") {
    prevButtonVisible = false;
  } else {
    prevButtonVisible = true;
  }

  if (!document.getElementsByClassName("ytp-next-button")[0]) {
    nextButtonVisible = false;
  } else if (document.getElementsByClassName("ytp-next-button")[0].style.display == "none") {
    nextButtonVisible = false;
  } else {
    nextButtonVisible = true;
  }

  this.port.postMessage({
    'command': 'mediaDetailsChange',
    'trackName': trackName,
    'prevButtonVisible': prevButtonVisible,
    'nextButtonVisible': nextButtonVisible,
    'currentTime': currentTime,
    'totalDuration': totalDuration,
    'playbackRate': playbackRate,
    'event': event
  });
}

ContentScript.prototype.pollSkipAd = function () {
  let skipAdButton = document.getElementsByClassName("ytp-ad-skip-button ytp-button")[0];
  let overlayButton = document.getElementsByClassName("ytp-ad-overlay-close-button")[0];
  if (overlayButton) {
    overlayButton.click();
    console.log("Overlay closed automatically");
  }
  if (skipAdButton) {
    skipAdButton.children[0].click();
    console.log("Ad skipped automatically");
  }
}

ContentScript.prototype.onMessageReceived = function (message) {
  switch (message.action) {
    case "sendDetails":
      this.sendMediaDetails("extensionRequest");
      break;
    case "play_arrow":
      document.getElementsByClassName("ytp-play-button")[0].click();
      break;
    case "pause":
      document.getElementsByClassName("ytp-play-button")[0].click();
      break;
    case "skip_previous":
      document.getElementsByClassName("ytp-prev-button")[0].click();
      break;
    case "skip_next":
      document.getElementsByClassName("ytp-next-button")[0].click();
      break;
    case "seek":
      if (this.videoTagNode) {
        this.videoTagNode.currentTime = message.currentTime;
      }
      break;
  }
}

contentScript = new ContentScript();