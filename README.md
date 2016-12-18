# Serverless Slack
This is a micro-framework designed to create [Slack Apps](https://slack.com) with [serverless.js](https://github.com/serverless/serverless).

## Demonstration
A complete template and tutorial can be found at [johnagan/serverless-slack-app](https://github.com/johnagan/serverless-slack-app).

## API

### Events
```js
// handle RTM messages
slack.on('message', (payload, bot) => { });

// handle all slash commands
slack.on('slash_command', (payload, bot) => { });

// handle the outgoing webhooks trigger word "googlebot"
slack.on('googlebot', (payload, bot) => { });

// handle multiple events
slack.on('googlebot', '/test', 'slash_command', (payload, bot) => { });

// wildcard support
slack.on('*', (payload, bot) => { });
```
Event | Description
:---|:---
* | All events
**message** | All RTM events
**slash_command** | All Slash Commands
**event** | All Event API callbacks
**webhook** | All WebHook callbacks
**interactive_message** | All Interactive message callbacks
**[/command]** | Any specific slash command
**[event type]** | Any [specific event](https://api.slack.com/events) type
**[trigger word]** | Any trigger from outgoing webhooks

### Bot
Bots are preloaded with the appropriate token and are context aware. So you can reply to messages and send ephemeral updates to a message.
```js
slack.on('message', (payload, bot) => {
  bot.replyPrivate('loading...');

  bot.reply({
    text: 'Everything is working!',
    attachments: [{
      title: "Slack API Documentation",
      title_link: "https://api.slack.com/",
      text: "Optional text that appears within the attachment",
      fields: [{
        title: "Priority",
        value: "High",
        short: false
      }]
    }]
  });

  // the token is already set
  bot.send('channels.info', { channel: 'C1234567890' }).then(data => {
    // results from API call
  });
});
```
Methods | Description
:---|:---
[say](src/bot.js#L50) | Send a message
[reply](src/bot.js#L22) | Send a public reply to the event
[replyPrivate](src/bot.js#L41) | Send an ephemeral reply to the event
[send](src/bot.js#L61) | Call any Slack API endpoint

### Data Store
A key/value store to maintain team/bot information and store custom setings. The store should contain a uniquie `id` field.
```js
slack.store.save(data).then(results => {
  // the save results
});

slack.store.get(id).then(record => {
  // return a single record by key
});
```
Methods | Description
:---|:---
[get](src/filestore.js#L39) | Get a single record by id
[all](src/filestore.js#L61) | Get all saved records
[save](src/filestore.js#L50) | Save a record


### Client
The Slack client is a way to call the API outside of an event.
```js
let message = {
  unfurl_links: true,
  channel: 'C1QD223DS1',
  token: 'xoxb-12345678900-ABCD1234567890',
  text: "I am a test message http://slack.com",
  attachments: [{
    text: "And here's an attachment!"
  }]
}

// send message to any Slack endpoint
slack.send('chat.postMessage', message).then(data => {
  // Success!
});

// respond to webhooks
slack.send('https://hooks.slack.com/services/T0000/B000/XXXX', message);
```
