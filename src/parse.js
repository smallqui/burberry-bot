const getProductURL = url => {
    let split = url.split('/');
    return split[split.length - 1];
};

const getBurberryID = cookieJar => {
    return /burberryId\=(.+?)\;/.exec(cookieJar.store.idx['api.burberry.com']['/'].burberryId)[1];
};

const getAllSizes = stock => {
    return stock.map(({ label, sku }) => { return { label, sku }});
};

const getAvailableSizes = stock => {
    return stock.filter(({ isInStock }) => isInStock)
    .map(({ label, sku }) => { return { label, sku }});    
};

const getAvailableDesiredSizes = (stock, desired) => {
    return stock.filter(({ label }) => desired.some(ds => label == ds))
    .filter(({ isInStock }) => isInStock)
    .map(({ label, sku }) => { return { label, sku }});
};

const getAllDesiredSizes = (stock, desired) => {
    return stock.filter(({ label }) => desired.some(ds => label == ds))
    .map(({ label, sku }) => { return { label, sku }});
};

const getSizes = (stock, desired) => {
    if(desired[0] == 'random'){
        if(getAvailableSizes(stock).length == 0)
            return getAllSizes(stock);
        else
            return getAvailableSizes(stock);
    }
    else {
        if(getAvailableDesiredSizes(stock, desired).length == 0)
            return getAllDesiredSizes(stock, desired);
        else
            return getAvailableDesiredSizes(stock, desired);
    };
};

module.exports = { getSizes, getProductURL, getBurberryID };