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
  checkJiraInputs();
});

//TODO: maybe move these statements out into main.js and apply them to
//      any/all inputs, not just specificallythe ones on the config page?
$('.jira-input').on('focus', function() { keyboardShortcuts(false); });
$('.jira-input').on('blur', function() { keyboardShortcuts(true); });

var lastJira = {
  'jiraUrl': localStorage['jiraUrl'] || '',
  'jiraUsername': localStorage['jiraUsername'] || '',
  'jiraPassword': localStorage['jiraPassword'] || ''
};
$('#jiraUsername').val(lastJira['jiraUsername']);
$('#jiraPassword').val(lastJira['jiraPassword']);
$('#jiraUrl').val(lastJira['jiraUrl']);

function checkJiraInputs() {
  var anyEmpty = false;
  var anyDifferent = false;
  $('.jira-input').each(function(idx, element) {
    if (!element.value) {
      anyEmpty = true;
      $(element).closest('.form-group').addClass('has-warning');
    } else {
      $(element).closest('.form-group').removeClass('has-warning');
    }
    if (element.value !== lastJira[element.id]) {
      anyDifferent = true;
    }
  });
  $('#saveCredentials').prop('disabled', anyEmpty || !anyDifferent);
  $('#clearCredentials').prop('disabled', !anyDifferent);
}

checkJiraInputs();

//TODO: arrow keys and the like shouldn't trigger this, only things that
//      actually change the values
$('.jira-input').on('keyup', checkJiraInputs);

//TODO: listen for enter keypresses, submit the form IF this is the active tab

//Initial program logic
//TODO: maybe move this into main or scheduler
testCredentials();
