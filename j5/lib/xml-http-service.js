const xml2js = require('xml2js');
const axios = require('axios');

const xmlHttp = (requestConfig) => {
    return axios({
        method: requestConfig.method,
        url: requestConfig.uri,
        headers: requestConfig.headers,
        params: requestConfig.qs,
        data: requestConfig.body,
        timeout: requestConfig.timeout,
    }).then(handleResponse);
}

async function handleResponse(response) {
    response.data = await parseXml(response.data);
    return response;
}

function parseXml(xml) {
    return xml2js.parseStringPromise(xml);
}

module.exports = xmlHttp;
