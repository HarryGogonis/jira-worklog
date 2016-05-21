'use strict';

//Hook up event handlers
$('#saveCredentials').on('click', function() {
    localStorage['jiraUrl'] = document.getElementById('jiraUrl').value;
    localStorage['jiraUsername'] = document.getElementById('jiraUsername').value;
    localStorage['jiraPassword'] = document.getElementById('jiraPassword').value;
    testCredentials();
});

$('#clearCredentials').on('click', function() {
  $('#jiraUrl').val(localStorage['jiraUrl']);
  $('#jiraUsername').val(localStorage['jiraUsername']);
  $('#jiraPassword').val(localStorage['jiraPassword']);
  $('#clearCredentials').prop('disabled', true);
  $('#saveCredentials').prop('disabled', true);
  checkJiraInputs();
});

//TODO: maybe move these statements out into main.js and apply them to
//      any/all inputs, not just specificallythe ones on the config page?
$('.jira-input').on('focus', function() { keyboardShortcuts(false); });
$('.jira-input').on('blur', function() { keyboardShortcuts(true); });
if ('jiraUrl' in localStorage) {
    document.getElementById('jiraUrl').value = localStorage['jiraUrl'];
}
if ('jiraUsername' in localStorage) {
    document.getElementById('jiraUsername').value = localStorage['jiraUsername'];
}
if ('jiraPassword' in localStorage) {
    document.getElementById('jiraPassword').value = localStorage['jiraPassword'];
}

function checkJiraInputs() {
  var anyEmpty = false;
  $('.jira-input').each(function(idx, element) {
    if (!element.value) {
      anyEmpty = true;
      $(element).closest('.form-group').addClass('has-warning');
    } else {
      $(element).closest('.form-group').removeClass('has-warning');
    }
  });

  $('#saveCredentials').prop('disabled', anyEmpty);
}

checkJiraInputs();

$('.jira-input').on('keyup', function() {
  //TODO: arrow keys and the like shouldn't trigger this, only things that
  //      actually change the values
  console.log('yup');
  checkJiraInputs();
  $('#clearCredentials').prop('disabled', false);
});
//listen for enter keypresses, submit the form IF this is the active tab

//Initial program logic
//TODO: maybe move this into main or scheduler
testCredentials();
