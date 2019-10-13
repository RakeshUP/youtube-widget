# YouTube Widget
Widget to control media playing in any YouTube™ tab

Features:
 * Click on the song name to directly go the tab
 * Quickly play/pause or skip to next video
 * Seek the video to any point using the seek bar
 * Open a YouTube tab right from the Chrome toolbar
 
## Chrome Web Store 
[https://chrome.google.com/webstore/detail/youtube-widget/hmmageicpcbobjedojoecplfincecdcb](https://chrome.google.com/webstore/detail/youtube-widget/hmmageicpcbobjedojoecplfincecdcb)

## Documentation
This extension makes use of HTML5 video player's APIs to control the media played, runtime ports to pass messages and a popup page written in react.js to give users the control.
The various files present are:
* `contentScript.js`: has a mutation observer to listen to track name changes in YouTube tab and also manipulates DOM to control the media
* `tabController.js`: is tied to the extension and forwards messages to contentScript
* `popupScript.js`: sends a message to popupController when user performs any action in the popup page
* `popupController.js`: is tied to the extension and forwards messages from popup page to tabController
* `background.js`: contains the state of the media, port sink and acts as a bridge between content scripts and popup script
* `index.js`: contains the React components which renders the widget in the popup page

## Development
```
# clone
$ git clone https://github.com/RakeshUP/youtube-widget.git

# install the dependencies
$ npm install

# to build run this command from the root directory
$ npm run-script build
```

## License
MIT

