const expect = require('chai').expect;
const requestService = require('../lib/request-service');
const loggingService = require('../lib/logging-service');


describe('requestService', () => {

  it('should throw with no logger', () => {
    try {
      requestService.request();
    } catch (error) {
      expect(!!error);
      return;
    }
    expect('should have thrown error for no logger' === false);
  });

  it('should make a successful get request', async () => {
    const LOGGER = loggingService();
    const request = requestService.request({}, LOGGER);

    const result = await request({
      url: 'https://example.com',
      method: 'GET'
    });

    expect(result.status).to.equal(200);
    expect(result.error).to.be.false;
    expect(result.statusText).to.equal("OK");
    expect(result.headers).to.exist;
    expect(result.data).to.exist;

  });

  it('should make a successful post request', async () => {
    const LOGGER = loggingService();
    const request = requestService.request({}, LOGGER);

    const result = await request({
      url: 'https://example.com',
      method: 'POST',
      headers: {Authorization: 'test'},
      params: {query:'param'},
      data: {post:'body data'},
      timeout: 3000
    });

    expect(result.status).to.equal(200);
    expect(result.error).to.be.false;
    expect(result.statusText).to.equal("OK");
    expect(result.headers).to.exist;
    expect(result.data).to.exist;

  });


  it('should make an error request', async () => {
    const LOGGER = loggingService();
    const request = requestService.request({}, LOGGER);

    const result = await request({
      url: 'https://example.commmm',
      method: 'GET'
    });

    expect(!!result.error).to.be.true;
  });

  it('should handle the messed up microsoft format', async () => {
    const LOGGER = loggingService();
    const request = requestService.request({}, LOGGER);

    const result = await request({
      url: 'https://example.commmm',
      method: 'GET'
    });

    expect(!!result.error).to.be.true;
  });

  it('should strip query params from messages', () => {

    expect(requestService.stripQueryParams("request to http://example.com?hi=val")).to.equal("request to http://example.com");
    expect(requestService.stripQueryParams("a Message")).to.equal("a Message");
    expect(requestService.stripQueryParams("")).to.equal("");
    expect(requestService.stripQueryParams(null)).to.equal(null);
    expect(requestService.stripQueryParams([1])).to.deep.equal([1]);
    expect(requestService.stripQueryParams({hi:'bye'})).to.deep.equal({hi:'bye'});


  });

});

