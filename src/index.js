'use strict';

const Client = require('./client'),
      EventEmitter = require('events');


class Slack extends EventEmitter {
  
  constructor(options) {
    super();
    this.store = require('./dynamo'); // default
    this.ignoreBots = true; // ignore other bot message
  }


  /**
   * Default Lambda Handler
   *
   * @param {Object} event - The Lambda event
   * @param {Object} context - The Lambda context
   * @param {Function} callback - The Lambda callback
   */
  handler(event, context, callback) {     
    switch(event.method) {
      case "GET": this.oauth(event, context, callback); break;
      case "POST": this.event(event, context, callback); break;
    }
  }


  /**
   * OAuth Lambda Handler
   *
   * @param {Object} event - The Lambda event
   * @param {Object} context - The Lambda context
   * @param {Function} callback - The Lambda callback
   */
  oauth(event, context, callback) {
    let client = new Client();
    let payload = event.query;
    let save = this.store.save.bind(this.store);
    let redirectUrl = `${process.env.INSTALL_REDIRECT}?state=${payload.state}`;

    let fail = error => {
      this.emit('*', error, payload);
      this.emit('install_error', error, payload);
      callback(`${redirectUrl}&error=${JSON.stringify(error)}`);
    }

    let success = result => {
      this.emit('*', payload);
      this.emit('install_success', payload);
      callback(redirectUrl);
    }

    if (payload.code) {
      // install app
      client.install(payload).then(save).then(success).catch(fail);
    } else { 
      // sends a 301 redirect
      callback(client.getAuthUrl(payload));
    }
  }


  /**
   * Event Lambda Handler
   *
   * @param {Object} event - The Lambda event
   * @param {Object} context - The Lambda context
   * @param {Function} callback - The Lambda callback
   */
  event(event, context, callback) {
    let payload = event.body;
    let id = payload.team_id;
    let token = process.env.VERIFICATION_TOKEN;

    // Interactive Messages
    if (payload.payload) {
      payload = JSON.parse(payload.payload);
      id = payload.team.id;
    }

    // Verification Token
    if (token && token !== payload.token)
      return context.fail("[401] Unauthorized");

    // Events API challenge
    if (payload.challenge)
      return callback(null, payload.challenge);
    else
      callback();

    // Ignore Bot Messages
    if (!this.ignoreBots || !(payload.event || payload).bot_id) {
      // Load Auth And Trigger Events
      this.store.get(id).then(this.notify.bind(this, payload));
    }
  }


  /**
   * Notify message and process events
   * @param {Object} payload - The Lambda event
   * @param {Object} auth - The Slack authentication
   */
  notify(payload, auth) {
    let events = ['*'];
    let bot = new Client(auth, payload);

    // notify incoming message by type
    if (payload.type) events.push(payload.type);

    // notify event triggered by event type
    if (payload.event) events.push('event', payload.event.type);

    // notify slash command by command
    if (payload.command) events.push('slash_command', payload.command);

    // notify webhook triggered by trigger word
    if (payload.trigger_word) events.push('webhook', payload.trigger_word);

    // notify message button triggered by callback_id
    if (payload.callback_id) events.push('interactive_message', payload.callback_id);

    // trigger all events
    events.forEach(name => this.emit(name, payload, bot, this.store));
  }

}

module.exports = new Slack();