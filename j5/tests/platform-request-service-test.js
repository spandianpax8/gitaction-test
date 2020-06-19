
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const uuid = require('uuid');

describe('pax8.platformRequestService', () => {

  const requesterFake = sinon.fake();
  const requestServiceFake = sinon.fake.returns(requesterFake);
  const requestServiceStub = {request: (context) => requestServiceFake(context)};
  const platformRequestService = proxyquire('../lib/platform-request-service', {'./request-service': requestServiceStub});
  const context = {
    ccBaseUrl: 'https://example.com',
    authToken: uuid.v4(),
    userToken: uuid.v4(),
    context: {
    }
  };

  afterEach(() => {
    sinon.reset();
  });

  describe('platformRequest', () => {

    it('should automatically fill in certain information for platform requests', async () => {
      const platformRequestFunction = platformRequestService.platformRequest(context, context.userToken, context.ccBaseUrl);

      await platformRequestFunction({
        url: '/relative/url',
        params: {param1: 'value1'},
        method: 'GET',
      });

      expect(requesterFake.callCount).to.equal(1);

      expect(requesterFake.firstCall.lastArg).to.deep.equal({
        url: `https://example.com/relative/url`,
        params: {token: context.userToken, param1: 'value1'},
        method: 'GET'
      });

    });

    it('should error on null userToken', async () => {
      const platformRequestFunction = platformRequestService.platformRequest(context, null, context.ccBaseUrl);

      const result = await platformRequestFunction({
        url: '/relative/url',
        params: {param1: 'value1'},
        method: 'GET',
      });
      expect(requesterFake.callCount).to.equal(0);
      expect(!!result.error).to.be.true;
    });

  });

});
