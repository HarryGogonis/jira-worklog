'use strict';

//keep stuff in localstorage? (or maybe don't? just have the page elements and in-memory stuff instead?)

var issues = {};
var lastJiraUpdate = null;

//https://developer.mozilla.org/en-US/docs/Web/API/notification

const jiraIssues = {};

//TODO: make this a class with a constructor?
function parseIssue(data) {
  var issue = {
    key: data['key'],
    assignee: {
      display: data['fields']['assignee']['displayName'],
      name: data['fields']['assignee']['name'],
      key: data['fields']['assignee']['key'],
      avatar: data['fields']['assignee']['avatarUrls']['48x48']
      //TODO: 'name' vs 'key', which is the username?
    },
    //creator: data['fields']['creator']['displayName'],
    //TODO: avatar URLs?
    reporter: {
      display: data['fields']['reporter']['displayName'],
      name: data['fields']['reporter']['name'],
      key: data['fields']['reporter']['key'],
      avatar: data['fields']['reporter']['avatarUrls']['48x48']
    },
    description: data['fields']['description'],
    summary: data['fields']['summary'],
    aggregateTime: {
      estimate: data['fields']['aggregatetimeestimate'],
      originalEstimate: data['fields']['aggregatetimeoriginalestimate'],
      spent: data['fields']['aggregatetimespent']
    },
    time: {
      estimate: data['fields']['timeestimate'],
      originalEstimate: data['fields']['timeoriginalestimate'],
      spent: data['fields']['timespent']
    },
    type: {
      name: data['fields']['issuetype']['name'],
      icon: data['fields']['issuetype']['iconUrl']
    },
    priority: {
      name: data['fields']['priority']['name'],
      icon: data['fields']['priority']['iconUrl']
    },
    status: {
      name: data['fields']['status']['name'],
      icon: data['fields']['status']['iconUrl']
      //Grab the descriptions for type/status/priority for tooltips?
    }
  };

  //TODO: is it worth making this intermediate representation, or should I just generate the UI elements from the response JSON directly?

  return issue;
}

function fetchJira() {
  var jql = '(sprint in openSprints() OR status changed AFTER startOfDay(-1w) OR worklogDate >= startOfDay(-1w))'
      + ' AND (assignee = currentUser() OR worklogAuthor = currentUser())';

  var now = new Date();
  var incremental = false;

  if (lastJiraUpdate !== null && lastJiraUpdate.getDate() === now.getDate()) {
    //Do full updates on the first fetch of a new page load and when the day changes
    incremental = true;
    var hours = lastJiraUpdate.getHours();
    if (hours < 10) {
      hours = '0' + hours;
    }
    var minutes = lastJiraUpdate.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    const lastDateFormatted = lastJiraUpdate.getFullYear() + '-' + (lastJiraUpdate.getMonth() + 1) + '-'
        + lastJiraUpdate.getDate() + ' ' + hours + ':' + minutes;
    jql = '(' + jql + ') AND updated >= \'' + lastDateFormatted + '\'';
  }

  var xhr = new XMLHttpRequest();

  //TODO: needs an expand=, maybe also fields=
  xhr.open('GET', '/jira/search?maxResults=500&jql=' + jql, true);

  xhr.onload = function(evt) {
    const issues = JSON.parse(xhr.response);
    lastJiraUpdate = now;
    console.log('got: ');
    console.log(issues);

    if (!incremental) {
      for (var id in jiraIssues) {
        if (Object.prototype.hasOwnProperty.call(jiraIssues, id)) {
          delete jiraIssues[id];
        }
      }
    }

    for (var issue of issues['issues']) {
      const parsed = parseIssue(issue);
      if (parsed.key in jiraIssues) {
        //Clear out the old one if necessary
      }
      jiraIssues[parsed.key] = parsed;
      console.log('----------------');
      console.log(issue);
      console.log(parsed);
    }
    //TODO: fetch full worklogs? Maybe just as many as I can in-line on the normal requests? (how about comments?)
  };

  function render(issue) {
    var div = document.createElement('div');

  //<div class="js-detailview ghx-issue js-issue ghx-has-avatar js-parent-drag ghx-days-0 ghx-type-10400" data-issue-id="21770" data-issue-key="SRSP-6068">
  //      <div class="ghx-issue-content">
  //      <div class="ghx-issue-fields">
  //      <span class="ghx-type" title="Fastlane">
  //      <img src="https://sharpspring.atlassian.net/secure/viewavatar?size=xsmall&amp;avatarId=10300&amp;avatarType=issuetype">
  //      </span>
  //      <div class="ghx-key">
  //      <a href="/browse/SRSP-6068" title="SRSP-6068" class="js-key-link">SR…-6068</a>
  //  </div>
  //  <div class="ghx-summary" title="500 error for path sharpspring.marketingautomation.services/api/getZoomCompanyContacts">
  //      <span class="ghx-inner">500 error for path sharpspring.marketingautomation.services/api/getZoomCompanyContacts</span>
  //  </div>
  //  </div>
  //  <div class="ghx-extra-fields">
  //      <div class="ghx-extra-field-row"><span original-title="" class="ghx-extra-field " data-tooltip="Original Estimate: 1h">
  //      <span class="ghx-extra-field-content">1h</span>
  //  </span></div>
  //  <div class="ghx-extra-field-row"><span original-title="" class="ghx-extra-field " data-tooltip="Priority: Critical">
  //      <span class="ghx-extra-field-content">Critical</span></span>
  //      </div>
  //      <div class="ghx-extra-field-row"><span original-title="" class="ghx-extra-field " data-tooltip="Category: Bug">
  //      <span class="ghx-extra-field-content">Bug</span></span>
  //      </div>
  //      </div>
  //      </div>
  //      <div class="ghx-avatar"><img original-title="" src="https://sharpspring.atlassian.net/secure/useravatar?ownerId=mark.caudill&amp;avatarId=11008" class="ghx-avatar-img" alt="Assignee: Mark Caudill" data-tooltip="Assignee: Mark Caudill"></div>
  //      <div class="ghx-end"><div class="ghx-corner"><span class="aui-badge" title="Remaining Time Estimate">0.5h</span></div>
  //  </div>
  //  <div class="ghx-flags"><span class="ghx-priority" title="Critical"><img src="https://sharpspring.atlassian.net/images/icons/priorities/critical.svg"></span></div>
  //      <div class="ghx-grabber" style="background-color:#0000ff;"></div>
  //
  //      </div>

  }

  //TODO: those "stale" categories from Brian's notification emails? (sitting in QA forever?)
  //TODO: make them "selectable" by current search
  //TODO: ability to throw one (or multiple?) cards over to the work log tab for "working on this now"

  xhr.onerror = function(evt) {
    console.error('Error fetching from jira'); //TODO: more descriptive errors
  };

  //TODO: another query for surface-level info only on many more issues? So that I can auto-complete searches
  //      and have placeholder cards (status/key/assignee only)?? Not sure if its worthwhile
  //      Maybe just have a way to fetch on-demand other card details (or maybe just pop open the external tab for them)
  //      Might still be nice to have the auto-complete dictionary available? (Not that I've currently got a good UI for displaying it)

  xhr.send();
}

const API_PREFIX = '/rest/api/2';

//Define functions
function jiraRequest(path, success, failure) {
  if (!('jiraUsername' in localStorage && 'jiraPassword' in localStorage && 'jiraUrl' in localStorage)) {
    failure('JIRA credentials not configured'); //TODO: pass either server down or invalid credentials type errors to callback
    return;
  }

  let url = localStorage['jiraUrl'] + API_PREFIX + path;
  let xhr = new XMLHttpRequest();

  console.log('Sending request to ' + url);

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== XMLHttpRequest.DONE) {
      return; //Don't care about intermediate steps, just when the request is done
    }
    if (xhr.status >= 200 && xhr.status < 300) {
      success(xhr.responseText);
      //TODO: check response type, JSON parse result?
      //or maybe just always json parse it? does the JIRA api ever return anything else?
    } else {
      console.error('HTTP ' + xhr.status + ' returned from ' + url);
      console.error(xhr.responseText);
      failure('Failure connecting to ' + url, xhr.status, xhr.responseText);
    }
  };
  xhr.open('GET', url);
  xhr.setRequestHeader("Authorization", "Basic " + btoa(localStorage['jiraUsername'] + ":" + localStorage['jiraPassword']));
  xhr.send();
}

function testCredentials() {
  jiraRequest('/myself', function() {
    //Successful connection
    showTab('main');
  }, function(msg) {
    //Failed connection
    //TODO: Display a failure message somewhere on the settings page?
    //TODO: differentiate between "server down", "login rejected", and "other"
    selectDiv(SETTINGS_TAB);
  });
}

//trigger re-draws as necessary
