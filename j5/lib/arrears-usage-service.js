'use strict';

const _ = require('lodash');
const {request} = require('./request-service');

module.exports = {
  init,
  validate,
  populateContextData,
};

function init(rootContext, LOGGER) {
  const requester = request(rootContext, LOGGER);
  const ccBaseUrl = rootContext.ccBaseUrl;
  const authToken = rootContext.authToken;
  return {
    commitNightlyUsage: commit(rootContext.context, ccBaseUrl, authToken, requester, false),
    commitBilledUsage: commit(rootContext.context, ccBaseUrl, authToken, requester, true),
  }
}

const summaryRequiredFields = [
  'isTrial',
  'arrearsName',
  'arrearsId',
  'usageLines',
  'columnHeader'
];
const lineRequiredFields = [
  'isTrial',
  'unitOfMeasurement',
  'quantity',
  'productId',
];

function validate(usageSummaries) {
  const errors = [];
  if (!_.isArray(usageSummaries)) {
    return ["No UsageSummary Array Provided"]
  }

  for (const [i, usageSummary] of usageSummaries.entries()) {
    for (const field of summaryRequiredFields) {
      if (usageSummary[field] === null || usageSummary[field] === undefined) {
        errors.push(`UsageSummary [${i}] ${JSON.stringify(usageSummary)} is missing required field: ${field}`)
      }
    }
    if (!_.isArray(usageSummary.usageLines)) {
      errors.push(`UsageSummary [${i}] has malformed usageLines: ${JSON.stringify(usageSummary.usageLines)}`);
      continue;
    }
    for (const [j, usageLine] of usageSummary.usageLines.entries()) {
      for (const field of lineRequiredFields) {
        if (usageLine[field] === null || usageLine[field] === undefined) {
          errors.push(`UsageLine [${i}][${j}] ${JSON.stringify(usageLine)} is missing required field: ${field}`)
        }
      }
    }
  }
  return errors;
}

function getRequiredContext(context, path) {
  const data = _.get(context, path);
  if (!data) {
    throw new Error(`${path} missing from context`);
  }
  return data;
}

function populateContextData(usageSummaries, context, billedUsage) {
  const companyId = getRequiredContext(context, 'company.id');
  const subscriptionId = getRequiredContext(context, 'subscription.id');
  const partnerId = getRequiredContext(context, 'partner.id');
  const usageDate = getRequiredContext(context, 'arrearsTask.payload.usageDate.value');
  for (const usageSummary of usageSummaries) {

    usageSummary.subscriptionId = subscriptionId;
    usageSummary.companyId = companyId;
    usageSummary.partnerId = partnerId;
    usageSummary.active = true;
    usageSummary.synced = false;
    usageSummary.type = 'Rap';

    for (const usageLine of usageSummary.usageLines) {
      // take user specified usageDate, if available, otherwise task default.
      usageLine.usageDate = usageLine.usageDate || usageDate;
      usageLine.billedLine = !!billedUsage;
    }
  }
}

function commit(context, ccBaseUrl, authToken, requester, billedUsage) {
  return function (usageSummaries) {

    const errors = validate(usageSummaries);
    if (errors.length > 0) {
      return Promise.resolve({error: true, errors, errorType: 'validation'});
    }

    try {
      populateContextData(usageSummaries, context, billedUsage);
    } catch (error) {
      return Promise.resolve({error: true, errors: [error.message], errorType: 'contextValidation'});
    }

    return requester({
      method: 'POST',
      url: `${ccBaseUrl}/api/v3/usage-summaries${billedUsage ? '/billed' : ''}`,
      params: {token: authToken},
      data: usageSummaries
    });
  }
}
