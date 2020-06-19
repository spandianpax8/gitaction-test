'use strict';

//External
const _ = require('lodash');
const P = require('bluebird');
const xml2js = require('xml2js');
const {VM, VMScript} = require('vm2');
const moment = require('moment-timezone');

//Internal
const {loadRapWithMeta, loadPluginActions} = require('./code-commit-service');
const { callbackConfigToRequestConfig } = require('./request-config-helper');
const whitelistService = require('./whitelist-service');

//Libraries available to Rap programs
const checkpointService = require('./checkpoint-service');
const arrearsUsageService = require('./arrears-usage-service');
const stashService = require('./stash-service');
const emailService = require('./email-service');
const pax8AttributeService = require('./pax8-attribute-service');
const {request} = require('./request-service');
const {platformRequest} = require('./platform-request-service');
const microsoftService = require('./microsoft-service');
const tools = require('./tools-service');

//Constants
const EXECUTION_TIMEOUT = 1000 * 60 * 5; // 5 minutes, lamda has a timeout of 15 minutes

module.exports = {
  parseScript,
  createSandbox,
  executeScriptInSandbox,
  addAttributesMapToContext,
};

function createSandbox(LOGGER, actions, whitelist, context = {}, inlineContexts = [], timeout = EXECUTION_TIMEOUT) {
  const vm = new VM({
    eval: false,
    timeout,
    sandbox: {},
  });

  context = _.reduce([microsoftService.omit], (theContext, fn) => fn(theContext), context);
  const contextWithAttrMap = addAttributesMapToContext(context);

  try {
    _.forEach(inlineContexts, (inlineContext) => {
      const currentContext = contextWithAttrMap[inlineContext.key];
      contextWithAttrMap[inlineContext.key] = { ...inlineContext.data, ...currentContext }
    });
  } catch (e) {
    LOGGER.error('Error parsing inline contexts', {inlineContexts, error: e});
    throw e;
  }

  const directContext = whitelistService.filterDirectContext(whitelist, contextWithAttrMap);
  const indirectContext = whitelistService.filterIndirectContext(whitelist, contextWithAttrMap);



  //Declare pax8 modules under the pax8 key.
  const attributeFunctions = pax8AttributeService(contextWithAttrMap, LOGGER);
  const emailFunctions = emailService(contextWithAttrMap, LOGGER);
  const checkpointFunctions = checkpointService(contextWithAttrMap, LOGGER);
  const arrearsUsageServiceFunctions = arrearsUsageService.init(contextWithAttrMap, LOGGER);
  const stashServiceFunctions = stashService.init(contextWithAttrMap, LOGGER);
  const microsoftFunctions = microsoftService.init(indirectContext, context, LOGGER);
  const pax8 = {
    env: {
      stage: process.env.STAGE || 'unknown'
    },
    microsoft: microsoftFunctions,
    request: request(indirectContext, LOGGER),
    platform: {
      request: platformRequest(indirectContext, context.userToken, context.ccBaseUrl, LOGGER)
    },
    die(message, e) {
      let errorMessage = message;
      if(e && e.message) {
        errorMessage = `${errorMessage}, ${e.message}`;
      }
      throw new Error(errorMessage);
    },
    checkpoint: {
      save: checkpointFunctions.save,
      get: checkpointFunctions.get,
      isNotComplete: checkpointFunctions.isNotComplete
    },
    email: {
      send: emailFunctions.send
    },
    usage: {
     commitNightlyUsage: arrearsUsageServiceFunctions.commitNightlyUsage,
     commitBilledUsage: arrearsUsageServiceFunctions.commitBilledUsage,
    },
    partner: {
      saveAttribute: attributeFunctions.savePartnerAttribute,
      deleteAttribute: attributeFunctions.deletePartnerAttribute
    },
    company: {
      saveAttribute: attributeFunctions.saveCompanyAttribute,
      deleteAttribute: attributeFunctions.deleteCompanyAttribute
    },
    instance: {
      saveAttribute: attributeFunctions.saveInstanceAttribute,
      deleteAttribute: attributeFunctions.deleteInstanceAttribute
    },
    stash: {
      get: stashServiceFunctions.get,
      save: stashServiceFunctions.save,
    },
    logger: {
      debug: LOGGER.debug,
      info: LOGGER.info,
      warn: LOGGER.warn,
      error: LOGGER.error
    },
    tools : {
      formatPhoneNumber: tools.formatPhoneNumber,
      stateConvert: tools.stateConvert,
    },
  };


  _.forEach(actions, (value, key) => vm.freeze(value.bind({properties: context}), key));

  //This is the context data that is directly available to be referred in the program.
  _.forEach(directContext, (value, key) => vm.freeze(value, key));

  vm.freeze(_, '_');
  vm.freeze(P, 'P');
  vm.freeze(xml2js, 'xml2js');
  vm.freeze(moment, 'moment');

  //TODO deprecate direct access in favor of "pax8.request"
  vm.freeze(request(indirectContext, LOGGER), 'request');

  vm.freeze(pax8, 'pax8');
  return vm;
}

function parseScript(LOGGER, scriptText, scriptTrigger = '') {
  if (!scriptText) {
    return {};
  }

  try {
    return new VMScript(`${scriptTrigger}${scriptText}`).compile();
  } catch (e) {
    LOGGER.error('Error parsing script', {scriptText: scriptText, error: e});
    throw e;
  }
}

function addAttributesMapToContext(context) {
  if (_.isEmpty(_.get(context, 'context'))) return context;

  return _.merge(
    {},
    context,
    fromAttrListToAttrMap(
      context,
      [
        'context.partner.attributes',
        'context.company.attributes',
        'context.partner.provisioningDetails',
        'context.company.provisioningDetails',
        'context.instance.attributes',
        'context.vendor.attributes',
      ],
      [
        'context.partner.attributeMap',
        'context.company.attributeMap',
        'context.partner.provisioningDetailsMap',
        'context.company.provisioningDetailsMap',
        'context.instance.attributeMap',
        'context.vendor.attributeMap',
      ],
    ),
  );
}

function fromAttrListToAttrMap(data, from, to) {
  if (_.isEmpty(data) || !from || !to || from.length !== to.length) return {};

  return _.reduce(from, (agg, fromValue, index) => _.merge(
    {},
    agg,
    _.set({}, to[index], listToMapByValueKey(_.get(data, fromValue))),
  ), {});
}

function listToMapByValueKey(list) {
  return _.reduce(list, (agg, val) => {
    if (!val.key && val.name) {
      //some things like provisioningDetails only have a name, so name becomes the key.
      val.key = val.name;
    }
    return val.key ? { ...agg, [val.key]: val } : agg;
  }, {});
}

async function executeScriptInSandbox(LOGGER, rap, scriptTrigger = '') {
  const {
    version,
    repositoryName,
    filePath,
    metaFilePath,
    configuration,
    executionTimeout,
    authToken, //TODO it would be great to not have this come over via SQS
    userToken, //TODO it would be great to not have this come over via SQS
    invocationId,
    rapId,
    invocationState,
    ccBaseUrl,
    inlineContexts
  } = rap;
  LOGGER.info(`Requested execution`, {rap: `${repositoryName}/${filePath}`, meta: `${repositoryName}/${metaFilePath}`, version: version});
  // we can try and promise.all some of the independent calls here
  const rapData = await loadRapWithMeta(LOGGER, version, repositoryName, filePath, metaFilePath);
  const script = parseScript(LOGGER, rapData.scriptText, scriptTrigger);
  const actions = await loadPluginActions(LOGGER, _.get(rapData, 'meta.plugins', []));
  const context = await loadContext(LOGGER, configuration);
  context.ccBaseUrl = ccBaseUrl;
  context.authToken = authToken;
  context.userToken = userToken;
  context.invocation = {
    rapId,
    id: invocationId,
    state: invocationState
  };
  LOGGER.info(`Loaded context`, {context: context});
  const whitelist = await whitelistService.fetchDataWhitelist(LOGGER, context);
  LOGGER.info(`Loaded Whitelist`, {whitelist});
  try {
    const result = !_.isEmpty(script) ? await createSandbox(LOGGER, actions, whitelist, context, inlineContexts, executionTimeout).run(script) : null;
    LOGGER.info(`Finished executing script`, {scriptText: rapData.scriptText, result: result});
    return result
  } catch (scriptError) {
    LOGGER.error(`Script Execution Error`, {error: scriptError});
    throw scriptError;
  }
}

function loadContext(LOGGER, configuration) {
  const callback = request(null, LOGGER);
  LOGGER.info(`Requested to load context`, {configuration: configuration});
  const promises = _.get(configuration, 'contextFetching', [])
    .map(it => callback(callbackConfigToRequestConfig(it))
      .then(response => {
        if (response.error) {
          throw new Error('ContextFetchError', response.error);
        }
        return it.contextKey ? {[it.contextKey]: response.data} : response.data
      }));
  return Promise.all(promises)
    .then(responses => _.reduce(responses, (agg, value) => ({...agg, ...value}), {}));
}
