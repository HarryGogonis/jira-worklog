'use strict';

//Hook up event handlers
$('#saveCredentials').on('click', function() {
  localStorage['jiraUsername'] = document.getElementById('jiraUsername').value;
  localStorage['jiraPassword'] = document.getElementById('jiraPassword').value;
  localStorage['jiraUrl'] = document.getElementById('jiraUrl').value;
  testCredentials();
});

$('#clearCredentials').on('click', function() {
  $('#jiraUsername').val(localStorage['jiraUsername']);
  $('#jiraPassword').val(localStorage['jiraPassword']);
  $('#jiraUrl').val(localStorage['jiraUrl']);
});

//Load the initial values in from local storage
if (localStorage.jiraUsername) {
  $('#jiraUsername').val(localStorage.jiraUsername);
}
if (localStorage.jiraPassword) {
  $('#jiraPassword').val(localStorage.jiraPassword);
}
if (localStorage.jiraUrl) {
  $('#jiraUrl').val(localStorage.jiraUrl);
}

//TODO: listen for enter keypresses, submit the form IF this is the active tab

//Initial program logic
//TODO: maybe move this into main or scheduler
testCredentials();
