# JIRA AUTH PROXY #

Because of [The Internet](https://en.wikipedia.org/wiki/Phishing), we can't have nice things.
JIRA Server customers have the option to whitelist domains for which to supply CORS headers allowing the use of the API from Javascript on other pages.
However, JIRA Cloud customers have no such option available to them.
This is a configuration for the cors-anywhere npm package to proxy traffic for the SharpSpring JIRA instance and provide the necessary HTTP CORS headers.

