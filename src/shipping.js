const { Countries, Provinces } = require('country-and-province');

const getState = state => {
    return Provinces.byCode(state).name;
};

const getCountry = country => {
    if(country == 'US')
        return 'United States'
    else
        return Countries.byCode(country).name;
};

module.exports = { getState, getCountry };  