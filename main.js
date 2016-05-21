'use strict';

const ACTIVE_WORK_TAB = 0;
const ISSUES_TAB = 1;
const DAILY_TAB = 2;
const SETTINGS_TAB = 3;

const NUM_TABS = 3; //Exclude SETTINGS_TAB from regular cycle

var selectedTab = ISSUES_TAB;

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
let selectedCard = null;

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
        case 'a':
            selectDiv(ACTIVE_WORK_TAB);
            break;
        case 'd':
            selectDiv(DAILY_TAB);
            break;
        case 'ArrowRight':
            let nextTab = (selectedTab + 1) % NUM_TABS;
            if (nextTab === ACTIVE_WORK_TAB && selectedCard === null) {
                nextTab = (nextTab + 1) % NUM_TABS;
            }
            selectDiv(nextTab);
            break;
        case 'ArrowLeft':
            let prevTab = (selectedTab + NUM_TABS - 1) % NUM_TABS;
            if (prevTab === ACTIVE_WORK_TAB && selectedCard === null) {
                prevTab = (prevTab + NUM_TABS - 1) % NUM_TABS;
            }
            selectDiv(prevTab);
            break;
    }
}
$('#nav-tabs').on('click', function(evt) {
  let tab = $(evt.target).closest('[data-tab]').attr('data-tab');
  selectDiv(tab);
});

//TODO: this should be cleared 5 seconds after it has been set, not just on a 5 second interval
setInterval(function() {bottomNavText();}, 5000);

//Bind all bootstrap tooltip toggles on page
document.body.onkeydown = keyEvent;
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});
