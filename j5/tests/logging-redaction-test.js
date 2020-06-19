const expect = require('chai').expect;

const {redactSensitiveKeys} = require('../lib/log-redaction-service');

describe('loggingRedactionService', () => {

  it ('should handle non-object params gracefully', () => {
    // people shouldn't put non objects in the params.
    expect(redactSensitiveKeys(null)).to.deep.equal({});
    expect(redactSensitiveKeys(1)).to.deep.equal({});
    expect(redactSensitiveKeys('hi')).to.deep.equal({});
    expect(redactSensitiveKeys([])).to.deep.equal({});
    expect(redactSensitiveKeys(new Date())).to.deep.equal({});
    expect(redactSensitiveKeys({})).to.deep.equal({});
  });


  it('should redact sensitive keys in the object tree', () => {
    const date = new Date();
    const logParams = {
      notToken: 'hello',
      token: 'secret',
      nested: {
        pax8Token: 'secret',
        companyToken: 'secret',
        nestedAgain: {
          partnerToken: 'secret',
          regularValue: 123
        },
        anArray: [1,2,3, {authToken: 'secret'}],
        aDate: date,
        stringWithSensitiveStuff: "{pax8Token:abc123}",
        stringWithSensitiveStuff2: "{token:abc123}"
      }
    };

    const expectedLogParams = {
      notToken: 'hello',
      token: '*****',
      nested: {
        pax8Token: '*****',
        companyToken: '*****',
        nestedAgain: {
          partnerToken: '*****',
          regularValue: 123
        },
        anArray: [1,2,3, {authToken: '*****'}],
        aDate: date,
        stringWithSensitiveStuff: "*****",
        stringWithSensitiveStuff2: "*****"
      }
    };
    expect(redactSensitiveKeys(logParams)).to.deep.equal(expectedLogParams);
  });

});

