const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const uuid = require('uuid');
const _ = require('lodash');

describe('pax8.arrearsUsageService', () => {

  const requesterFake = sinon.fake();
  const requestServiceFake = sinon.fake.returns(requesterFake);
  const requestServiceStub = {request: (context) => requestServiceFake(context)};
  const arrearsUsageService = proxyquire('../lib/arrears-usage-service', {'./request-service': requestServiceStub});
  const context = {
    ccBaseUrl: 'https://example.com',
    authToken: uuid.v4(),
    context: {
      arrearsTask: {
        id: uuid.v4(),
        payload: {
          usageDate: {value: new Date()}
        }
      },
      subscription: {
        id: uuid.v4()
      },
      partner: {
        id: uuid.v4()
      },
      instance: {
        id: uuid.v4()
      },
      company: {
        id: uuid.v4()
      }
    }
  };

  afterEach(() => {
    sinon.reset();
  });

  describe('commitNightlyUsage', () => {

    it('should Call the endpoint to commit usage', async () => {
      const {commitNightlyUsage} = arrearsUsageService.init(context);

      const usage = [{
        isTrial: true,
        arrearsName: 'Hello There',
        arrearsId: 'abc123',
        usageLines: [
          {
            isTrial: true,
            unitOfMeasurement: 'bytes',
            quantity: 10.1,
            productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
          }
        ],
        columnHeader: 'Widgets'
      }];

      await commitNightlyUsage(usage);

      expect(requesterFake.callCount).to.equal(1);

      expect(requesterFake.firstCall.lastArg).to.deep.equal({
        url: `https://example.com/api/v3/usage-summaries`,
        params: {token: context.authToken},
        method: 'POST',
        data: [{
          //new stuff
          subscriptionId: context.context.subscription.id,
          companyId: context.context.company.id,
          partnerId: context.context.partner.id,
          active: true,
          synced: false,
          type: 'Rap',

          isTrial: true,
          arrearsName: 'Hello There',
          arrearsId: 'abc123',
          usageLines: [
            {
              //new stuff
              usageDate: context.context.arrearsTask.payload.usageDate.value,

              billedLine: false,

              isTrial: true,
              unitOfMeasurement: 'bytes',
              quantity: 10.1,
              productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
            }
          ],
          columnHeader: 'Widgets'
        }]
      });

    });

    it('should fail to validate', async () => {
      const {commitNightlyUsage} = arrearsUsageService.init(context);
      const usage = [{
        isTrial: true,
        arrearsName: 'Hello There',
        // Missing the arrearsId
        usageLines: [
          {
            isTrial: true,
            unitOfMeasurement: 'bytes',
            quantity: 10.1,
            productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
          }
        ],
        columnHeader: 'Widgets'
      }];
      const result = await commitNightlyUsage(usage);
      expect(result.error).to.equal(true);
      expect(result.errors.length).to.equal(1);
      expect(requesterFake.callCount).to.equal(0);
    });

    it('should should fail to populate context', async () => {
      const usage = [{
        isTrial: true,
        arrearsName: 'Hello There',
        arrearsId: 'id123',
        usageLines: [
          {
            isTrial: true,
            unitOfMeasurement: 'bytes',
            quantity: 10.1,
            productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
          }
        ],
        columnHeader: 'Widgets'
      }];
      const newContext = _.cloneDeep(context);
      newContext.context.partner = null; //simulate missing context
      const {commitNightlyUsage} = arrearsUsageService.init(newContext);
      const result = await commitNightlyUsage(usage);
      expect(result.error).to.equal(true);
      expect(result.errors.length).to.equal(1);
      expect(requesterFake.callCount).to.equal(0);
    });

  });

  describe('validate usage', () => {

    it('should handle empty usage', () => {
      const errors = arrearsUsageService.validate();
      expect(errors.length).to.equal(1);
    });

    it('should give no errors for properly formatted usage', () => {
      const errors = arrearsUsageService.validate([{
        isTrial: true,
        arrearsName: 'Hello There',
        arrearsId: 'abc123',
        usageLines: [
          {
            isTrial: true,
            unitOfMeasurement: 'bytes',
            quantity: 10.1,
            productId: uuid.v4(),
          }
        ],
        columnHeader: 'Widgets'
      }]);
      expect(errors.length).to.equal(0);
    });


    it('should give errors for missing fields', () => {
      const errors = arrearsUsageService.validate([{
        arrearsName: 'Hello There',
        arrearsId: 'abc123',
        usageLines: [
          {
            isTrial: true,
            unitOfMeasurement: 'bytes',
            quantity: 10.1,
            productId: uuid.v4(),
          }
        ],
        columnHeader: 'Widgets'
      }]);
      expect(errors.length).to.equal(1);
    });

    it('should tolerate an empty array of usage lines.', () => {
      const errors = arrearsUsageService.validate([{
        arrearsName: 'Hello There',
        arrearsId: 'abc123',
        usageLines: [],
        columnHeader: 'Widgets'
      }]);
      expect(errors.length).to.equal(1);
    });

    it('should should not tolerate an malformed usageLine field.', () => {
      const errors = arrearsUsageService.validate([{
        isTrial: true,
        arrearsName: 'Hello There',
        arrearsId: 'abc123',
        usageLines: 'this should be an array',
        columnHeader: 'Widgets'
      }]);
      expect(errors.length).to.equal(1);
    });

  });

  describe('populate usage', () => {

    const subscription = {id: uuid.v4()};
    const company = {id: uuid.v4()};
    const partner = {id: uuid.v4()};
    const arrearsTask = {id: uuid.v4(), payload: {usageDate: {value: new Date()}}};

    it('should throw an error if context data is missing', () => {
      const context = {
        subscription,
        company,
        //partner is missing,
        arrearsTask
      };
      expect(() => arrearsUsageService.populateContextData([], context)).to.throw();
    });

    it('should populate usage summaries and lines with data from the context', () => {

      const usage = [{
        isTrial: true,
        arrearsName: 'Hello There',
        arrearsId: 'abc123',
        usageLines: [
          {
            isTrial: true,
            unitOfMeasurement: 'bytes',
            quantity: 10.1,
            productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
          }
        ],
        columnHeader: 'Widgets'
      }];

      arrearsUsageService.populateContextData(usage, {subscription, company, partner, arrearsTask});
      expect(usage).to.deep.equal(
        [{
          //new stuff
          subscriptionId: subscription.id,
          companyId: company.id,
          partnerId: partner.id,
          active: true,
          synced: false,
          type: 'Rap',

          isTrial: true,
          arrearsName: 'Hello There',
          arrearsId: 'abc123',
          usageLines: [
            {
              //new stuff
              usageDate: arrearsTask.payload.usageDate.value,

              billedLine: false,

              isTrial: true,
              unitOfMeasurement: 'bytes',
              quantity: 10.1,
              productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
            }
          ],
          columnHeader: 'Widgets'
        }]
      );

    });

  });

  describe('commitBilledUsage', () => {

    it('should Call the endpoint to commit usage, with billable flag set to true', async () => {
      const {commitBilledUsage} = arrearsUsageService.init(context);

      const usage = [{
        isTrial: true,
        arrearsName: 'Hello There',
        arrearsId: 'abc123',
        usageLines: [
          {
            isTrial: true,
            unitOfMeasurement: 'bytes',
            quantity: 10.1,
            productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
          }
        ],
        columnHeader: 'Widgets'
      }];

      await commitBilledUsage(usage);
      expect(requesterFake.callCount).to.equal(1);
      expect(requesterFake.firstCall.lastArg).to.deep.equal({
        url: `https://example.com/api/v3/usage-summaries/billed`,
        params: {token: context.authToken},
        method: 'POST',
        data: [{
          //new stuff
          subscriptionId: context.context.subscription.id,
          companyId: context.context.company.id,
          partnerId: context.context.partner.id,
          active: true,
          synced: false,
          type: 'Rap',

          isTrial: true,
          arrearsName: 'Hello There',
          arrearsId: 'abc123',
          usageLines: [
            {
              //new stuff
              usageDate: context.context.arrearsTask.payload.usageDate.value,

              //new stuff for billed usage
              billedLine: true,

              isTrial: true,
              unitOfMeasurement: 'bytes',
              quantity: 10.1,
              productId: '78461d3c-8a71-49a5-a645-69b7ab25e6a3',
            }
          ],
          columnHeader: 'Widgets'
        }]
      });

    });

  });

});