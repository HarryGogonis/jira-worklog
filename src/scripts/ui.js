const tabs = {
  ACTIVE_WORK: 0,
  ISSUES: 1,
  DIALY: 2,
  SETTINGS: 3,
};

const NUM_TABS = 3; // Exclude SETTINGS_TAB from regular cycle

let selectedTab = tabs.ISSUES;
let shortcutsEnabled = true;
let selectedCard = null;

// TODO rewrite
const bottomNavText = function bottomNavText(val) {
  if (val) {
    document.body.style.paddingBottom = '33px';
    document.querySelector('#bottom-nav').classList.remove('hide');
  } else {
    document.querySelector('#bottom-nav').classList.add('hide');
    document.body.style.paddingBottom = '5px';
  }
  document.querySelector('#bottom-nav-text').innerHTML = val;
};

const selectDiv = function selectDiv(id) {
  if (selectedTab === id) { return; }
  document.querySelector(`[data-container="${selectedTab}"]`).classList.add('hide');
  document.querySelector(`li[data-tab="${selectedTab}"]`).classList.remove('active');
  selectedTab = id;
  document.querySelector(`[data-container="${selectedTab}"]`).classList.remove('hide');
  document.querySelector(`li[data-tab="${selectedTab}"]`).classList.add('active');
};

// TODO do something useful
const selectCard = function selectCard(id) {
  selectedCard = id;
};

// TODO: delegate any events I don't specifically want to a per-tab handler function
const keyEvent = function keyEvent(evt) {
  if (!shortcutsEnabled) {
    return;
  }

  let nextTab = (selectedTab + 1) % NUM_TABS;
  let prevTab = (selectedTab + (NUM_TABS - 1)) % NUM_TABS;
  bottomNavText(evt.key);

  switch (evt.key) {
    case '?':
      selectDiv(tabs.SETTINGS);
      break;
    case 's':
      selectDiv(tabs.ISSUES);
      break;
    case 'a':
      selectDiv(tabs.ACTIVE_WORK);
      break;
    case 'd':
      selectDiv(tabs.DAILY);
      break;
    case 'ArrowRight':
      if (nextTab === tabs.ACTIVE_WORK && selectedCard === null) {
        nextTab = (nextTab + 1) % NUM_TABS;
      }
      selectDiv(nextTab);
      break;
    case 'ArrowLeft':
      if (prevTab === tabs.ACTIVE_WORK && selectedCard === null) {
        prevTab = (prevTab + (NUM_TABS - 1)) % NUM_TABS;
      }
      selectDiv(prevTab);
      break;
    default:
      break;
  }
};

const init = function init() {
  $('input').on('focus', () => { shortcutsEnabled = false; })
            .on('blur', () => { shortcutsEnabled = true; });

  $('#nav-tabs').on('click', (evt) => {
    const tab = $(evt.target).closest('[data-tab]').attr('data-tab');
    selectDiv(tab);
  });

  // TODO: this should be cleared 5 seconds after it has been set, not just on a 5 second interval
  setInterval(bottomNavText, 5000);

  // Bind all bootstrap tooltip toggles on page
  document.body.onkeydown = keyEvent;
  $('[data-toggle="tooltip"]').tooltip();
};

export default function ui() {
  return {
    bottomNavText,
    selectDiv,
    tabs,
    selectCard,
  };
}

$(() => {
  init();
});
