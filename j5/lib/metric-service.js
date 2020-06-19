module.exports = init;

const {get} = require('lodash');
const loggingService = require('./logging-service');

function init(requestPackage) {
  const rap = JSON.parse(get(requestPackage, 'Records[0].body') || '{}') || {};
  const LOGGER = loggingService(rap);

  return {
    log
  };

  function log(executeStartTime, success = false) {
    const executeFinishTime = new Date();
    const runDuration = executeFinishTime.getTime() - executeStartTime.getTime();
    const sentTimestamp = parseInt(get(requestPackage, 'Records[0].attributes.SentTimestamp', 0));
    const timeInQueue = !!sentTimestamp ? executeStartTime.getTime() - new Date(sentTimestamp).getTime() : null;
    const timeSinceInitiated = !!get(rap, 'metrics.initiatedTime') ? executeFinishTime.getTime() - new Date(parseInt(get(rap, 'metrics.initiatedTime'))).getTime() : null;
    const rapMetrics = get(rap, 'metrics', {});

    // this is the blanket wide performance metric
    LOGGER.metric('Top Level Rap Performance', {
      wasSuccess: success,
      runDuration,
      timeInQueue,
      timeSinceInitiated,
      ...rapMetrics,
    });

    const meta = getFilePathMeta(rap);
    // for individual aggregation dashboards
    LOGGER.metric(`RAP Timing Metric: vendor=${meta.vendor}, project=${meta.project}, name=${meta.action}, filename=${meta.filename} phase=queueTime, elapsedTime=${timeInQueue}, invocationId=${rap.invocationId}, rapId=${rap.rapId}, success=${success}`);
    LOGGER.metric(`RAP Timing Metric: vendor=${meta.vendor}, project=${meta.project}, name=${meta.action}, filename=${meta.filename} phase=execute, elapsedTime=${runDuration}, invocationId=${rap.invocationId}, rapId=${rap.rapId}, success=${success}`);
  }
}

function getFilePathMeta(rap) {
  const filePaths = rap.filePath.split('/');
  // raps that dont prescribe to this method
  if(!(filePaths.length > 3)) {
    return {
      vendor: rap.filePath,
      project: rap.filePath,
      action: rap.filePath,
      filename: rap.filePath,
    }
  }

  return {
    vendor: filePaths[0],
    project: filePaths[1],
    action: filePaths[2],
    filename: filePaths.slice(3, filePaths.length).join('/')
  }
}
