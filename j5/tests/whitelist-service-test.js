const expect = require('chai').expect;
const whitelistService = require('../lib/whitelist-service');


describe('whitelistService', () => {

  describe('filterIndirectContext', () => {

    it('handles empty whitelist', () => {
      const whitelist = [];
      const context = {some: 'stuff'};
      const filtered = whitelistService.filterIndirectContext(whitelist, context);
      expect(filtered).to.deep.equal({});
    });

    it('filter object', () => {
      const whitelist = [
        {direct: true, path: 'some/stuff'},
        {direct: false, path: 'some/new'}
      ];
      const context = {
        context: {
          some: {
            stuff: 'value1',
            new: [1, 2, 3, 4],
            old: 'old'
          },
          other: 'more stuff'
        },
        other: 'more stuff'
      };
      const filtered = whitelistService.filterIndirectContext(whitelist, context);
      const expected = {
        context: {
          some: {
            stuff: 'value1',
            new: [1, 2, 3, 4]
          }
        }
      };
      expect(filtered).to.deep.equal(expected);
    });

  });

  describe('filterDirectContext', () => {
    it('filter object', () => {
      const whitelist = [
        {direct: true, path: 'some/stuff'},
        {direct: false, path: 'some/new'}
      ];
      const context = {
        context: {
          some: {
            stuff: 'value1',
            new: [1, 2, 3, 4],
            old: 'old'
          },
          other: 'more stuff'
        },
        other: 'more stuff'
      };
      const filtered = whitelistService.filterDirectContext(whitelist, context);
      const expected = {
        context: {
          some: {
            stuff: 'value1'
          }
        }
      };
      expect(filtered).to.deep.equal(expected);
    });

  });

  describe('Filtering Multiple Contexts', () => {
    it('Should filter direct with multiple top level context keys', () => {
      const whitelist = [
        {direct: true, path: 'some/stuff'},
        {direct: false, path: 'some/new'},
        {direct: true, path: 'context2OnlyStuff'},
        {direct: true, path: ''},
      ];
      const context = {
        context2: {
          context2OnlyStuff: 'from context 2',
          some: {
            stuff: 'value1',
            new: [1, 2, 3, 4],
            old: 'old'
          },
          other: 'more stuff'
        },
        context: {
          some: {
            stuff: 'value1',
            new: [1, 2, 3, 4],
            old: 'old'
          },
          other: 'more stuff'
        },
        other: 'more stuff'
      };
      const filtered = whitelistService.filterDirectContext(whitelist, context);
      const expected = {
        context: {
          some: {
            stuff: 'value1'
          }
        },
        context2: {
          some: {
            stuff: 'value1'
          },
          context2OnlyStuff: 'from context 2'
        }
      };
      expect(filtered).to.deep.equal(expected);
    });

  });

});
