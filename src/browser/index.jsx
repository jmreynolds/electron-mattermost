'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactBootstrap = require('react-bootstrap');

const Grid = ReactBootstrap.Grid;
const Row = ReactBootstrap.Row;
const Col = ReactBootstrap.Col;
const Nav = ReactBootstrap.Nav;
const NavItem = ReactBootstrap.NavItem;
const Badge = ReactBootstrap.Badge;

const electron = require('electron');
const remote = electron.remote;

const osLocale = require('os-locale');
const fs = require('fs');
const url = require('url');
const path = require('path');

const settings = require('../common/settings');

remote.getCurrentWindow().removeAllListeners('focus');

var MainPage = React.createClass({
  getInitialState: function() {
    return {
      key: 0,
      unreadCounts: new Array(this.props.teams.length),
      mentionCounts: new Array(this.props.teams.length),
      unreadAtActive: new Array(this.props.teams.length),
      mentionAtActiveCounts: new Array(this.props.teams.length)
    };
  },
  componentDidMount: function() {
    var thisObj = this;
    var focusListener = function() {
      var webview = document.getElementById('mattermostView' + thisObj.state.key);
      webview.focus();

      thisObj.handleOnTeamFocused(thisObj.state.key);
    };

    var currentWindow = remote.getCurrentWindow();
    currentWindow.on('focus', focusListener);
    window.addEventListener('beforeunload', function() {
      currentWindow.removeListener('focus', focusListener);
    });
  },
  handleSelect: function(key) {
    this.setState({
      key: key
    });
    this.handleOnTeamFocused(key);
  },
  handleUnreadCountChange: function(index, unreadCount, mentionCount, isUnread, isMentioned) {
    var unreadCounts = this.state.unreadCounts;
    var mentionCounts = this.state.mentionCounts;
    var unreadAtActive = this.state.unreadAtActive;
    var mentionAtActiveCounts = this.state.mentionAtActiveCounts;
    unreadCounts[index] = unreadCount;
    mentionCounts[index] = mentionCount;
    // Never turn on the unreadAtActive flag at current focused tab.
    if (this.state.key !== index || !remote.getCurrentWindow().isFocused()) {
      unreadAtActive[index] = unreadAtActive[index] || isUnread;
      if (isMentioned) {
        mentionAtActiveCounts[index]++;
      }
    }
    this.setState({
      unreadCounts: unreadCounts,
      mentionCounts: mentionCounts,
      unreadAtActive: unreadAtActive,
      mentionAtActiveCounts: mentionAtActiveCounts
    });
    this.handleUnreadCountTotalChange();
  },
  markReadAtActive: function(index) {
    var unreadAtActive = this.state.unreadAtActive;
    var mentionAtActiveCounts = this.state.mentionAtActiveCounts;
    unreadAtActive[index] = false;
    mentionAtActiveCounts[index] = 0;
    this.setState({
      unreadAtActive: unreadAtActive,
      mentionAtActiveCounts: mentionAtActiveCounts
    });
    this.handleUnreadCountTotalChange();
  },
  handleUnreadCountTotalChange: function() {
    if (this.props.onUnreadCountChange) {
      var allUnreadCount = this.state.unreadCounts.reduce(function(prev, curr) {
        return prev + curr;
      }, 0);
      this.state.unreadAtActive.forEach(function(state) {
        if (state) {
          allUnreadCount += 1;
        }
      });
      var allMentionCount = this.state.mentionCounts.reduce(function(prev, curr) {
        return prev + curr;
      }, 0);
      this.state.mentionAtActiveCounts.forEach(function(count) {
        allMentionCount += count;
      });
      this.props.onUnreadCountChange(allUnreadCount, allMentionCount);
    }
  },
  handleOnTeamFocused: function(index) {
    // Turn off the flag to indicate whether unread message of active channel contains at current tab.
    this.markReadAtActive(index);
  },

  visibleStyle: function(visible) {
    var visibility = visible ? 'visible' : 'hidden';
    return {
      position: 'absolute',
      top: (this.props.teams.length > 1) ? 42 : 0,
      right: 0,
      bottom: 0,
      left: 0,
      visibility: visibility
    };
  },
  render: function() {
    var thisObj = this;

    var tabs_row;
    if (this.props.teams.length > 1) {
      tabs_row = (
        <Row>
          <TabBar id="tabBar" teams={ this.props.teams } unreadCounts={ this.state.unreadCounts } mentionCounts={ this.state.mentionCounts } unreadAtActive={ this.state.unreadAtActive } mentionAtActiveCounts={ this.state.mentionAtActiveCounts }
            activeKey={ this.state.key } onSelect={ this.handleSelect }></TabBar>
        </Row>
      );
    }

    var views = this.props.teams.map(function(team, index) {
      var handleUnreadCountChange = function(unreadCount, mentionCount, isUnread, isMentioned) {
        thisObj.handleUnreadCountChange(index, unreadCount, mentionCount, isUnread, isMentioned);
      };
      var handleNotificationClick = function() {
        thisObj.handleSelect(index);
      }
      return (<MattermostView id={ 'mattermostView' + index } style={ thisObj.visibleStyle(thisObj.state.key === index) } src={ team.url } name={ team.name } onUnreadCountChange={ handleUnreadCountChange } onNotificationClick={ handleNotificationClick }
              />)
    });
    var views_row = (<Row>
                       { views }
                     </Row>);
    return (
      <Grid fluid>
        { tabs_row }
        { views_row }
      </Grid>
      );
  }
});

var TabBar = React.createClass({
  render: function() {
    var thisObj = this;
    var tabs = this.props.teams.map(function(team, index) {
      var unreadCount = 0;
      if (thisObj.props.unreadCounts[index] > 0) {
        unreadCount = thisObj.props.unreadCounts[index];
      }
      if (thisObj.props.unreadAtActive[index]) {
        unreadCount += 1;
      }

      var mentionCount = 0;
      if (thisObj.props.mentionCounts[index] > 0) {
        mentionCount = thisObj.props.mentionCounts[index];
      }
      if (thisObj.props.mentionAtActiveCounts[index] > 0) {
        mentionCount += thisObj.props.mentionAtActiveCounts[index];
      }

      var badge;
      if (mentionCount != 0) {
        badge = (<Badge>
                   { mentionCount }
                 </Badge>);
      } else if (unreadCount > 0) {
        badge = (<Badge>
                   •
                 </Badge>);
      }
      return (<NavItem className="teamTabItem" id={ 'teamTabItem' + index } eventKey={ index }>
                { team.name }
                { ' ' }
                { badge }
              </NavItem>);
    });
    return (
      <Nav id={ this.props.id } bsStyle="tabs" activeKey={ this.props.activeKey } onSelect={ this.props.onSelect }>
        { tabs }
      </Nav>
      );
  }
});

var MattermostView = React.createClass({
  getInitialState: function() {
    return {
    };
  },
  handleUnreadCountChange: function(unreadCount, mentionCount, isUnread, isMentioned) {
    if (this.props.onUnreadCountChange) {
      this.props.onUnreadCountChange(unreadCount, mentionCount, isUnread, isMentioned);
    }
  },

  componentDidMount: function() {
    var thisObj = this;
    var webview = ReactDOM.findDOMNode(this.refs.webview);

    // Open link in browserWindow. for exmaple, attached files.
    webview.addEventListener('new-window', function(e) {
      var currentURL = url.parse(webview.getURL());
      var destURL = url.parse(e.url);
      if (currentURL.host === destURL.host) {
        window.open(e.url, 'electron-mattermost');
      } else {
        // if the link is external, use default browser.
        require('shell').openExternal(e.url);
      }
    });

    webview.addEventListener("dom-ready", function() {
      // webview.openDevTools();

      // Use 'Meiryo UI' and 'MS Gothic' to prevent CJK fonts on Windows(JP).
      if (process.platform === 'win32') {
        var applyCssFile = function(cssFile) {
          fs.readFile(cssFile, 'utf8', function(err, data) {
            if (err) {
              console.log(err);
              return;
            }
            webview.insertCSS(data);
          });
        };

        osLocale(function(err, locale) {
          if (err) {
            console.log(err);
            return;
          }
          if (locale === 'ja_JP') {
            applyCssFile(__dirname + '/css/jp_fonts.css');
          }
        });
      }
    });

    webview.addEventListener('ipc-message', function(event) {
      switch (event.channel) {
        case 'onUnreadCountChange':
          var unreadCount = event.args[0];
          var mentionCount = event.args[1];
          // isUnread and isMentioned is pulse flag.
          var isUnread = event.args[2];
          var isMentioned = event.args[3];
          thisObj.handleUnreadCountChange(unreadCount, mentionCount, isUnread, isMentioned);
          break;
        case 'onNotificationClick':
          thisObj.props.onNotificationClick();
          break;
      }
    });

    webview.addEventListener('console-message', (e) => {
      const message = `[${this.props.name}] ${e.message}`;
      switch (e.level) {
        case 0:
          console.log(message);
          break;
        case 1:
          console.warn(message);
          break;
        case 2:
          console.error(message);
          break;
        default:
          console.log(message);
          break;
      }
    });
  },
  render: function() {
    // 'disablewebsecurity' is necessary to display external images.
    // However, it allows also CSS/JavaScript.
    // So webview should use 'allowDisplayingInsecureContent' as same as BrowserWindow.
    return (<webview id={ this.props.id } className="mattermostView" style={ this.props.style } preload="webview/mattermost.js" src={ this.props.src } ref="webview"></webview>);
  }
});

var config;
try {
  var configFile = remote.getGlobal('config-file');
  config = settings.readFileSync(configFile);
} catch (e) {
  window.location = 'settings.html';
}
if (config.teams.length === 0) {
  window.location = 'settings.html';
}

var contextMenu = require('./menus/context');
var menu = contextMenu.createDefault();
window.addEventListener('contextmenu', function(e) {
  menu.popup(remote.getCurrentWindow());
}, false);

var showUnreadBadgeWindows = function(unreadCount, mentionCount) {
  const badge = require('./js/badge');
  const sendBadge = function(dataURL, description) {
    // window.setOverlayIcon() does't work with NativeImage across remote boundaries.
    // https://github.com/atom/electron/issues/4011
    electron.ipcRenderer.send('win32-overlay', {
      overlayDataURL: dataURL,
      description: description
    });
  };

  if (mentionCount > 0) {
    const dataURL = badge.createDataURL(mentionCount.toString());
    sendBadge(dataURL, 'You have unread mention (' + mentionCount + ')');
  } else if (unreadCount > 0) {
    const dataURL = badge.createDataURL('•');
    sendBadge(dataURL, 'You have unread channels');
  } else {
    remote.getCurrentWindow().setOverlayIcon(null, '');
  }
}

var showUnreadBadgeOSX = function(unreadCount, mentionCount) {
  if (mentionCount > 0) {
    remote.app.dock.setBadge(mentionCount.toString());
  } else if (unreadCount > 0) {
    remote.app.dock.setBadge('•');
  } else {
    remote.app.dock.setBadge('');
  }
}

var showUnreadBadge = function(unreadCount, mentionCount) {
  switch (process.platform) {
    case 'win32':
      showUnreadBadgeWindows(unreadCount, mentionCount);
      break;
    case 'darwin':
      showUnreadBadgeOSX(unreadCount, mentionCount);
      break;
    default:
  }
}

ReactDOM.render(
  <MainPage teams={ config.teams } onUnreadCountChange={ showUnreadBadge } />,
  document.getElementById('content')
);
