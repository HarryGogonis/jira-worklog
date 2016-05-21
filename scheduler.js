'use strict';

const FIVE_MINS = 5 * 60 * 1000;
const ONE_MIN = 60 * 1000;
const TWENTY_SECONDS = 20 * 1000;

const MIN_INTERVAL = FIVE_MINS;

var lastFetch = 0;
var lastFocus = Date.now();
var focused = false;
var dataTimeoutId = null;

//TODO: some visual indication of whether or not the window has focus (tweak to the navbar style maybe?)
window.addEventListener('focus', function() {
  focused = true;
  scheduleNextFetch();
});

window.addEventListener('blur', function() {
  focused = false;
  lastFocus = Date.now();
});

function scheduleNextFetch() {
  if (dataTimeoutId) { clearTimeout(dataTimeoutId); }

  const now = Date.now();

  const timeSinceFetch = now - lastFetch;
  const minInterval = Math.max(0, MIN_INTERVAL - timeSinceFetch);

  //Base our desired time to next fetch on the time since the window last had focus
  //This will keep checks at min_interval while active, and follow an exponential back-off in the background
  const timeSinceFocus = focused ? 0 : now - lastFocus;
  const desiredInterval = Math.floor(timeSinceFocus / 2);

  dataTimeoutId = setTimeout(fetchData, Math.max(desiredInterval, minInterval));
}

function fetchData() {
  if (dataTimeoutId) { clearTimeout(dataTimeoutId); }

  lastFetch = Date.now();
  var now = new Date();
  console.log('Fetching data @ ' + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds());

  fetchJira();

  scheduleNextFetch();
}

