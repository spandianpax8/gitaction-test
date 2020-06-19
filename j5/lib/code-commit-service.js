'use strict';

module.exports = {
  loadRapWithMeta,
  loadPluginActions,
  getPluginActions,
  actionIsAccessible,
};

//External
const AWS = require('aws-sdk');
const { get, map, isEmpty, reduce, filter } = require('lodash');
const codeCommit = new AWS.CodeCommit({
  region: 'us-east-1',
});
const requireFromString = require('require-from-string');

function loadRapWithMeta(LOGGER, commitSpecifier, repositoryName, rapFilePath, metaFilePath) {
  return Promise.all([
    loadFile(LOGGER, commitSpecifier, repositoryName, rapFilePath),
    loadFile(LOGGER, commitSpecifier, repositoryName, metaFilePath),
  ]).then(([rapFile, metaFile]) => {
    let metaJson = {};
    try {
      metaJson = JSON.parse(Buffer.from(get(metaFile, 'fileContent', '{}') || '{}').toString());
    } catch (e) {
      LOGGER.error(`Error parsing meta file '${metaFilePath}'`, {error: e})
    }

    const data = {
      scriptText: Buffer.from(get(rapFile, 'fileContent', '') || '').toString(),
      meta: metaJson,
    };
    LOGGER.info(`Loaded data for rap ${repositoryName}/${rapFilePath} with meta ${repositoryName}/${metaFilePath}, and hash ${commitSpecifier}`, data);
    return data;
  });
}

function loadPluginActions(LOGGER, plugins) {
  if (isEmpty(plugins)) {
    return Promise.resolve({});
  }
  LOGGER.info(`Requested to load following plugins -> '${JSON.stringify(plugins)}'`);
  const promises = map(plugins, plugin => loadFile(plugin.commitSpecifier, plugin.repositoryName, plugin.filePath));
  return Promise.all(promises).then((loadedPlugins) => {
    const filteredPlugins = filter(loadedPlugins, plugin => !isEmpty(plugin));
    LOGGER.info(`Managed to load following plugins ${map(filteredPlugins, filteredPlugin => filteredPlugin.filePath)}`);
    return reduce(filteredPlugins, (agg, plugin) => {
      try {
        const pluginAsText = Buffer.from(get(plugin, 'fileContent', '') || '').toString();
        return { ...agg, ...getPluginActions(requireFromString(pluginAsText)) };
      } catch (e) {
        LOGGER.error(`Error parsing '${plugin}'`, e);
        return { ...agg };
      }
    }, {});
  });
}

function actionIsAccessible(action) {
  return action instanceof Function && !get(action, 'meta.isPrivate', false);
}

function getPluginActions(plugin) {
  if (isEmpty(plugin)) {
    return {};
  }

  return reduce(plugin, (agg, value, key) => (
      actionIsAccessible(value) ? {
        ...agg,
        [key]: value,
      } : { ...agg }
    ),
    {});
}

function loadFile(LOGGER, commitSpecifier, repositoryName, filePath) {
  return codeCommit.getFile({
    commitSpecifier,
    repositoryName,
    filePath,
  }).promise()
    .catch(e => {
      const errorMessage = `Error getting file with hash '${commitSpecifier}', repo '${repositoryName}', and path '${filePath}, ${e.message}'`;
      LOGGER.error(errorMessage, {error: e});
      throw new Error(errorMessage);
    });
}
