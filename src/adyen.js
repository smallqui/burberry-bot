const adyenEncrypt = require('node-adyen-encrypt')(25);
const adyenKey = "10001|BA3B8F02438A5CDA19E31F73A067EB7A7E6AD339A2FE80154BE80D0103DB02B0C53AB7EF3BDE89533935E3B60817873B7939F6FCFACC794D0F85878FAFEE385B453B20B9087FBD046CB4C8E26FE794B1D28A410C632B1289FF444F87260D88C36A4723178A6F1252C2DBD69DFB78EF89C3A4CDF5C49F3A9A7077C06DE45C1CAC77F1589D4756A8C7E37B8444C711FE786DD59749FF4F796991765E11646FCA00C32A79B6D6C141D0CEF4518ACC2EC96D37214DD83358834A1C4FF21559EE7129C8F21B30A8884644126652105EFD10D66AC913813BC03B447D941D7FBD6329FE2AEDE104218BF91E83794D970796E812EBDD2C8CDBB1ADEBCAF63B6811CFB62F";
const options = {};

//adyen payment processer gen re

const encryptCardNumber = (holder, card) => {
    let cardInfo = {
        number: card,
        holderName: holder,
        generationtime: new Date().toISOString()
    };

    let numberInstance = adyenEncrypt.createEncryption(adyenKey, options);
    numberInstance.validate(cardInfo);
    return numberInstance.encrypt(cardInfo);
};

const encryptCardMonth = (holder, month) => {
    let cardMonth = {
        expiryMonth: month,
        holderName: holder,
        generationtime : new Date().toISOString()
    };

    const monthInstance = adyenEncrypt.createEncryption(adyenKey, options);
    monthInstance.validate(cardMonth);
    return monthInstance.encrypt(cardMonth);    
};

const encryptCardYear = (holder, year) => {
    let cardYear = {
        expiryYear: year,
        holderName: holder,
        generationtime : new Date().toISOString()
    };

    const yearInstance = adyenEncrypt.createEncryption(adyenKey, options);
    yearInstance.validate(cardYear);
    return yearInstance.encrypt(cardYear);    
};

const encryptCardCVV = (holder, cvv) => {
    let cardCVV = {
        cvc: cvv,
        holderName: holder,
        generationtime : new Date().toISOString()
    };

    const cvvInstance = adyenEncrypt.createEncryption(adyenKey, options);
    cvvInstance.validate(cardCVV);
    return cvvInstance.encrypt(cardCVV);    
};

module.exports = { encryptCardNumber, encryptCardMonth, encryptCardYear, encryptCardCVV };