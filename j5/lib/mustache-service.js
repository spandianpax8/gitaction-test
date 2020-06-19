'use strict';

const _ = require('lodash');
const { render } = require('micromustache');

module.exports = {
    renderObject,
};

function renderObject(template, data, miniMustacheOptions) {
    if (_.isString(template)) {
      return render(template, data, miniMustacheOptions);
    } else if (_.isArray(template)) {
      return _.map(template, item => renderObject(item, data, miniMustacheOptions))
    } else if (_.isObject(template)) {
      return _.mapValues(template, v => {
        return renderObject(v, data, miniMustacheOptions);
      });
    }
    return template
}