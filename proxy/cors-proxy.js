const host = '0.0.0.0';
const port = 8080;

require('cors-anywhere').createServer({
  setHeaders: {
    'origin': 'https://sharpspring.atlassian.net/'
  }
}).listen(port, host, function() {
  console.log('Running cors-anywhere on ' + host + ':' + port);
});


