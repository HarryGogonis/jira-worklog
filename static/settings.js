'use strict';

//Hook up event handlers
$('#config-form').on('submit', function(evt) {
  evt.preventDefault();
  localStorage.jiraUsername = $('#jiraUsername').val();
  localStorage.jiraPassword = $('#jiraPassword').val();
  localStorage.jiraUrl = $('#jiraUrl').val();
  testCredentials();
});

$('#clearCredentials').on('click', function() {
  $('#jiraUsername').val(localStorage.jiraUsername);
  $('#jiraPassword').val(localStorage.jiraPassword);
  $('#jiraUrl').val(localStorage.jiraUrl);
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

//Initial program logic
//TODO: maybe move this into main or scheduler
testCredentials();
