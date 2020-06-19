'use strict';

const _ = require('lodash');
const {request} = require('./request-service');

module.exports = init;

function init(context, LOGGER) {
  const requester = request(context, LOGGER);
  const ccBaseUrl = context.ccBaseUrl;
  // Attribute saves are done with the permissions of the user token (invoking user permission levels)
  const authToken = context.userToken;
  const partner = _.get(context, 'context.partner', {});
  const company = _.get(context, 'context.company', {});
  const instance = _.get(context, 'context.instance', {});
  return {
    savePartnerAttribute: savePartnerAttribute(partner.id, partner.attributes, ccBaseUrl, authToken, requester),
    saveInstanceAttribute: saveInstanceAttribute(instance.id, instance.attributes, ccBaseUrl, authToken, requester),
    saveCompanyAttribute: saveCompanyAttribute(company.id, company.attributes, ccBaseUrl, authToken, requester),
    deletePartnerAttribute: deleteAttribute('partners', partner.id, partner.attributes, ccBaseUrl, authToken, requester),
    deleteInstanceAttribute: deleteAttribute('instances', instance.id, instance.attributes, ccBaseUrl, authToken, requester),
    deleteCompanyAttribute: deleteAttribute('companies', company.id, company.attributes, ccBaseUrl, authToken, requester),
  }
}

function getAttributeId(attributes, key) {
  return _.get(_.find(attributes, attr => attr.key === key), 'id', null);
}

function getAttribute(attributes, key) {
  return _.find(attributes, attr => attr.key === key);
}

function getRequestConfig(key, value, configuration, token) {
  return {
    method: 'post',
    params: {token},
    data: {
      attribute: {
        key,
        value,
        label: _.get(configuration, 'label', key),
        hidden: _.get(configuration, 'hidden', false),
        encrypted: _.get(configuration, 'encrypted', false),
        visibility: _.get(configuration, 'visibility', 'pax8'),
        valueType: _.get(configuration, 'valueType', 'text'),
      }
    }
  };
}

function getRequestConfigV3(key, value, configuration, token) {
  return {
    params: {token},
    data: {
        key,
        value,
        label: _.get(configuration, 'label', key),
        hidden: _.get(configuration, 'hidden', false),
        encrypted: _.get(configuration, 'encrypted', false),
        visibility: _.get(configuration, 'visibility', 'pax8'),
        valueType: _.get(configuration, 'valueType', 'text'),
    }
  };
}

function deleteAttribute(entity, entityId, attributes, ccBaseUrl, authToken, requester) {
  return function (key) {
    const attributeId = getAttributeId(attributes, key);
    if (!attributeId) {
      throw new Error(`Tried to delete an attribute (${entity}) that is not available: ${key}`)
    }
    return requester({
      url: `${ccBaseUrl}/api/v3/${entity}/${entityId}/attributes/${attributeId}`,
      method: 'DELETE',
      params: {
        token: authToken
      }
    });
  }
}

function savePartnerAttribute(partnerId, partnerAttributes, ccBaseUrl, authToken, requester) {
  return function (key, value, configuration) {
    const attributeId = getAttributeId(partnerAttributes, key);

    const requestConfig = getRequestConfig(key, value, configuration, authToken);
    requestConfig.data.attribute.partnerGuid = partnerId;

    if (attributeId) {
      requestConfig.url = `${ccBaseUrl}/api-v1/account/1/updatePartnerAttribute`;
      requestConfig.data.attribute.guid = attributeId;
    } else {
      requestConfig.url = `${ccBaseUrl}/api-v1/account/1/createPartnerAttribute`;
    }
    return requester(requestConfig);
  }
}

function saveCompanyAttribute(companyId, companyAttributes, ccBaseUrl, authToken, requester) {
  return function (key, value, configuration) {
    if (configuration && configuration.synchronized) {
      return synchronizedSaveCompanyAttribute(key, value, configuration);
    }
    const attributeId = getAttributeId(companyAttributes, key);
    const requestConfig = getRequestConfig(key, value, configuration, authToken);
    requestConfig.data.attribute.companyGuid = companyId;

    if (attributeId) {
      requestConfig.url = `${ccBaseUrl}/api-v1/account/1/updateCompanyAttribute`;
      requestConfig.data.attribute.guid = attributeId;
    } else {
      requestConfig.url = `${ccBaseUrl}/api-v1/account/1/createCompanyAttribute`;
    }
    return requester(requestConfig);
  }

  function synchronizedSaveCompanyAttribute(key, value, configuration) {
    const existingAttribute = getAttribute(companyAttributes, key);
    const requestConfig = getRequestConfigV3(key, value, configuration, authToken);
    requestConfig.params.synchronizedWrite = true;
    if (existingAttribute) {
      requestConfig.method = 'PUT';
      requestConfig.url = `${ccBaseUrl}/api/v3/companies/${companyId}/attributes/${existingAttribute.id}`;
      requestConfig.data.updatedDate = existingAttribute.updatedDate;
      requestConfig.data.guid = existingAttribute.id;
    } else {
      requestConfig.method = 'POST';
      requestConfig.url = `${ccBaseUrl}/api/v3/companies/${companyId}/attributes`;
    }
    return requester(requestConfig);
  }

}

function saveInstanceAttribute(instanceId, instanceAttributes, ccBaseUrl, authToken, requester) {
  return function (key, value, configuration) {

    const attributeId = getAttributeId(instanceAttributes, key);

    const requestConfig = getRequestConfig(key, value, configuration, authToken);
    requestConfig.data.attribute.instanceGuid = instanceId;
    requestConfig.data = requestConfig.data.attribute;

    if (attributeId) {
      requestConfig.url = `${ccBaseUrl}/api-v2/1/instanceAttribute/${attributeId}`;
      requestConfig.method = 'PUT';
      requestConfig.data.guid = attributeId;
    } else {
      requestConfig.url = `${ccBaseUrl}/api-v2/1/instanceAttribute`;
    }
    return requester(requestConfig);
  }
}
