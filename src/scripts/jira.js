import ui from './ui';
import scheduler from './scheduler';

let lastIssuesUpdate = null;
let lastWorklogUpdate = null;
const API_PREFIX = '/rest/api/2';

const getCredentials = function getCreds() {
  if (!('jiraUsername' in localStorage
    && 'jiraPassword' in localStorage
    && 'jiraUrl' in localStorage)) {
    return false;
  }
  return btoa(`${localStorage.jiraUsername}:${localStorage.jiraPassword}`);
};

// TODO refactor to use promises and merge with jiraPost
const jiraRequest = function jiraRequest(path, success, failure) {
  const url = localStorage.jiraUrl + API_PREFIX + path;
  const xhr = new XMLHttpRequest();

  if (!('jiraUsername' in localStorage
    && 'jiraPassword' in localStorage
    && 'jiraUrl' in localStorage)) {
    failure('JIRA credentials not configured');
    // TODO: pass either server down or invalid credentials type errors to callback
    return;
  }

  xhr.timeout = 1000 * 6;

  console.log(`Sending request to ${url}`);

  xhr.onreadystatechange = function handleReadyStateChange() {
    if (xhr.readyState !== XMLHttpRequest.DONE) {
      return; // Don't care about intermediate steps, just when the request is done
    }
    if (xhr.status >= 200 && xhr.status < 300) {
      success(xhr.responseText);
      // TODO: check response type, JSON parse result?
      // or maybe just always json parse it? does the JIRA api ever return anything else?
    } else {
      console.error(`HTTP ${xhr.status} returned from ${url}`);
      console.error(xhr.responseText);
      failure(`Failure connecting to ${url}`, xhr.status, xhr.responseText);
    }
  };

  xhr.onerror = failure;

  xhr.open('GET', url);

  const creds = `${localStorage.jiraUsername}:${localStorage.jiraPassword}`;
  xhr.setRequestHeader('Authorization', `Basic ${btoa(creds)}`);
  xhr.send();
};

const jiraPost = function jiraPost(path, body, success, failure) {
  const creds = getCredentials();
  const url = localStorage.jiraUrl + API_PREFIX + path;
  const xhr = new XMLHttpRequest();

  // TODO: these two functions can almost certainly be combined, lots of overlap
  if (!(creds)) {
    failure('JIRA credentials not configured');
    // TODO: pass either server down or invalid credentials type errors to callback
    return;
  }

  xhr.timeout = 1000 * 6;

  console.log(`Sending request to ${url}`);

  xhr.onreadystatechange = function handleReadyStateChange() {
    if (xhr.readyState !== XMLHttpRequest.DONE) {
      // Don't care about intermediate steps, just when the request is done
      return;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      success(xhr.responseText);
      // TODO: check response type, JSON parse result?
      // or maybe just always json parse it? does the JIRA api ever return anything else?
    } else {
      console.error(`HTTP ${xhr.status} returned from ${url}`);
      console.error(xhr.responseText);
      failure(`Failure connecting to ${url}`, xhr.status, xhr.responseText);
    }
  };

  xhr.onerror = failure;

  xhr.open('POST', url);
  xhr.setRequestHeader('Authorization', `Basic ${creds}`);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf8');

  xhr.send(JSON.stringify(body));
};

const fetchJiraWorklog = function fetchJiraWorklog() {
  const now = new Date();
  let incremental = false;

  if (lastWorklogUpdate !== null && lastWorklogUpdate.getDate() === now.getDate()) {
    // Do full updates on the first fetch of a new page load and when the day changes
    incremental = true;
  }

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);

  const since = (incremental ? lastWorklogUpdate : startOfDay).getTime();
  // const since = Math.floor((incremental ? lastWorklogUpdate : startOfDay).getTime() / 1000);

  /* Updated since is a little funny here in that
    I'm not actually searching on the date of the worklog,
    but the date that the worklog was modified.

    However, since I'm only using this to grab the current day's stuff,
    I don't have to worry about missing things that are back-dated,
    but I could miss out on "future-dated" things from the previous
    day. (oh well?)
  */

  // /rest/api/2/worklog/updated && /rest/api/2/worklog/list && /rest/api/2/worklog/deleted
  // (doesn't look like I can filter to just my own though, bleh JIRA)

  // If incremental is true, then I
  // (a) don't need to wipe out any existing elements
  // (b) need to run in parallel a "get deleted since" query

  jiraRequest(`/worklog/updated?since=${since}`, (body) => {
    const updatedWorklogs = JSON.parse(body);
    lastWorklogUpdate = now;
    // TODO: grab the value from the response instead?

    if (!incremental) {
      $('[data-worklog-id]').remove();
    }

    const worklogIds = [];
    for (const log of updatedWorklogs.values) {
      worklogIds.push(log.worklogId);
    }

    jiraPost('/worklog/list', { ids: worklogIds }, (postBody) => {
      console.log('post returned:');
      const worklogs = JSON.parse(postBody).filter((worklog) =>
        worklog.author.key !== localStorage.jiraUsername
      );

      for (const worklog of worklogs) {
        const worklogElement = ui.buildWorklog(worklog);
        const $existing = $(`[data-worklog-id=${worklog.id}]`);

        // TODO do this in UI module
        if ($existing.length) {
          $existing.replaceWith(worklogElement);
        } else {
          $('#timeline').append(worklogElement);
        }
      }
    }, (error) => {
      ui.bottomNavText('Failed to load JIRA worklog details');
      console.log(error);
    });
  }, (error) => {
    ui.bottomNavText('Failed to load JIRA worklog');
    console.log(error);
  });
};

const fetchJiraIssues = function fetchJiraIssues() {
  let jql = `(sprint in openSprints() 
    OR status changed AFTER startOfDay(-1w) OR worklogDate >= startOfDay(-1w))
    AND (assignee = currentUser() OR worklogAuthor = currentUser())`;
  const fields = 'timespent,timeestimate,assignee,summary,' +
    'issuetype,priority,status,customfield_10006';
  // operations,versionedRepresentations,editmeta,changelog,renderedFields

  const now = new Date();
  let incremental = false;

  if (lastIssuesUpdate !== null && lastIssuesUpdate.getDate() === now.getDate()) {
    // Do full updates on the first fetch of a new page load and when the day changes
    incremental = true;
    const hours = (`0${lastIssuesUpdate.getHours()}`).slice(-2);
    const minutes = (`0${lastIssuesUpdate.getMinutes()}`).slice(-2);
    const year = lastIssuesUpdate.getFullYear();
    const month = lastIssuesUpdate.getMonth() + 1;
    const date = lastIssuesUpdate.getDate();
    const lastDateFormatted = `${year}-${month}-${date} ${hours}:${minutes}`;

    jql += ` AND updated >= '${lastDateFormatted}'`;
  }

  // TODO: jiraRequest needs to take a 'GET' vs. 'POST' method argument
  jiraRequest(`/search?maxResults=500&fields=${fields}&jql=${jql}`, (body) => {
    const issues = JSON.parse(body);
    lastIssuesUpdate = now;
    console.log('got: ');
    console.log(issues);

    if (!incremental) {
      $('[data-issue-id]').remove();
    }

    for (const issue of issues.issues) {
      const issueElement = ui.buildCard(issue);
      const $existing = $(`[data-issue-id=${issue.id}]`);
      if ($existing.length) {
        $existing.replaceWith(issueElement);
      } else {
        $('#first-filler').before(issueElement);
      }

    // TODO: maybe I don't need to keep the "parsed" objects at all,
    // perhaps the elements themselves contain everything I need.
    // TODO: but I'll probably need some kind of worklog/activity object
    }
    fetchJiraWorklog();
  }, (msg) => {
    ui.bottomNavText('Failed to load JIRA issues');
    console.log(msg);
  });
};

const testCredentials = function testCredentials(callback) {
  const $settingsMessage = $('#settings-message');
  const $settingsControls = $('#saveCredentials, #clearCredentials');
  $settingsControls.prop('disabled', true);
  $settingsMessage.html('Testing JIRA Connection...');
  jiraRequest('/myself', () => {
    // Successful connection
    // TODO move ui stuff to the callback!
    $settingsControls.prop('disabled', false);
    ui.bottomNavText('JIRA connection successful');
    $settingsMessage.html('JIRA connection successful');

    // These next two should be part of a "initialize scheduler" call
    scheduler.initialize();

    // Call the callback
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, (msg) => {
    // Failed connection
    // TODO move ui stuff to the callback!
    $settingsControls.prop('disabled', false);
    ui.bottomNavText('JIRA connection failed');
    $settingsMessage.html('JIRA connection failed');
    // TODO: toggle warn/info/etc classes as well?
    // TODO: also set a warning icon overlay on the settings menu item in the menubar?
    console.log(msg);
    // TODO: Display a failure message somewhere on the settings page?
    // TODO: differentiate between "server down", "login rejected", and "other"
    ui.selectDiv(ui.tabs.SETTINGS);
  });
};

export default function jira() {
  return {
    testCredentials,
    fetchJiraIssues,
  };
}
