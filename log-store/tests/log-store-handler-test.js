const expect = require('chai').expect;

const parser = require('../lib/log-parsing-service');

describe('#logParser', function () {

  it('should parse json event', function () {
    const randomObject = {
      message: "2019-11-18T20:17:39.537Z\t52e0fe53-a68f-586e-9b34-a81f5818d4b5\tINFO\t{\"message\":\"Received request\",\"requestPackage\":{\"Records\":[{\"messageId\":\"757e791b-150f-4fd1-b2a5-3ca8c8b4da07\",\"receiptHandle\":\"AQEBRcDJKXl513Sfl8zzz92TjgOTb8X3wbEt2GT66mJLYle0JR6TaqUL7c9klUrnUhncTGm9RRxGUdyGUzObmg1mukhsueK8tMva2InhftgUivmgUspve9M3LHho81sFCkhEPjHpDyEg8LfI3VNpPYznuReNovEpJjdUos6GLaozSPI6dHBvHsmMswBu7f23o+yshph2SogdjOE4Ss6bQRSh+2KTJmiHFIpGU2daXaTfCQ3a8ZWCgMq510Gj43kzhBHWrUQ0qv8438qK+/KX32XHiJcMCf0aOHU6I4nfQggLPV9+yQ68jiTEwnLngkDk82tU37l79/RF5HtEYrUGNhjPq+npj7s6HiGRrOmrahJ64B5lBxiqPAfHpWk4o3/3BmVJKTV2dRmVqlBuzi7IFPXJHw==\",\"body\":\"{\\\"version\\\":\\\"5452e3997d443a7c1ee93fc82cee1ae172fa020f\\\",\\\"repositoryName\\\":\\\"nonproduction-rap\\\",\\\"filePath\\\":\\\"testing/audits\\\",\\\"metaFilePath\\\":\\\"testing/meta.json\\\",\\\"ccBaseUrl\\\":\\\"https://cc-rap-audit-testing.paxating.com\\\",\\\"authToken\\\":\\\"12321\\\",\\\"executionTimeout\\\":30000,\\\"configuration\\\":{\\\"contextFetching\\\":[{\\\"url\\\":\\\"https://cc-rap-audit-testing.paxating.com/api/v3/raps/3ca82823-a3cf-47e9-abaf-9f3d1e51cb9d/rap-contexts/provisioning/90f8065f-76a5-426a-a71d-5fe20ff7b788\\\",\\\"method\\\":\\\"Get\\\",\\\"contextKey\\\":\\\"provisioningContext\\\",\\\"priority\\\":0,\\\"params\\\":{\\\"token\\\":\\\"12312\\\"}}],\\\"completion\\\":{\\\"url\\\":\\\"https://cc-rap-audit-testing.paxating.com/api/v3/provision-tasks/90f8065f-76a5-426a-a71d-5fe20ff7b788\\\",\\\"method\\\":\\\"Put\\\",\\\"priority\\\":0,\\\"params\\\":{\\\"token\\\":\\\"12321\\\"},\\\"body\\\":{\\\"status\\\":\\\"Finished\\\",\\\"id\\\":\\\"90f8065f-76a5-426a-a71d-5fe20ff7b788\\\"}},\\\"error\\\":{\\\"url\\\":\\\"https://cc-rap-audit-testing.paxating.com/api/v3/provision-tasks/90f8065f-76a5-426a-a71d-5fe20ff7b788\\\",\\\"method\\\":\\\"Put\\\",\\\"priority\\\":0,\\\"params\\\":{\\\"token\\\":\\\"123\\\"},\\\"body\\\":{\\\"status\\\":\\\"Error\\\",\\\"errorMessage\\\":\\\"{{ error }}\\\",\\\"id\\\":\\\"90f8065f-76a5-426a-a71d-5fe20ff7b788\\\"}}},\\\"invocationId\\\":\\\"de42a86b-26bb-462d-ae47-060fab622246\\\",\\\"invocationState\\\":{\\\"checkpoints\\\":null}}\",\"attributes\":{\"ApproximateReceiveCount\":\"1\",\"SentTimestamp\":\"1574108249517\",\"SenderId\":\"AROAWBOKBOUACRQWGFMYY:i-001c7eaed99328c9c\",\"ApproximateFirstReceiveTimestamp\":\"1574108259517\"},\"messageAttributes\":{\"ccBaseUrl\":{\"stringValue\":\"https://cc-rap-audit-testing.paxating.com\",\"stringListValues\":[],\"binaryListValues\":[],\"dataType\":\"String\"}},\"md5OfMessageAttributes\":\"a13970ef80d6ec54426a3c9345a485f7\",\"md5OfBody\":\"1156c2e0dd0305da11ef8f83cde35410\",\"eventSource\":\"aws:sqs\",\"eventSourceARN\":\"arn:aws:sqs:us-east-1:415424935168:nonproduction-rap\",\"awsRegion\":\"us-east-1\"}]},\"awsRegion\":\"us-east-1\",\"functionName\":\"rap-executor-nonproduction-exec\",\"functionVersion\":\"$LATEST\",\"functionMemorySize\":\"256\",\"environment\":\"nonproduction\",\"x-correlation-rap-invocation-id\":\"de42a86b-26bb-462d-ae47-060fab622246\",\"x-correlation-rap-version\":\"5452e3997d443a7c1ee93fc82cee1ae172fa020f\",\"x-correlation-timestamp\":1574108259537,\"x-correlation-log-id\":\"016E8029E4D149402F786EDA6DBD5D11\",\"level\":30,\"sLevel\":\"INFO\"}\n"
    };
    const result = parser.logMessage(randomObject);
    expect(result.rapInvocationId).to.equal('de42a86b-26bb-462d-ae47-060fab622246');
    expect(result.logId).to.equal('016E8029E4D149402F786EDA6DBD5D11');
  })
});