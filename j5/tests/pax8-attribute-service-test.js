const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const uuid = require('uuid');

describe('pax8.attributeService', () => {

  const requesterFake = sinon.fake();
  const requestServiceFake = sinon.fake.returns(requesterFake);
  const requestServiceStub = {request: (context) => requestServiceFake(context)};
  const pax8AttributeService = proxyquire('../lib/pax8-attribute-service', {'./request-service': requestServiceStub});
  const context = {
    ccBaseUrl: 'https://example.com',
    authToken: uuid.v4(),
    userToken: uuid.v4(),
    context: {
      partner: {
        id: uuid.v4(),
        attributes: [{key: 'deleteMePartner', id: uuid.v4()}]
      },
      instance: {
        id: uuid.v4(),
        attributes: [{key: 'deleteMeInstance', id: uuid.v4()}]
      },
      company: {
        id: uuid.v4(),
        attributes: [{key: 'deleteMeCompany', id: uuid.v4()}]
      }
    }
  };

  afterEach(() => {
    sinon.reset();
  });

  describe('deleteAttribute', () => {

    it('should call delete for partner attributes', () => {
      const {deletePartnerAttribute} = pax8AttributeService(context);
      deletePartnerAttribute('deleteMePartner');
      expect(requesterFake.callCount).to.equal(1);
      expect(requesterFake.firstCall.lastArg).to.deep.equal({
        url: `https://example.com/api/v3/partners/${context.context.partner.id}/attributes/${context.context.partner.attributes[0].id}`,
        params: {token: context.userToken},
        method: 'DELETE'
      });

    });

    it('should call delete for instance attributes', () => {
      const {deleteInstanceAttribute} = pax8AttributeService(context);
      deleteInstanceAttribute('deleteMeInstance');
      expect(requesterFake.callCount).to.equal(1);
      expect(requesterFake.firstCall.lastArg).to.deep.equal({
        url: `https://example.com/api/v3/instances/${context.context.instance.id}/attributes/${context.context.instance.attributes[0].id}`,
        params: {token: context.userToken},
        method: 'DELETE'
      });

    });

    it('should call delete for company attributes', () => {
      const {deleteCompanyAttribute} = pax8AttributeService(context);
      deleteCompanyAttribute('deleteMeCompany');
      expect(requesterFake.callCount).to.equal(1);
      expect(requesterFake.firstCall.lastArg).to.deep.equal({
        url: `https://example.com/api/v3/companies/${context.context.company.id}/attributes/${context.context.company.attributes[0].id}`,
        params: {token: context.userToken},
        method: 'DELETE'
      });

    });

    it('should throw an error for an unavailable attribute', () => {
      const id = uuid.v4();
      const partnerId = uuid.v4();
      const context = {
        ccBaseUrl: 'https://example.com',
        authToken: uuid.v4(),
        userToken: uuid.v4(),
        context: {
          partner: {id: partnerId, attributes: [{key: 'deleteMe', id}]}
        }
      };
      const {deletePartnerAttribute} = pax8AttributeService(context);
      expect(() => deletePartnerAttribute('notFound')).to.throw();
    });


  });

});