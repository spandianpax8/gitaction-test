const toolsService = require('../lib/tools-service.js');
const expect = require('chai').expect;


describe('toolsService', () => {

    describe('formatPhoneNumber', () => {
        it('should convert without dashes', () => {
            const phoneNumber = '(123) 123-1234 ';

            const result = toolsService.formatPhoneNumber(phoneNumber, { removeDashes: true});

            expect(result).to.equal('1231231234');
        });

        it('should convert with dashes', () => {
            const phoneNumber = '(123) 123-1234 ';

            const result = toolsService.formatPhoneNumber(phoneNumber, { removeDashes: false});

            expect(result).to.equal('123-123-1234');
        });

        it('should convert without dashes', () => {
            const phoneNumber = '1 (231) 231-1234';

            const result = toolsService.formatPhoneNumber(phoneNumber, { removeDashes: true});

            expect(result).to.equal('12312311234');
        });

        it('should convert with dashes', () => {
            const phoneNumber = '1 (231) 231-1234';

            const result = toolsService.formatPhoneNumber(phoneNumber, { removeDashes: false});

            expect(result).to.equal('1-231-231-1234');
        });

        it('should throw an error if phone number is not a string', () => {
            const phoneNumber = 1231231234;

            try {
                toolsService.formatPhoneNumber(phoneNumber, { removeDashes: true});
            } catch (error) {
                expect(error.message).to.equal("function formatPhoneNumber only accepts Strings");
                return;
            }

            expect('test should have thrown error').to.equal(false);
        });

        it('should return null if phone number is null', () => {
            result = toolsService.formatPhoneNumber(null);
            expect(result).to.equal(null);
        });

        it('should not remove dashes if no configuration is passed', () => {
            const phoneNumber = '(123) 123-1234 ';

            const result = toolsService.formatPhoneNumber(phoneNumber);

            expect(result).to.equal('123-123-1234');
        });

        it('should not remove dashes is configuration does not contain removeDashes field', () => {
            const phoneNumber = '(123) 123-1234 ';

            const result = toolsService.formatPhoneNumber(phoneNumber, { incorrectField: true});

            expect(result).to.equal('123-123-1234');
        });

        it('should throw error if phone number is too short', () => {
            const phoneNumber = '123';

            try {
                toolsService.formatPhoneNumber(phoneNumber);
            } catch (error) {
                expect(error.message).to.equal("function formatPhoneNumber only supports phone numbers with 10 or 11 digits");
                return;
            }

            expect('test should have thrown error').to.equal(false);
        });

        it('should throw error if phone number is too long', () => {
            const phoneNumber = '1234567891234';

            try {
                toolsService.formatPhoneNumber(phoneNumber);
            } catch (error) {
                expect(error.message).to.equal("function formatPhoneNumber only supports phone numbers with 10 or 11 digits");
                return;
            }

            expect('test should have thrown error').to.equal(false);
        });
    });

    describe('stateConvert', () => {
       it('should throw error if state is not a string', () => {
           try{
               toolsService.stateConvert(123);
           } catch(error) {
               expect(error.message).to.equal('function stateConvert only accepts strings');
               return;
           }

           expect('should have thrown an error').to.equal(false);
       });

       it('should return null if state is null', () => {
            const result = toolsService.stateConvert(null);

            expect(result).to.equal(null);
       });

       it('should return state code if state contains uppercase', () => {
            const result = toolsService.stateConvert('COlOradO');

            expect(result).to.equal('CO')
       });

       it('should return state code if state is lowercase', () => {
           const result = toolsService.stateConvert('colorado');

           expect(result).to.equal('CO')
       });

       it('should return null if state is not found', () => {
           const result = toolsService.stateConvert('not a state');

           expect(result).to.equal(null)
       });
    });
});