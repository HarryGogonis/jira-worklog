'use strict';

var issues = {};
var lastJiraUpdate = null;

function buildCard(data) {
  const $a = $(`<a class="tile" data-issue-id="${data.key}"></a>`);

  if (data.fields.assignee.name !== localStorage.jiraUsername) {
    $a.append($(`<i class="glyphicon glyphicon-user" title="Assigned to other"></i>`));
  }

  if (data.fields.customfield_10006.every(sprint => sprint.indexOf("state=ACTIVE") === -1)){
    $a.append($(`<i class="glyphicon glyphicon-log-out" title="Not on current sprint"></i>`));
  }

  $a.append($(`<img width="16 px" height="16 px" alt="${data.fields.issuetype.name}" src="${data.fields.issuetype.iconUrl}">`));

  //FIXME: bleh, these icons don't use transparencies and only look good against a white background
  $a.append($(`<img width="16 px" height="16 px" alt="${data.fields.priority.name}" src="${data.fields.priority.iconUrl}\">`));

  //https://sharpspring.atlassian.net/browse/SRSP-123 external URL? (open in new tab?)

  //TODO: bake in the SS bug severity stuff instead of the priority field?

  //data.fields.timespent;
  //data.fields.timeoriginalestimate;
  //data.fields.timeestimate;

  $a.append($(`<div>${data.fields.status.name}</div>`)); //TODO: "badge" styling?
  $a.append($(`<div>${data.key}</div>`));

  //TODO: a progress bar
  const percentDone = data.fields.timespent / (data.fields.timespent + data.fields.timeestimate) * 100;
  $a.append($(`<div>${Math.round(percentDone)}% done</div>`));

  //FIXME: field summary isn't HTML escaped
  $a.append($(`<div>${data.fields.summary.replace(/^(\[[^\]]*]| *)+/, '')}</div>`));
  return $a;
}

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
    description: data['fields']['description'],
    summary: data['fields']['summary'],
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

function fetchJiraIssues() {
  //TODO: also grab current day worklog entries in parallel with this and populate the other tab as well

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

  //operations,versionedRepresentations,editmeta,changelog,renderedFields
  //TODO: jiraRequest needs to take a 'GET' vs. 'POST' method argument

  const fields = 'timespent,timeestimate,assignee,summary,issuetype,priority,status,customfield_10006';

  // /rest/api/2/worklog/updated && /rest/api/2/worklog/list && /rest/api/2/worklog/deleted
  // (doesn't look like I can filter to just my own though, bleh JIRA)

  jiraRequest(`/search?maxResults=500&fields=${fields}&jql=${jql}`, function(body) {
    const issues = JSON.parse(body);
    lastJiraUpdate = now;
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
  xhr.setRequestHeader("Authorization", "Basic " + btoa(localStorage['jiraUsername'] + ":" + localStorage['jiraPassword']));
  xhr.send();
}

function testCredentials() {
  jiraRequest('/myself', function() {
    //Successful connection
    bottomNavText('JIRA connection successful');
    selectDiv(ISSUES_TAB);
    //TODO: set the "lastJira" values here
    //TODO: also grab the current sprint? (or maybe grab that *instead* as my test?)
    checkJiraInputs();
    attachFocusListeners();
    scheduleNextFetch();
  }, function(msg) {
    //Failed connection
    bottomNavText('JIRA connection failed');
    console.log(msg);
    //TODO: Display a failure message somewhere on the settings page?
    //TODO: differentiate between "server down", "login rejected", and "other"
    //TODO: do I need to "checkJiraInputs" here?
    selectDiv(SETTINGS_TAB);
  });
}
