const util = require('util')

module.exports = {formatPhoneNumber, stateConvert};

function formatPhoneNumber(phoneNumber, config) {

    if(!phoneNumber) {
        return null;
    }

    if(typeof phoneNumber != 'string') {
        throw new Error('function formatPhoneNumber only accepts Strings');
    }
    const numbersOnly = phoneNumber.toString().replace(/[^0-9]+/g,'');

    let formattedPhoneNumber = '';
    if(numbersOnly.length === 10) {
        formattedPhoneNumber = util.format("%d-%d-%d", numbersOnly.slice(0,3), numbersOnly.slice(3,6), numbersOnly.slice(6,10));
    } else if (numbersOnly.length === 11) {
        formattedPhoneNumber = util.format("%d-%d-%d-%d",numbersOnly.slice(0,1), numbersOnly.slice(1,4), numbersOnly.slice(4,7), numbersOnly.slice(7,11));
    } else {
        throw new Error('function formatPhoneNumber only supports phone numbers with 10 or 11 digits')
    }

    if(config && config.removeDashes) {
        formattedPhoneNumber = formattedPhoneNumber.replace(/-/g, '');
    }

    return formattedPhoneNumber;
}

function stateConvert(state) {
    if(!state) {
        return null;
    }

    if(typeof state != 'string') {
        throw Error('function stateConvert only accepts strings');
    }

    const result = states[state.toLowerCase()];

    return result === undefined ? null : result;
}

const states = new Map()
states["alabama"] = "AL";
states["alaska"] = "AK";
states["alberta"] = "AB";
states["american samoa"] = "AS";
states["arizona"] = "AZ";
states["arkansas"] = "AR";
states["armed forces (ae)"] = "AE";
states["armed forces americas"] = "AA";
states["armed forces pacific"] = "AP";
states["british columbia"] = "BC";
states["california"] = "CA";
states["colorado"] = "CO";
states["connecticut"] = "CT";
states["delaware"] = "DE";
states["district of columbia"] = "DC";
states["florida"] = "FL";
states["georgia"] = "GA";
states["guam"] = "GU";
states["hawaii"] = "HI";
states["idaho"] = "ID";
states["illinois"] = "IL";
states["indiana"] = "IN";
states["iowa"] = "IA";
states["kansas"] = "KS";
states["kentucky"] = "KY";
states["louisiana"] = "LA";
states["maine"] = "ME";
states["manitoba"] = "MB";
states["maryland"] = "MD";
states["massachusetts"] = "MA";
states["michigan"] = "MI";
states["minnesota"] = "MN";
states["mississippi"] = "MS";
states["missouri"] = "MO";
states["montana"] = "MT";
states["nebraska"] = "NE";
states["nevada"] = "NV";
states["new brunswick"] = "NB";
states["new hampshire"] = "NH";
states["new jersey"] = "NJ";
states["new mexico"] = "NM";
states["new york"] = "NY";
states["newfoundland"] = "NF";
states["newfoundland and labrador"] =  "NL";
states["north carolina"] = "NC";
states["north dakota"] = "ND";
states["northwest territories"] = "NT";
states["nova scotia"] = "NS";
states["nunavut"] = "NU";
states["ohio"] = "OH";
states["oklahoma"] = "OK";
states["ontario"] = "ON";
states["oregon"] = "OR";
states["pennsylvania"] = "PA";
states["prince edward island"] = "PE";
states["puerto rico"] = "PR";
states["quebec"] = "QC";
states["rhode island"] = "RI";
states["saskatchewan"] = "SK";
states["south carolina"] = "SC";
states["south dakota"] = "SD";
states["tennessee"] = "TN";
states["texas"] = "TX";
states["utah"] = "UT";
states["vermont"] = "VT";
states["virgin islands"] = "VI";
states["virginia"] = "VA";
states["washington"] = "WA";
states["west virginia"] = "WV";
states["wisconsin"] = "WI";
states["wyoming"] = "WY";
states["yukon territory"] = "YT";
states["yukon territories"] =  "YT";
states["australian capital territory"] = "AU-ACT";
states["new south wales"] = "AU-NSW";
states["northern territory"] = "AU-NT";
states["queensland"] = "AU-QLD";
states["south australia"] = "AU-SA";
states["tasmania"] = "AU-TAS";
states["victoria"] = "AU-VIC";
states["western australia"] = "AU-WA";
