/* options.js */

import getMessage from './i18n.js';

const debug = false;
const maxLevelItems = document.querySelectorAll('[name="level"]');
const mainOnly      = document.querySelector('input[id="main-only"]');
const showLevels    = document.querySelector('input[id="show-levels"]');

const defaultOptions = {
  maxLevelIndex: 1,
  mainOnly: false,
  showLevels: true
};

function setFormLabels () {
  const maxLevelLegend  = document.querySelector('fieldset > legend');
  const mainOnlyLabel   = document.querySelector('label[for="main-only"]');
  const showLevelsLabel = document.querySelector('label[for="show-levels"]');
  const saveButton      = document.querySelector('button');

  maxLevelLegend.textContent  = getMessage('maxLevelLabel');
  mainOnlyLabel.textContent   = getMessage('mainOnlyLabel');
  showLevelsLabel.textContent = getMessage('showLevelsLabel');
  saveButton.textContent      = getMessage('buttonLabel');
}

function notifySaved () {}

// Save options object to storage.sync

function saveOptions (options) {
  if (debug) console.log('saveOptions: ', options);

  browser.storage.sync.set(options)
  .then(notifySaved, onError);
}

// Save user options selected in form and display message

function saveFormOptions (e) {
  e.preventDefault();

  function getMaxLevelIndex () {
    for (let i = 0; i < maxLevelItems.length; i++) {
      if (maxLevelItems[i].checked) {
        return i;
      }
    }
    return defaultOptions.maxLevelIndex;
  }

  const options = {
    maxLevelIndex: getMaxLevelIndex(),
    mainOnly: mainOnly.checked,
    showLevels: showLevels.checked
  }

  if (debug) console.log(options);
  saveOptions(options);
}

// Update HTML form values based on user options saved in storage.sync

function updateOptionsForm() {
  setFormLabels();

  function updateForm (options) {
    console.log('updateForm: ', options);

    if (Object.entries(options).length === 0) {
      console.log('options object is empty: saving defaultOptions');
      saveOptions(defaultOptions);
    }

    const maxLevelIndex = (typeof options.maxLevelIndex === 'undefined') ?
      defaultOptions.maxLevelIndex : options.maxLevelIndex;

    const mainOnlyValue = (typeof options.mainOnly === 'undefined') ?
      defaultOptions.mainOnly : options.mainOnly;

    const showLevelsValue = (typeof options.showLevels === 'undefined') ?
      defaultOptions.showLevels : options.showLevels;

    // Set form element values and states
    maxLevelItems[maxLevelIndex].checked = true;
    mainOnly.checked = mainOnlyValue;
    showLevels.checked = showLevelsValue;
  }

  browser.storage.sync.get()
  .then(updateForm, onError);
}

// Generic error handler
function onError (error) {
  console.log(`Error: ${error}`);
}

// Add event listeners for saving and restoring options

document.addEventListener('DOMContentLoaded', updateOptionsForm);
document.querySelector('form').addEventListener('submit', saveFormOptions);
