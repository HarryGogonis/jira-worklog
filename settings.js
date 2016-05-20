'use strict';

//Hook up event handlers
document.getElementById('saveCredentials').onclick = function() {
    localStorage['jiraUrl'] = document.getElementById('jiraUrl').value;
    localStorage['jiraUsername'] = document.getElementById('jiraUsername').value;
    localStorage['jiraPassword'] = document.getElementById('jiraPassword').value;
    testCredentials();
};

document.getElementById('jiraUrl').onfocus = function() { keyboardShortcuts(false); };
document.getElementById('jiraUsername').onfocus = function() { keyboardShortcuts(false); };
document.getElementById('jiraPassword').onfocus = function() { keyboardShortcuts(false); };
document.getElementById('jiraUrl').onblur = function() { keyboardShortcuts(true); };
document.getElementById('jiraUsername').onblur = function() { keyboardShortcuts(true); };
document.getElementById('jiraPassword').onblur = function() { keyboardShortcuts(true); };

if ('jiraUrl' in localStorage) {
    document.getElementById('jiraUrl').value = localStorage['jiraUrl'];
}
if ('jiraUsername' in localStorage) {
    document.getElementById('jiraUsername').value = localStorage['jiraUsername'];
}
if ('jiraPassword' in localStorage) {
    document.getElementById('jiraPassword').value = localStorage['jiraPassword'];
}

//Initial program logic
//TODO: maybe move this into main or scheduler
testCredentials();
