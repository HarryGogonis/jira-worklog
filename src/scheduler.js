// FIVE_MINS = 5 * 60 * 1000;
// ONE_MIN = 60 * 1000;
// TWENTY_SECONDS = 20 * 1000;

const MIN_INTERVAL = 5 * 60 * 1000;

let lastFetch = 0;
let lastFocus = Date.now();
let focused = false;
let dataTimeoutId = null;

const attachFocusListeners = function attachFocusListeners() {
  window.addEventListener('focus', () => {
    focused = true;
    this.scheduleNextFetch();
  });

  window.addEventListener('blur', () => {
    focused = false;
    lastFocus = Date.now();
  });
};

const scheduleNextFetch = function scheduleNextFetch() {
  if (dataTimeoutId) { clearTimeout(dataTimeoutId); }

  const now = Date.now();
  const timeSinceFetch = now - lastFetch;
  const minInterval = Math.max(0, MIN_INTERVAL - timeSinceFetch);

  // Base our desired time to next fetch on the time since the window last had focus.
  // This will keep checks at min_interval while active,
  // and follow an exponential back-off in the background.
  const timeSinceFocus = focused ? 0 : now - lastFocus;
  const desiredInterval = Math.floor(timeSinceFocus / 2);

  dataTimeoutId = setTimeout(this.fetchData, Math.max(desiredInterval, minInterval));
};

const fetchData = function fetchData() {
  if (dataTimeoutId) { clearTimeout(dataTimeoutId); }

  lastFetch = Date.now();
  const now = new Date();
  console.log(`Fetching data @ ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);

  this.fetchJiraIssues();
  this.scheduleNextFetch();
};

const init = function init() {
  attachFocusListeners();
  scheduleNextFetch();
};

export default function scheduler() {
  return {
    init,
    fetchData,
  };
}
