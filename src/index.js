/*global chrome*/
/*global PopupScript*/
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class YoutubeWidget extends React.Component { // try to lift state up
  constructor(props) {
    super(props);
    let durationDisplay = new Date(props.tabDetails.totalDuration * 1000).toISOString().substr(11, 8);
    if (durationDisplay.substr(0, 2) === '00')
      durationDisplay = durationDisplay.substr(3, 5);
    this.state = {
      trackName: props.tabDetails.trackName,
      currentTime: props.tabDetails.currentTime,
      isMakingSound: props.tabDetails.isMakingSound,
      duration: props.tabDetails.totalDuration,
      tabID: props.tabDetails.tabID,
      isPreviousAvailable: props.tabDetails.isPreviousAvailable,
      isNextAvailable: props.tabDetails.isNextAvailable,
      leftspacing: (props.tabDetails.currentTime * 368 / props.tabDetails.totalDuration) + 5,
      progressBarValue: (props.tabDetails.currentTime / props.tabDetails.totalDuration) * 100,
      playbackRate: props.tabDetails.playbackRate,
      durationDisplay: durationDisplay,
      isLoadPending: false
    };
    this.animationPeriod = 200; //logic to change period
    this.ticker = setInterval(this.moveSeekBar.bind(this), this.animationPeriod);
    this.isMouseDown = false;
  }

  componentWillReceiveProps(nextProps) {
    let durationDisplay = new Date(nextProps.tabDetails.totalDuration * 1000).toISOString().substr(11, 8);
    if (durationDisplay.substr(0, 2) === '00')
      durationDisplay = durationDisplay.substr(3, 5);
    this.setState({
      trackName: nextProps.tabDetails.trackName,
      currentTime: nextProps.tabDetails.currentTime,
      isMakingSound: nextProps.tabDetails.isMakingSound,
      duration: nextProps.tabDetails.totalDuration,
      tabID: nextProps.tabDetails.tabID,
      isPreviousAvailable: nextProps.tabDetails.isPreviousAvailable,
      isNextAvailable: nextProps.tabDetails.isNextAvailable,
      leftspacing: (nextProps.tabDetails.currentTime * 368 / nextProps.tabDetails.totalDuration) + 5,
      progressBarValue: (nextProps.tabDetails.currentTime / nextProps.tabDetails.totalDuration) * 100,
      playbackRate: nextProps.tabDetails.playbackRate,
      durationDisplay: durationDisplay
    });
  }

  moveSeekBar() {
    if (this.state.isMakingSound) {
      this.setState(function (state, props) {
        let progressBarValue, leftspacing;
        let currTime = state.currentTime + (this.animationPeriod / 1000 * state.playbackRate);
        if (currTime > state.duration) {
          currTime = state.duration;
        }
        if (this.isMouseDown) {
          progressBarValue = state.progressBarValue;
          leftspacing = state.leftspacing;
        } else {
          progressBarValue = (currTime / state.duration) * 100;
          leftspacing = (currTime * 368 / state.duration) + 5
        }
        return {
          currentTime: currTime,
          leftspacing: leftspacing,
          progressBarValue: progressBarValue
        }
      }.bind(this));
    }
  }

  handleChange(event) {
    let progressValue = (event.clientX - 15) / 368 * 100;
    let xCoOrd = (event.clientX - 15) + 5;
    if (xCoOrd < 5) {
      xCoOrd = 5;
      progressValue = 0;
    } else if (xCoOrd > 373) {
      xCoOrd = 373;
      progressValue = 100;
    }

    if (event.type === 'mousemove' && this.isMouseDown === true) {
      let currentTime = (xCoOrd - 5) / 368 * this.state.duration;
      this.setState({
        progressBarValue: progressValue,
        leftspacing: xCoOrd,
        currentTime: currentTime
      });
    } else if (event.type === 'mousedown' && this.isMouseDown === false) {
      this.isMouseDown = true;
      this.setState({
        progressBarValue: progressValue,
        leftspacing: xCoOrd
      });
    } else if (event.type === 'mouseup' && this.isMouseDown === true) {
      this.isMouseDown = false;
      let currentTime = (xCoOrd - 5) / 368 * this.state.duration;
      this.setState(state => {
        return {
          progressBarValue: progressValue,
          leftspacing: xCoOrd,
          currentTime: currentTime
        }
      });

      let message = {
        'action': 'seek',
        'tabID': this.state.tabID,
        'currentTime': currentTime
      };
      this.props.onClick(message);
    }
  }

  TrackNameClickCallback(event) {
    let message = {
      'action': 'makeTabActive',
      'tabID': this.state.tabID
    };
    this.props.onClick(message);
  }

  buttonClickCallback(event) {
    if (this.state.isLoadPending === false && (event.target.innerText === 'skip_next' || event.target.innerText === 'skip_previous')) {
      this.setState({
        isLoadPending: true
      });
    }
    let message = {
      'tabID': this.state.tabID,
      'action': event.target.innerText
    };
    this.props.onClick(message);
  }

  animationEnd(event) {
    this.setState({
      isLoadPending: false
    });
  }

  render() {
    const transform = 'translateX(' + this.state.leftspacing + 'px)';
    let margin = { 'transform': transform };
    if (this.isMouseDown) {
      margin['background-color'] = '#00BCD4';
    }
    let currentTime = new Date(this.state.currentTime * 1000).toISOString().substr(11, 8);
    if (currentTime.substr(0, 2) === '00') {
      currentTime = currentTime.substr(3, 5);
    }

    if (this.state.trackName && this.state.trackName.length > 0) {
      return (
        <div className='widget-main' onMouseUp={this.handleChange.bind(this)} onMouseMove={this.handleChange.bind(this)}>
          <div className='info-bar'>
            <div className='trackName' onClick={this.TrackNameClickCallback.bind(this)}>
              <div className='songName'>{this.state.trackName}</div>
            </div>
            <div className='control-buttons'>
              <div className='button' style={{ visibility: this.state.isPreviousAvailable ? 'visible' : 'hidden' }} onClick={this.buttonClickCallback.bind(this)}>
                <i className='material-icons'>skip_previous</i>
              </div>
              <div className='button' onClick={this.buttonClickCallback.bind(this)}>
                <i className='material-icons'>{this.state.isMakingSound ? 'pause' : 'play_arrow'}</i>
              </div>
              <div className='button' style={{ visibility: this.state.isNextAvailable ? 'visible' : 'hidden' }} onClick={this.buttonClickCallback.bind(this)}>
                <i className='material-icons'>skip_next</i>
              </div>
            </div>
          </div>
          <div className='seek-bar-container'>
            <div className='seekBar' onMouseDown={this.handleChange.bind(this)}>
              <div className='draggable' style={margin}></div>
              <progress className='progressBar' value={this.state.progressBarValue} max='100'></progress>
            </div>
            <div className='time-container'>
              <div className='time currentTime'>{currentTime}</div>
              <div className='time duration'>{this.state.durationDisplay}</div>
            </div>
          </div>
        </div>
      );
    } else if (this.state.isLoadPending === true) {
      return (
        <div className='widget-main'>
          <div className='loader' onAnimationEnd={this.animationEnd.bind(this)} />
        </div>
      );
    } else {
      return (
        <div className='no-media'>
          <div>
            <div className='songName'>No media currently playing in this tab</div>
          </div>
          <div className='control-buttons'>
            <div className='button' style={{ visibility: 'hidden' }}>
              <i className='material-icons'>skip_previous</i>
            </div>
            <div className='button' onClick={this.buttonClickCallback.bind(this)}>
              <i className='material-icons'>launch</i>
            </div>
            <div className='button' onClick={this.buttonClickCallback.bind(this)}>
              <i className='material-icons'>close</i>
            </div>
          </div>
        </div>
      );
    }
  }
}

class PopupComponent extends React.Component {
  constructor(props) {
    super(props);
    this.popupScript = null;
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
      this.setState({ main: backgroundPage.main });
    }.bind(this));
  }

  componentDidMount() {
    this.popupScript = new PopupScript(this.renderRefresh.bind(this));
  }

  renderRefresh() {
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
      this.setState({ main: backgroundPage.main });
    }.bind(this));
  }

  sendMessageToBackgroundPage(message) {
    this.popupScript.sendMessageToBackgroundPage(message);
  }

  buttonClickCallback(event) {
    if (event.target.innerText === "close") {
      window.close();
      return;
    }
    let message = {
      'action': event.target.innerText
    };
    this.sendMessageToBackgroundPage(message);
  }

  render() {
    const widgetsArray = [];
    if (this.state) {
      for (let key in this.state.main.tabControllers) {
        widgetsArray.push(<YoutubeWidget tabDetails={this.state.main.tabControllers[key]}
          onClick={this.sendMessageToBackgroundPage.bind(this)} />);
      }

      if (Object.keys(this.state.main.tabControllers).length === 0) {
        return (
          <div className='widget-no-open-tab'>
            <div className='text-no-open-tab'>No open Youtube tab found. Open one now?</div>
            <div className='control-buttons no-open-tab'>
              <div className='button' style={{ visibility: 'hidden' }}>
              </div>
              <div className='button' onClick={this.buttonClickCallback.bind(this)}>
                <i className='material-icons'>check</i>
              </div>
              <div className='button' onClick={this.buttonClickCallback.bind(this)}>
                <i className='material-icons'>close</i>
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div>
        {widgetsArray}
      </div>
    )
  }
}

ReactDOM.render(
  <PopupComponent />,
  document.getElementById('root')
);
