const expect = require('chai').expect;
const { actionIsAccessible, getPluginActions } = require('../lib/code-commit-service');

describe('codeCommitLoader', () => {

  describe('getPluginActions', () => {

    it('empty list for empty plugin object', () => {
      expect(getPluginActions({})).to.deep.equal({});
    });

    it('empty list for null plugin object', () => {
      expect(getPluginActions(null)).to.deep.equal({});
    });

    it('get only accessible actions', () => {
      const plugin = {
        variable: 1,
        privateAction: () => {},
        publicAction: () => { return "test" },
      };
      plugin.privateAction.meta = { isPrivate: true };

      const result = getPluginActions(plugin);

      expect(result.publicAction()).to.be.equal("test");
      expect(result.privateAction).to.be.undefined;
      expect(result.variable).to.be.undefined;
    });

  });

  describe('actionIsAccessible', () => {

    it('empty action is not accessible as it not not a function', () => {
      expect(actionIsAccessible({})).to.be.false;
    });

    it('empty action is not accessible because it is null', () => {
      expect(actionIsAccessible(null)).to.be.false;
    });

    it('action is accessible', () => {
      expect(actionIsAccessible(() => {})).to.be.true;
    });

    it('action is not accessible because it is private', () => {
      const action = () => {};
      action.meta = { isPrivate: true };
      expect(actionIsAccessible(action)).to.be.false;
    });

  });

});
