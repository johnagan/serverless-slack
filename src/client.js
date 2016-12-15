'use strict';

const axios = require('axios'),
      qs = require('querystring');


class Client {

  /**
   * Constructor
   *
   * @param {object} auth - The team's oauth info
   * @param {object} payload - The message payload to use for context
   */
  constructor(auth, payload) {
    this.payload = payload;
    this.auth = auth;

    this.api = axios.create({
      baseURL: 'https://slack.com/api'
    });
  }


  /**
   * Response Url
   * 
   * @return {String} the payload's response url
   */
  get response_url() {
    if (this.payload) return this.payload.response_url;
  }


  /**
   * Channel
   *
   * @return {String} the payload's channel
   */
  get channel() {
    let payload = this.payload, event = payload.event;
    if (payload) {
      if (payload.channel_id) return payload.channel_id;
      else if (payload.channel) return payload.channel.id;
      else if (event && event.channel) return event.channel;
      else if (event && event.item) return event.item.channel;
    }
  }


  /**
   * API Token
   * 
   * @return {String} the team's API token
   */
  get token() {
    let auth = this.auth, bot = auth.bot;
    if (auth) return auth.bot ? auth.bot.bot_access_token : auth.access_token;
  }


  /**
   * Send Reply
   *
   * @param {object} message - The message to reply with
   * @param {boolean} ephemeral - Flag to make the message ephemeral
   * @return {Promise} A promise with the API response
   */
  reply(message, ephemeral) {
    if (!this.response_url && ephemeral) {
      return Promise.reject("Message can't be ephemeral");
    } else if (this.response_url) {
      if (!ephemeral) message.response_type = 'in_channel';
      return this.send(this.response_url, message);
    } else {
      return this.say(message);
    }
  }


  /**
   * Send Message
   *
   * @param {object} message - The message to post
   * @return {Promise} A promise with the API result
   */
  say(message) {
    return this.send('chat.postMessage', message);
  }


  /**
   * Send data to Slack's API
   *
   * @param {string} endPoint - The method name or url (optional - defaults to chat.postMessage)
   * @param {object} data - The JSON payload to send
   * @return {Promise} A promise with the API response
   */
  send(endPoint, message) {
    // convert the string message to a message object
    if (typeof(message) === 'string') message = { text: message };

    // set defaults when available
    message = Object.assign({ token: this.token, channel: this.channel }, message);

    // convert json except when passing in a url
    if (!endPoint.match(/^http/i)) message = qs.stringify(message);
    return this.api.post(endPoint, message).then(this.getData);
  }


  /**
   * OK Check for Responses
   *
   * @param {object} response - The API response to check
   * @return {Promise} A promise with the API response
   */
  getData(response) {
    let data = response.data;

    if (data.ok) {
      delete data.ok;
      return Promise.resolve(data);
    } else {
      return Promise.reject(data);
    }
  }


  /**
   * OAuth Authorization Url
   * 
   * @param {object} args - Arguments for the url
   * @return {String} The payload's response url
   */
  getAuthUrl(args) {
    args = Object.assign({}, args, {
      scope: process.env.CLIENT_SCOPES,
      client_id: process.env.CLIENT_ID
    });

    // sends a 301 redirect
    return 'https://slack.com/oauth/authorize?' + qs.stringify(args);
  }


  /**
   * OAuth Access
   * 
   * @param {object} args - Arguments for oauth access
   * @return {Promise} A promise with the API response
   */
  getToken(args) {
    return this.send('oauth.access', { 
      code: args.code,
      state: args.state, 
      client_id: process.env.CLIENT_ID, 
      client_secret: process.env.CLIENT_SECRET 
    });
  }


  /**
   * OAuth Test
   * 
   * @param {object} auth - The team's access data
   * @return {Promise} A promise with the updated team access data
   */
  updateTeamUrl(auth) {
    return this.send('auth.test', { token: auth.access_token }).then(data => {
      auth.url = data.url;
      return Promise.resolve(auth);
    });
  }


  /**
   * OAuth Install
   * 
   * @param {object} payload - The install request
   * @return {Promise} A promise with the team access data
   */
  install(payload) {
    return this.getToken(payload).then(this.updateTeamUrl.bind(this));
  }
}


module.exports = Client;