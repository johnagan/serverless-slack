'use strict';

const AWS = require("aws-sdk"),
      dynamo = new AWS.DynamoDB.DocumentClient();


/**
 * Dynamo Save
 *
 * @param {Object} data - The data to save
 * @return {Promise} A Promise with the save results
 */
exports.save = function(data) {
  data.id = data.team_id;
  return this.query('put', { Item: data });
}


/**
 * Dynamo Get
 *
 * @param {String} id - The record's key
 * @return {Promise} A Promise with the get result
 */
exports.get = function(id) {
  return this.query('get', { Key: { id: id } }).then(d => {
    return Promise.resolve(d.Item);
  });
}


/**
 * Dynamo Query
 *
 * @param {String} name - The query action to run
 * @param {Object} params - The query parameters
 * @return {Promise} A Promise with the get result
 */
exports.query = function(method, params) {
  params.TableName = process.env.TABLE_NAME;

  return new Promise((resolve, reject) => {
    dynamo[method](params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}