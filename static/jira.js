'use strict';

var issues = {};
var lastIssuesUpdate = null;
var lastWorklogUpdate = null;

function buildCard(data) {
  const $div = $(`<div class="tile" data-issue-id="${data.key}"></div>`);

  if (data.fields.assignee.name !== localStorage.jiraUsername) {
    $div.append($(`<i class="glyphicon glyphicon-user" title="Assigned to other"></i>`));
  }

  if (!data.fields.customfield_10006 || data.fields.customfield_10006.every(sprint => sprint.indexOf("state=ACTIVE") === -1)){
    $div.append($(`<i class="glyphicon glyphicon-log-out" title="Not on current sprint"></i>`));
  }

  $div.append($(`<img width="16 px" height="16 px" alt="${data.fields.issuetype.name}" src="${data.fields.issuetype.iconUrl}">`));

  //FIXME: bleh, these icons don't use transparencies and only look good against a white background
  $div.append($(`<img width="16 px" height="16 px" alt="${data.fields.priority.name}" src="${data.fields.priority.iconUrl}\">`));

  //https://sharpspring.atlassian.net/browse/SRSP-123 external URL? (open in new tab?)

  //TODO: bake in the SS bug severity stuff instead of the priority field?

  //data.fields.timespent;
  //data.fields.timeoriginalestimate;
  //data.fields.timeestimate;

  $div.append($(`<div>${data.fields.status.name}</div>`)); //TODO: "badge" styling?
  $div.append($(`<div>${data.key}</div>`));

  //TODO: a progress bar
  const percentDone = data.fields.timespent / (data.fields.timespent + data.fields.timeestimate) * 100;
  $div.append($(`<div>${Math.round(percentDone)}% done</div>`));

  //FIXME: field summary isn't HTML escaped
  $div.append($(`<div>${data.fields.summary.replace(/^(\[[^\]]*]| *)+/, '')}</div>`));
  return $div;
}

function buildWorklog(data) {
  const $li = $(`<li data-worklog-id="${data.key}"></li>`);
  return $li;
}

function fetchJiraIssues() {
  var jql = '(sprint in openSprints() OR status changed AFTER startOfDay(-1w) OR worklogDate >= startOfDay(-1w))'
      + ' AND (assignee = currentUser() OR worklogAuthor = currentUser())';

  var now = new Date();
  var incremental = false;

  if (lastIssuesUpdate !== null && lastIssuesUpdate.getDate() === now.getDate()) {
    //Do full updates on the first fetch of a new page load and when the day changes
    incremental = true;
    var hours = lastIssuesUpdate.getHours();
    if (hours < 10) {
      hours = '0' + hours;
    }
    var minutes = lastIssuesUpdate.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    const lastDateFormatted = lastIssuesUpdate.getFullYear() + '-' + (lastIssuesUpdate.getMonth() + 1) + '-'
        + lastIssuesUpdate.getDate() + ' ' + hours + ':' + minutes;
    jql = '(' + jql + ') AND updated >= \'' + lastDateFormatted + '\'';
  }

  //operations,versionedRepresentations,editmeta,changelog,renderedFields
  //TODO: jiraRequest needs to take a 'GET' vs. 'POST' method argument

  const fields = 'timespent,timeestimate,assignee,summary,issuetype,priority,status,customfield_10006';

  jiraRequest(`/search?maxResults=500&fields=${fields}&jql=${jql}`, function(body) {
    const issues = JSON.parse(body);
    lastIssuesUpdate = now;
    console.log('got: ');
    console.log(issues);

    if (!incremental) {
      $('[data-issue-id]').remove();
    }

    for (var issue of issues['issues']) {
      const issueElement = buildCard(issue);
      const $existing = $('[data-issue-id=' + issue['key'] + ']');
      if ($existing.length) {
        $existing.replaceWith(issueElement);
      } else {
        $('#first-filler').before(issueElement);
      }
      //TODO: maybe I don't need to keep the "parsed" objects at all, perhaps the elements themselves contain everything I need
      //TODO: but I'll probably need some kind of worklog/activity object
    }
  }, function (msg) {
    bottomNavText('Failed to load JIRA issues');
    console.log(msg);
  });
}

function fetchJiraWorklog() {
  var jql = '(sprint in openSprints() OR status changed AFTER startOfDay(-1w) OR worklogDate >= startOfDay(-1w))'
      + ' AND (assignee = currentUser() OR worklogAuthor = currentUser())';

  var now = new Date();
  var incremental = false;

  if (lastWorklogUpdate !== null && lastWorklogUpdate.getDate() === now.getDate()) {
    //Do full updates on the first fetch of a new page load and when the day changes
    incremental = true;
  }

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);

  const since = (incremental ? lastWorklogUpdate : startOfDay).getTime();
  //const since = Math.floor((incremental ? lastWorklogUpdate : startOfDay).getTime() / 1000);

  //Updated since is a little funny here in that I'm not actually searching on the date of the worklog, but the
  //date that the worklog was modified. However, since I'm only using this to grab the current day's stuff, I don't have
  //to worry about missing things that are back-dated, but I could miss out on "future-dated" things from the previous
  //day. (oh well?)

  // /rest/api/2/worklog/updated && /rest/api/2/worklog/list && /rest/api/2/worklog/deleted
  // (doesn't look like I can filter to just my own though, bleh JIRA)

  //If incremental is true, then I (a) don't need to wipe out any existing elements and (b) need to run in parallel a "get deleted since" query

  jiraRequest(`/worklog/updated?since=${since}`, function(body) {
    const logs = JSON.parse(body);
    lastWorklogUpdate = now;
    console.log('got: ');
    console.log(logs);

    if (!incremental) {
      $('[data-worklog-id]').remove();
    }

    const worklogIds = [];
    for (var log of logs.values) {
      worklogIds.push(log.worklogId);
    }

    jiraPost(`/worklog/list`, {ids: worklogIds}, function(postBody) {
      console.log('post returned:');
      console.log(postBody);
      //for (var log of postBody['issues']) {
      //  const issueElement = buildWorklog(log);
      //  const $existing = $('[data-worklog-id=' + log['key'] + ']');
      //  if ($existing.length) {
      //    $existing.replaceWith(issueElement);
      //  } else {
      //    //$('#first-filler').before(issueElement);
      //  }
        //TODO: maybe I don't need to keep the "parsed" objects at all, perhaps the elements themselves contain everything I need
        //TODO: but I'll probably need some kind of worklog/activity object
      //}
    }, function(postFailure) {

    });
  }, function (msg) {
    bottomNavText('Failed to load JIRA worklog');
    console.log(msg);
  });
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

  xhr.timeout = 1000 * 6;

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

  xhr.onerror = failure;

  xhr.open('GET', url);
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(localStorage.jiraUsername + ':' + localStorage.jiraPassword));
  xhr.send();
}

function jiraPost(path, body, success, failure) {
  //TODO: these two functions can almost certainly be combined, lots of overlap
  if (!('jiraUsername' in localStorage && 'jiraPassword' in localStorage && 'jiraUrl' in localStorage)) {
    failure('JIRA credentials not configured'); //TODO: pass either server down or invalid credentials type errors to callback
    return;
  }

  let url = localStorage['jiraUrl'] + API_PREFIX + path;
  let xhr = new XMLHttpRequest();

  xhr.timeout = 1000 * 6;

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

  xhr.onerror = failure;

  xhr.open('POST', url);
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(localStorage.jiraUsername + ':' + localStorage.jiraPassword));
  xhr.setRequestHeader('Content-Type', 'application/json; charset=utf8');
  //xhr.setRequestHeader('Origin', 'https://sharpspring.atlassian.net/');
  xhr.setRequestHeader('X-Atlassian-Token', 'nocheck');

  console.log('body is ' + JSON.stringify(body));

  xhr.send(JSON.stringify(body));
}

function testCredentials() {
  const $settingsMessage = $('#settings-message');
  const $settingsControls = $('#saveCredentials, #clearCredentials');
  $settingsControls.prop('disabled', true);
  $settingsMessage.html('Testing JIRA Connection...');
  jiraRequest('/myself', function() {
    //Successful connection
    $settingsControls.prop('disabled', false);
    bottomNavText('JIRA connection successful');
    $settingsMessage.html('JIRA connection successful');

    //These next two should be part of a "initialize scheduler" call
    attachFocusListeners();
    scheduleNextFetch();
  }, function(msg) {
    //Failed connection
    $settingsControls.prop('disabled', false);
    bottomNavText('JIRA connection failed');
    $settingsMessage.html('JIRA connection failed'); //TODO: toggle warn/info/etc classes as well?
    //TODO: also set a warning icon overlay on the settings menu item in the menubar?
    console.log(msg);
    //TODO: Display a failure message somewhere on the settings page?
    //TODO: differentiate between "server down", "login rejected", and "other"
    selectDiv(SETTINGS_TAB);
  });
}
