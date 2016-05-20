'use strict';

const WORK_TAB = 0;
const EVENT_TAB = 1;
const ISSUES_TAB = 2;
const SETTINGS_TAB = 3;

const NUM_TABS = 4;

var selectedTab = WORK_TAB;

function bottomNavText(val) {
    if (val) {
        document.body.style.paddingBottom = '33px';
        document.querySelector('#bottom-nav').classList.remove('hide');
    } else {
        document.querySelector('#bottom-nav').classList.add('hide');
        document.body.style.paddingBottom = '5px';
    }
    document.querySelector('#bottom-nav-text').innerHTML = val;
}

function selectDiv(id) {
    if (selectedTab === id) { return; }
    document.querySelector(`[data-container="${selectedTab}"]`).classList.add('hide');
    document.querySelector(`li[data-tab="${selectedTab}"]`).classList.remove('active');
    selectedTab = id;
    document.querySelector(`[data-container="${selectedTab}"]`).classList.remove('hide');
    document.querySelector(`li[data-tab="${selectedTab}"]`).classList.add('active');
}

function openExternal(url) {
  window.open(url, 'issues_ext').focus();
}

let shortcutsEnabled = true;

function keyboardShortcuts(enable) {
    shortcutsEnabled = enable;
}

function keyEvent(evt) {
    if (!shortcutsEnabled) {
        return;
    }

    bottomNavText(evt.key);
    switch(evt.key) {
        case '?':
            selectDiv(SETTINGS_TAB);
            break;
        case 's':
            selectDiv(ISSUES_TAB);
            break;
        case 'w':
            selectDiv(WORK_TAB);
            break;
        case 'e':
            selectDiv(EVENT_TAB);
            break;
        case 'ArrowRight':
            selectDiv((selectedTab + 1) % NUM_TABS);
            break;
        case 'ArrowLeft':
            selectDiv((selectedTab + NUM_TABS - 1) % NUM_TABS);
            break;
    }
}

document.querySelector('#nav-tabs').addEventListener('click', function(evt) {
    if (evt.target !== evt.currentTarget) {
        var li = evt.target.parentNode;
        var thang = li.attributes.getNamedItem('data-tab').value;
        selectDiv(parseInt(thang, 10));
    }
    evt.stopPropagation();
}, false);

setInterval(function() {bottomNavText();}, 5000);

document.body.onkeydown = keyEvent;
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})