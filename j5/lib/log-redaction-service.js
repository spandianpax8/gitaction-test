
const _ = require('lodash');
const mapObject = require('map-obj');
const REDACTED = '*****';

const sensitiveKeys = ['token', 'usertoken', 'authtoken', 'companytoken', 'partnertoken', 'pax8token'];
const keyRegex = new RegExp(sensitiveKeys.join('|'));

function redactKey(key, val) {
  //check keys
  if (sensitiveKeys.indexOf(key.toLowerCase()) !== -1) {
    return [key, REDACTED];
  }

  //check values
  if (_.isString(val)) {
    return [key, redactString(val)];
  }

  return [key, val];
}

function redactString(stringVal) {
  return keyRegex.test(stringVal.toLowerCase()) ? REDACTED : stringVal;
}

function redactSensitiveKeys(logParams) {
  if (!_.isPlainObject(logParams)) {
    return {};
  }
  return mapObject(logParams, redactKey, {deep:true});
}


module.exports = {
  redactSensitiveKeys
};