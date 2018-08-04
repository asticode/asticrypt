`asticrypt` lets you encrypt you conversations as well as stop being tracked when using you favorite apps.

# Available apps

- [Slack](slack)

# How it works

The way `asticrypt` works is pretty simple:

- it creates an [Electron](https://github.com/electron/electron) wrapper loading the app's sign in page
- the wrapper intercepts every http/https/ws/wss requests and only a handful of requests are allowed to pass through
- when the content of a request should be encrypted, the wrapper modifies the request and sends it modified
- when the content of a response should be unencrypted, the wrapper modifies the response and returns it modified

That way the content is never available in clear outside of the user's computer.

The key used to encrypt content is provided by the user and is stored in the wrapper's local storage.

# Roadmap

- [ ] Gmail