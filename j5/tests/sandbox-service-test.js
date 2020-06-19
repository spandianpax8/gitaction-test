const expect = require('chai').expect;
const { parseScript, createSandbox, addAttributesMapToContext } = require('../lib/sandbox-service');
const { VM, VMScript } = require('vm2');
const { keys } = require('lodash');
const loggingService = require('../lib/logging-service');


describe('sandboxManager', () => {

  describe('parseScript', () => {

    const LOGGER = loggingService();


    it('parse simple script without any issues', () => {
      expect(parseScript(LOGGER,'function x() { return true; }') instanceof VMScript).to.be.true;
    });

    it('parse simple script with any issues', (done) => {
      try {
        parseScript(LOGGER, '=> () => { return true; }');
      } catch (e) {
        expect(true).to.be.true;
        done();
      }

      expect(true).to.be.false;
      done();
    });

    it('parse empty script', () => {
      expect(parseScript()).to.deep.equal({});
    });

  });

  describe('addAttributesMapToContext', () => {
    it('add to empty context', () => {
      expect(addAttributesMapToContext({})).to.deep.equal({});
    });

    it('add to context with empty context', () => {
      expect(addAttributesMapToContext({ context: {} })).to.deep.equal({context: {}});
    });

    it('add to context with context', () => {
      const context = {
        invocation: {
          id: 44
        },
        context: {
          partner: {
            provisioningDetails: [
              {name :'provDeet1', value:99}
            ],
            attributes: [
              {
                key: 'x',
                value: 5,
              },
              {
                notKey: 'y',
                value: 6,
              },
            ]
          },
        },
      };
      const result = addAttributesMapToContext(context);
      expect(result.context.partner.attributes[0].value).to.equal(context.context.partner.attributes[0].value);
      expect(keys(result.context.partner.attributeMap).length).to.equal(1);
      expect(result.context.partner.attributeMap.x.value).to.equal(context.context.partner.attributes[0].value);
      expect(result.context.partner.attributeMap.y).to.be.undefined;

      expect(result.context.partner.provisioningDetailsMap.provDeet1.value).to.equal(context.context.partner.provisioningDetails[0].value);
    });

  });

  describe('createSandbox', () => {

    it('create sandbox', () => {
      expect(createSandbox({},[],[], {}, [], 1000) instanceof VM).to.be.true;
    });

    it('create sandbox with action and run simple function', () => {
      const fun = 'execute(); function execute() { return context.getString(); }';
      const vm = createSandbox({},[], [{direct: true, path:'getString'}], { context: {getString: () => { return "Test" }}});
      expect(vm.run(fun)).to.equal("Test");
    });

    it('create sandbox with function that executes not available method', (done) => {
      const fun = 'execute(); function execute() { return getString(); }';
      const vm = createSandbox({});

      try {
        vm.run(fun);
      } catch (e) {
        expect(true).to.be.true;
        done();
      }

      expect(true).to.be.false;
      done();
    });

    it('create sandbox with function attempting to access fs library', (done) => {
      const fun = 'execute(); function execute() { return fs.readdirSync("/tmp");  }';
      const vm = createSandbox({});

      try {
        vm.run(fun);
      } catch (e) {
        expect(true).to.be.true;
        done();
      }

      expect(true).to.be.false;
      done();
    });

    it('create sandbox with function attempting to require a library', (done) => {
      const fun = 'execute(); function execute() { const fs = require("fs"); return fs.readdirSync("/tmp");  }';
      const vm = createSandbox({});

      try {
        vm.run(fun);
      } catch (e) {
        expect(true).to.be.true;
        done();
      }

      expect(true).to.be.false;
      done();
    });

    it('create sandbox with infinite function', (done) => {
      const fun = 'execute(); function execute() { while(true) {} }';
      const vm = createSandbox({},[],[], {}, [], 1000);

      try {
        vm.run(fun);
      } catch (e) {
        expect(true).to.be.true;
        done();
      }

      expect(true).to.be.false;
      done();
    });

    it('create sandbox with infinite recursive function', (done) => {
      const fun = 'execute(); function execute() { execute(); }';
      const vm = createSandbox({},[],[], {}, [], 1000);

      try {
        vm.run(fun);
      } catch (e) {
        expect(true).to.be.true;
        done();
      }

      expect(true).to.be.false;
      done();
    });

  });

});
