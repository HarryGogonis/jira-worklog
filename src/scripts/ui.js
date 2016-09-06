import { testCredentials } from './jira';

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

// TODO do something more useful ? or just use for encapsulation
const selectCard = function selectCard(card) {
  selectedCard = card;
};

const buildCard = function buildCard(data) {
  const $div = $(`<div class="tile" data-issue-id="${data.id}"></div>`);

  if (data.fields.assignee.name !== localStorage.jiraUsername) {
    $div.append($('<i class="glyphicon glyphicon-user" title="Assigned to other"></i>'));
  }

  if (!data.fields.customfield_10006
    || data.fields.customfield_10006.every(sprint => sprint.indexOf('state=ACTIVE') === -1)) {
    $div.append($('<i class="glyphicon glyphicon-log-out" title="Not on current sprint"></i>'));
  }

  $div.append($(`<img
    width="16px" height="16px"
    alt="${data.fields.issuetype.name}"
    src="${data.fields.issuetype.iconUrl}"
  />`));

  $div.append($(`<img
    width="16px" height="16px"
    alt="${data.fields.priority.name}"
    src="${data.fields.priority.iconUrl}"
  />`));

  /* https://sharpspring.atlassian.net/browse/SRSP-123 external URL? (open in new tab?)

  //TODO: bake in the SS bug severity stuff instead of the priority field?

  //data.fields.timespent;
  //data.fields.timeoriginalestimate;
  //data.fields.timeestimate;

  //TODO: "badge" styling? */
  $div.append($(`<div class="issue-name">${data.fields.status.name}</div>`));
  $div.append($(`<div class="issue-key">${data.key}</div>`));

  // TODO: a progress bar
  const percentDone = (data.fields.timespent / (
    data.fields.timespent + data.fields.timeestimate)) * 100;
  $div.append($(`<div>${Math.round(percentDone)}% done</div>`));

  // FIXME: field summary isn't HTML escaped (just like lots of other fields)
  $div.append($(`
    <div class="issue-summary">
      ${data.fields.summary.replace(/^(\[[^\]]*]| *)+/, '')}
    </div>
  `));
  return $div;
};

const buildWorklog = function buildWorklog(data) {
  // TODO: load these after the issues have been fetched?
  const $issueKey = $(`[data-issue-id=${data.issueId}] .issue-key`).text() ||
  `Issue #${data.issueId}`;
  const $issueSummary = $(`[data-issue-id=${data.issueId}] .issue-summary`).text();

  return $(`
    <li
      data-worklog-id="${data.id}"
      data-worklog-duration="${data.timeSpentSeconds}"
      data-worklog-start="${data.started}"
    >
    ${$issueKey} ${$issueSummary} ${data.timeSpent}
    </li>
    `);
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

  $('#config-form').on('submit', (evt) => {
    evt.preventDefault();
    localStorage.jiraUsername = $('#jiraUsername').val();
    localStorage.jiraPassword = $('#jiraPassword').val();
    localStorage.jiraUrl = $('#jiraUrl').val();
    testCredentials();
  });

  $('#clearCredentials').on('click', () => {
    $('#jiraUsername').val(localStorage.jiraUsername);
    $('#jiraPassword').val(localStorage.jiraPassword);
    $('#jiraUrl').val(localStorage.jiraUrl);
  });

  // Load the initial values in from local storage
  if (localStorage.jiraUsername) {
    $('#jiraUsername').val(localStorage.jiraUsername);
  }
  if (localStorage.jiraPassword) {
    $('#jiraPassword').val(localStorage.jiraPassword);
  }
  if (localStorage.jiraUrl) {
    $('#jiraUrl').val(localStorage.jiraUrl);
  }
};

export default function ui() {
  return {
    bottomNavText,
    selectDiv,
    tabs,
    selectCard,
    buildCard,
    buildWorklog,
  };
}

$(() => {
  init();
});
