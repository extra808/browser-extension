/* popup.js */

import SkipToMenu from './SkipToMenu.js';
customElements.define('skipto-menu', SkipToMenu);

import { LandmarksGroup, HeadingsGroup } from './MenuGroup.js';
customElements.define('landmarks-group', LandmarksGroup);
customElements.define('headings-group', HeadingsGroup);

import { KbdEventMgr } from './KbdEventMgr.js';
var kbdEventMgr;

var contentPort;
var debug = false;

/*
**  Set up listener/handler for contentPort
*/
#ifdef FIREFOX
browser.runtime.onConnect.addListener(connectionHandler);
#endif
#ifdef CHROME
chrome.runtime.onConnect.addListener(connectionHandler);
#endif

function connectionHandler (port) {
  console.log(`port.name: ${port.name}`);
  contentPort = port;
  contentPort.onMessage.addListener(portMessageHandler);

  // Set up listener/handler for message from background
#ifdef FIREFOX
  browser.runtime.onMessage.addListener(messageHandler);
#endif
#ifdef CHROME
  chrome.runtime.onMessage.addListener(messageHandler);
#endif
  function messageHandler (message, sender) {
    if (message.id === 'storage') {
      if (debug) console.log(`popup: 'storage' message`);
      initProcessing(message.data);
    }
  }

  // Request storage options from background script
#ifdef FIREFOX
  browser.runtime.sendMessage({ id: 'getStorage' });
#endif
#ifdef CHROME
  chrome.runtime.sendMessage({ id: 'getStorage' });
#endif
}

function portMessageHandler (message) {
  switch (message.id) {
    case 'menudata':
      constructMenu({
        landmarks: message.landmarks,
        headings: message.headings
      });
      break;
  }
}

/*
** Run content scripts if active tab protocol allows
*/
#ifdef FIREFOX
getActiveTab().then(checkProtocol).catch(onError);
#endif
#ifdef CHROME
getActiveTab().then(tab => checkProtocol(tab));
#endif

function checkProtocol (tab) {
  if (tab.url.indexOf('http:') === 0 || tab.url.indexOf('https:') === 0) {
#ifdef FIREFOX
    browser.tabs.executeScript( { file: 'domUtils.js' } );
    browser.tabs.executeScript( { file: 'content.js' } );
#endif
#ifdef CHROME
    chrome.tabs.executeScript( { file: 'domUtils.js' } );
    chrome.tabs.executeScript( { file: 'content.js' } );
#endif
  }
  else {
    console.log('Invalid protocol: ', tab.url);
  }
}

/*
**  Initiate processing in content script
*/
function initProcessing (options) {
  console.log('initProcessing: ', options);

  const message = {
    id: 'procpage',
    data: options
  };

  contentPort.postMessage(message);
}

/*
**  Set up event handler indicating SkipToMenu is ready
*/
function skipToMenuEventHandler (evt) {
  console.log(`${evt.type}: ${evt.detail}`);
  displayMenu();
}

/*
**  Consume menudata sent by content script
*/
function constructMenu (data) {
  const skipToMenu = document.querySelector('skipto-menu');
  skipToMenu.addEventListener('skipto-menu', skipToMenuEventHandler);

  skipToMenu.landmarksGroup.menuitemClickHandler = sendSkipToData;
  skipToMenu.headingsGroup.menuitemClickHandler = sendSkipToData;
  skipToMenu.landmarksGroup.menudata = data.landmarks;
  skipToMenu.headingsGroup.menudata = data.headings;
}

/*
**  MenuGroup components are built: display SkipTo menu
*/
function displayMenu () {
  const skipToMenu = document.querySelector('skipto-menu');
  skipToMenu.removeEventListener('skipto-menu', skipToMenuEventHandler);
  skipToMenu.checkGroupCounts();

  const menuitems = skipToMenu.menuitems;
  if (menuitems.length) {
    kbdEventMgr = new KbdEventMgr(menuitems, sendSkipToData);
    kbdEventMgr.setFocusFirstItem();

    const menuNode = skipToMenu.shadowRoot.querySelector('div[role="menu"]');
    menuNode.addEventListener('focus', evt => kbdEventMgr.setFocusCurrentItem());
  }
}

/*
** When a menu item is activated, send a message containing the
** value of its 'data-skipto' attribute to the content script
*/
function sendSkipToData (evt) {
  let dataId = evt.currentTarget.getAttribute('data-skipto');
  evt.stopPropagation();
  evt.preventDefault();

  const message = {
    id: 'skipto',
    data: dataId
  };

  function closeUpShop () {
    const skipToMenu = document.querySelector('skipto-menu');
    skipToMenu.removeGroups();
    window.close();
  }

  contentPort.postMessage(message);
  closeUpShop();
}

/*
**  Helper Functions
*/
function getActiveTab () {
  return new Promise (function (resolve, reject) {
#ifdef FIREFOX
    let promise = browser.tabs.query({ currentWindow: true, active: true });
    promise.then(
      tabs => { resolve(tabs[0]) },
      msg => { reject(new Error(`getActiveTab: ${msg}`)); }
    )
#endif
#ifdef CHROME
    chrome.tabs.query({ currentWindow: true, active: true },
      function (tabs) {
        if (notLastError()) { resolve(tabs[0]) }
      });
#endif
  });
}

// Generic error handler
#ifdef FIREFOX
function onError (error) {
  console.log(`Error: ${error}`);
}
#endif
#ifdef CHROME
var console = chrome.extension.getBackgroundPage().console;
function notLastError () {
  if (!chrome.runtime.lastError) { return true; }
  else {
    console.log(chrome.runtime.lastError.message);
    return false;
  }
}
#endif
