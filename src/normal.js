const randomstring = require('randomstring');
const Profile = require('../lib/profile');
const Terminal = require('../lib/terminal');
const Webhooks = require('../lib/webhooks');
const { getProxy, getAgent } = require('../lib/proxy');
const { encryptCardNumber, encryptCardMonth, encryptCardYear, encryptCardCVV } = require('./adyen');
const { getSizes, getProductURL, getBurberryID } = require('./parse');
const { getState } = require('./shipping');
const { status } = require('../lib/status');
const { CookieJar } = require('tough-cookie');
const { HttpProxyAgent, HttpsProxyAgent } = require('hpagent');
const got = require('got');

const terminal = new Terminal;
const webhooks = new Webhooks;

class Normal {
    constructor(taskDetails, profile, delays){
        this.id = randomstring.generate(6).toUpperCase();
        this.input = taskDetails.input.toString();
        this.productURL = getProductURL(this.input);
        this.desiredSize = taskDetails.size;
        this.captcha = taskDetails.captcha;
        this.delays = delays;
        this.profile = new Profile(profile);
        this.proxy = getProxy();
        this.agent = getAgent(this.proxy);
        this.cookieJar = new CookieJar();
        this.httpAgent = { 
            https: new HttpProxyAgent({ proxy: this.agent }),
            https: new HttpsProxyAgent({ proxy: this.agent })
        };
    };

    rotateProxy(){
        this.proxy = getProxy();
        this.agent = getAgent(this.proxy);
        this.httpAgent = { 
            https: new HttpProxyAgent({ proxy: this.agent }),
            https: new HttpsProxyAgent({ proxy: this.agent })
        };
    };

    start(){
        terminal.addTask();
        status(this.id, 'normal', `Starting Task - ${this.profile.getProfileName()} - ${this.input}`, 'precheckout');
        this.controller('getBurberry');
    };

    async controller(step){
        try {
            if(!step || step == undefined)
                step = 'getBurberry';
            this.next = await this[step]();
            setTimeout(() => {
                this.controller(this.next);
            });
        }
        catch(error){
            try {
                if(error.message.includes('Stop'))
                    throw new Error('Task Stopped');
                if(error.message)
                    status(this.id, 'normal', error.message, error.type);
                setTimeout(() => {
                    this.controller(this.next);
                }, error.interval);
            } catch (e) {
                this.stop();
            };
        };
    };

    getBurberry(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Getting Session (1/2)`, `precheckout`);

            got(`https://api.burberry.com/web-api-proxy/user-session`, {
                headers: {
                    'authority': 'api.burberry.com',
                    'accept': '*/*',
                    'access-control-request-method': 'POST',
                    'access-control-request-headers': 'content-type,correlation-id,request-channel',
                    'origin': 'https://us.burberry.com',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'sec-fetch-dest': 'empty',
                    'referer': 'https://us.burberry.com/',
                    'accept-language': 'en-US,en;q=0.9',
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                if(!body.errors){
                    this.burberryID = getBurberryID(this.cookieJar);
                    resolve('getUser');
                }
                else 
                    reject({ message: `Flagged Getting Session (1/2), Retrying`, interval: this.delays.error, type: 'error'});
            })
            .catch(({ response }) => {
                if(!response || response == undefined){
                    this.rotateProxy();
                    reject({ message: `Proxy Error Getting Session (1/2), Rotating Proxy`, interval: 2000, type: 'error' });
                }
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Getting Session (1/2), Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Getting Session (1/2) - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Getting Session (1/2), Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Getting Session (1/2), Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Getting Session (1/2) (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    getUser(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Getting Session (2/2)`, `precheckout`);

            got.post(`https://api.burberry.com/web-api-proxy/user-session`, {
                headers: {
                    'authority': 'api.burberry.com',
                    'accept': '*/*',
                    'access-control-request-method': 'POST',
                    'access-control-request-headers': 'content-type,correlation-id,request-channel',
                    'origin': 'https://us.burberry.com',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'sec-fetch-dest': 'empty',
                    'referer': 'https://us.burberry.com/',
                    'accept-language': 'en-US,en;q=0.9',
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json',
                followRedirect: false
            })
            .then(({ body }) => {
                if(!body.errors){
                    this.guestID = body.data.guest_id;
                    resolve('getSizes');
                }
                else
                    reject({ message: `Flagged Getting Session (2/2), Retrying`, interval: this.delays.error, type: 'error'});
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Getting Session (2/2), Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Getting Session (2/2), Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Getting Session (2/2) - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Getting Session (2/2), Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Getting Session (2/2), Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Getting Session (2/2) (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    getSizes(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Getting Sizes`, 'precheckout');

            got(`https://us.burberry.com/web-api/pages?pagePath=%2F${this.productURL}&country=US&language=en`, {
                headers: {
                    authority: 'us.burberry.com',
                    accept: 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'guest-id': this.guestID,
                    referer: 'https://us.burberry.com/leathervintage-check-cotton-sneakers-p80381841',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'x-atg-burberryid': this.burberryID,
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                if(!body.errors){
                    if(body.data.result == 'home'){
                        reject({ message: `Error Getting Sizes - Product Not Found`, interval: this.delays.error, type: 'error' });
                    }
                    else {
                        let productInfo = body.data.entities.pages[`/${this.productURL}`].data;
                        this.pid = productInfo.id;
    
                        let stock = productInfo.sizes;
                        if(getSizes(stock, this.desiredSize).length == 0)
                            reject({ message: `No Sizes Available, Retrying`, interval: this.delays.monitor, type: 'error' });
                        else {
                            this.sizes = getSizes(stock, this.desiredSize);
                            resolve('addToCart')
                        };
                    };
                }
                else 
                    reject({ message: `Flagged Getting Sizes, Retrying`, interval: this.delays.error, type: 'error'});
            })
            .catch(({ response, message }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Getting Sizes, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Getting Sizes, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Getting Sizes - Product Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Getting Sizes, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Getting Sizes, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Getting Sizes (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    addToCart(){
        return new Promise((resolve, reject) => {
            let { label, sku } = this.sizes[Math.floor(Math.random() * this.sizes.length)];

            if(!label || label == undefined){
                label = 'N/A';
            };

            status(this.id, 'normal', `Adding To Cart (${label})`, 'precheckout');

            let payload = JSON.stringify({
                "product_id": this.pid,
                "quantity": 1,
                "sku_id": sku
            });

            got.post(`https://us.burberry.com/web-api/guest/order/?country=US&language=en`, {
                body: payload,
                headers: {
                    'authority': 'us.burberry.com',
                    accept: 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    'guest-id': this.guestID,
                    origin: 'https://us.burberry.com',
                    referer: 'https://us.burberry.com/',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'x-atg-burberryid': this.burberryID,
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json',
            })
            .then(({ body }) => {
                if(!body.error){
                    this.orderNumber = body.data.result;
                    let cart = body.data.entities.order[this.orderNumber];
                    this.product = {
                        name: `${cart.items[0].title} (${cart.items[0].colour})`,
                        size: label,
                        price: cart.subTotal.priceFormatted,
                        image: `https:${cart.items[0].image}`,
                        url: `https://us.burberry.com${cart.items[0].productUrl}`
                    };
                    terminal.addCart();
                    webhooks.cart(this.id, this.input, 'Burberry US', 'Normal', this.product, this.profile.getProfileName());
                    status(this.id, 'normal', `Item Carted - ${this.product.name} (${this.product.size})`, 'success');
                    resolve('getCiam');
                }
                else
                    reject({ message: `Flagged Adding To Cart, Retrying`, interval: this.delays.error, type: 'error'});
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Adding To Cart, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Adding To Cart, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Adding To Cart - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Adding To Cart, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Adding To Cart, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Adding To Cart (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    getCiam(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Generating Auth Token`, 'precheckout');

            let payload = JSON.stringify({
                "forceUpdate": false
            });

            got.post(`https://us.burberry.com/checkout-api/ciam-token?country=US&language=en`, {
                body: payload,
                headers: {
                    'authority': 'us.burberry.com',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'accept': 'application/json, text/plain, */*',
                    'x-atg-burberryid': this.burberryID,
                    'sec-ch-ua-platform': '"macOS"',
                    'origin': 'https://us.burberry.com',
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                    'referer': 'https://us.burberry.com/checkout/shopping-bag/',
                    'accept-language': 'en-US,en;q=0.9'
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                this.ciamToken = body.token;
                resolve('getCheckout');
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Generating Auth Token, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Generating Auth Token, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Generating Auth Token - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Generating Auth Token, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Generating Auth Token, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Generating Auth Token (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    getCheckout(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', 'Getting Checkout', 'precheckout');
            got('https://us.burberry.com/checkout-api/shopping-bag?country=US&language=en', {
                headers: {
                    'authority': 'us.burberry.com',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'accept': 'application/json, text/plain, */*',
                    'x-atg-burberryid': this.burberryID,
                    'guest-id': this.guestID,
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                    'referer': 'https://us.burberry.com/checkout/shopping-bag/',
                    'accept-language': 'en-US,en;q=0.9',
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                this.items = body.data.items;
                if(!this.items[0].itemAvailabilityInfo.purchasable)
                    reject({ message: 'Product OOS, Waiting For Restock (GC)', interval: this.delays.error, type: 'error' });
                else
                    resolve('submitEmail');
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Getting Checkout, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Getting Checkout, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Getting Checkout - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Getting Checkout, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Getting Checkout, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Getting Checkout (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    submitEmail(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', 'Submitting Email', 'submitting');

            let payload = JSON.stringify({
                "email": this.profile.getEmail(),
                "isFeatureEnabled": true
            });

            got.post('https://us.burberry.com/checkout-api/guest/validate-email?country=US&language=en', {
                body: payload,
                headers: {
                    'authority': 'us.burberry.com',
                    accept: 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    origin: 'https://us.burberry.com',
                    referer: 'https://us.burberry.com/checkout/shopping-bag/',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'x-atg-burberryid': this.burberryID,
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                if(!body.error)
                    resolve('submitCart');
                else 
                    reject({ message: 'Error Submitting Email - Invalid, Retrying', interval: this.delays.error, type: 'error' });
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Submitting Email, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Submitting Email, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Submitting Email - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Submitting Email, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Submitting Email, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Submitting Email (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    submitCart(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', 'Submitting Cart', 'submitting');

            let payload = JSON.stringify({
                "shoppingBag": {
                    "items": this.items,
                    "id": this.orderNumber,
                    "shipping": {}
                },
                "countryCode": this.profile.getCountry(),
                "locale": "en",
                "currency": "USD",
                "email": this.profile.getEmail(),
                "giftDetails": {
                    "enabled": false,
                    "message": ""
                },
                "shoprunnerToken": null,
                "burberryId": this.burberryID
            });

            got.post('https://us.burberry.com/checkout-api/carts?country=US&language=en', {
                body: payload,
                headers: {
                    'authority': 'us.burberry.com',
                    accept: 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    authorization: `Bearer ${this.ciamToken}`,
                    'content-type': 'application/json',
                    origin: 'https://us.burberry.com',
                    referer: 'https://us.burberry.com/checkout/shipping',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'x-atg-burberryid': this.burberryID,
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                this.cartID = body.data.id;
                this.anonymousID = body.data.anonymousId;
                this.shippingCartVersion = body.data.version;
                resolve('submitShipping');
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Submitting Cart, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Submitting Cart, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Submitting Cart - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Submitting Cart, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Submitting Cart, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Submitting Cart (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    submitShipping(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Submitting Shipping`, 'submitting');

            let payload = JSON.stringify({
                "address": {
                    "title": "Mr",
                    "firstName": this.profile.getFirstName(),
                    "lastName": this.profile.getLastName(),
                    "phone": this.profile.getPhone(),
                    "streetName": this.profile.getAddress1(),
                    "addressLine2": this.profile.getAddress2(),
                    "city": this.profile.getCity(),
                    "state": {
                        "value": this.profile.getState(),
                        "label": getState(this.profile.getState())
                    },
                    "postalCode": this.profile.getZipcode(),
                    "country": this.profile.getCountry()
                },
                "cartId": this.cartID,
                "cartVersion": this.shippingCartVersion
            });

            got.put('https://us.burberry.com/checkout-api/carts/shipping-address?country=US&language=en', {
                body: payload,
                headers: {
                    'authority': 'us.burberry.com',
                    accept: 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    authorization: `Bearer ${this.ciamToken}`,
                    'content-type': 'application/json',
                    origin: 'https://us.burberry.com',
                    referer: 'https://us.burberry.com/checkout/shipping',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'x-atg-burberryid': this.burberryID,
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                this.deliveryCartVersion = body.data.version;
                resolve('getDelivery');
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Submitting Shipping, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Submitting Shipping, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Getting Submitting Shipping - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Submitting Shipping, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Submitting Shipping, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Submitting Shipping (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    getDelivery(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Getting Delivery Option`, 'submitting');

            got(`https://us.burberry.com/checkout-api/delivery-options?cartId=${this.cartID}&countryCode=US&country=US&language=en`, {
                headers: {
                    'authority': 'us.burberry.com',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'accept': 'application/json, text/plain, */*',
                    'x-atg-burberryid': this.burberryID,
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                    'referer': 'https://us.burberry.com/checkout/shipping',
                    'accept-language': 'en-US,en;q=0.9', 
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                if(body.data.options[0].unavailableItems.length != 0)
                    reject({ message: 'Product OOS, Waiting For Restock (GD)', interval: this.delays.error, type: 'error' });
                else {
                    this.shippingOption = body.data.options[0];
                    resolve('submitDelivery');
                };
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Getting Delivery Option, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Getting Delivery Option, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Getting Delivery Option - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Getting Delivery Option, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Getting Delivery Option, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Getting Delivery Option (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    submitDelivery(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Submitting Delivery Option`, 'submitting');

            let payload = JSON.stringify({
                "shippingOption": this.shippingOption,
                "version": this.deliveryCartVersion,
                "cartId": this.cartID,
                "setSalesChannel": false
            });

            got.post('https://us.burberry.com/checkout-api/carts/shipping-option-and-gift?country=US&language=en', {
                body: payload,
                headers: {
                    'authority': 'us.burberry.com',
                    accept: 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    authorization: `Bearer ${this.ciamToken}`,
                    'content-type': 'application/json',
                    origin: 'https://us.burberry.com',
                    referer: 'https://us.burberry.com/checkout/shipping',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'x-atg-burberryid': this.burberryID,
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                this.cartLineItems = body.data.lineItems;
                this.checkoutCartVersion = body.data.version;
                this.centAmount = body.data.taxedPrice.totalGross.centAmount;
                resolve('submitCheckout');
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Submitting Delivery Option, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Submitting Delivery Option, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Submitting Delivery Option - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Submitting Delivery Option, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Submitting Delivery Option, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Submitting Delivery Option (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    submitCheckout(){
        return new Promise((resolve, reject) => {
            status(this.id, 'normal', `Submitting Checkout`, 'processing');

            let payload = JSON.stringify({
                "paymentMethod": {
                    "type": "scheme",
                    "holderName": this.profile.getCardHolder(),
                    "encryptedCardNumber": encryptCardNumber(this.profile.getCardHolder(), this.profile.getCardNumber()),
                    "encryptedExpiryMonth": encryptCardMonth(this.profile.getCardHolder(), this.profile.getCardMonth()),
                    "encryptedExpiryYear": encryptCardYear(this.profile.getCardHolder(), this.profile.getCardYear()),
                    "encryptedSecurityCode": encryptCardCVV(this.profile.getCardHolder(), this.profile.getCardCVV()),
                    "brand": "visa"
                },
                "browserInfo": {
                    "acceptHeader": "*/*",
                    "colorDepth": 30,
                    "language": "en-US",
                    "javaEnabled": false,
                    "screenHeight": 900,
                    "screenWidth": 1440,
                    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36",
                    "timeZoneOffset": 300
                },
                "cartId": this.cartID,
                "cartVersion": this.checkoutCartVersion,
                "cartLineItems": this.cartLineItems,
                "anonymousId": this.anonymousID,
                "billingAddress": {
                    "title": "Mr",
                    "firstName": this.profile.getFirstName(),
                    "lastName": this.profile.getLastName(),
                    "phone": this.profile.getPhone(),
                    "streetName": this.profile.getAddress1(),
                    "addressLine2": this.profile.getAddress2(),
                    "city": this.profile.getCity(),
                    "state": {
                        "value": this.profile.getState(),
                        "label": getState(this.profile.getState())
                    },
                    "postalCode": this.profile.getZipcode(),
                    "useAsBilling": true,
                    "country": this.profile.getCountry(),
                    "stateLocalised": getState(this.profile.getState())
                },
                "payment": {
                    "centAmount": this.centAmount,
                    "currencyCode": "USD",
                    "interface": "Adyen",
                    "method": "creditCard",
                    "language": "en",
                    "localizedPaymentMethod": "Credit Card",
                    "storePaymentMethod": false
                },
                "giftCards": [],
                "email": this.profile.getEmail(),
                "error": {
                    "errorReason": "",
                    "step": null,
                    "type": null,
                    "orderId": null,
                    "orderVersion": null,
                    "cartId": null,
                    "cartVersion": null,
                    "additionalDetailsError": {
                        "isApiError": false,
                        "errorReason": ""
                    },
                    "message": "",
                    "shouldReplicate": false
                },
                "language": "en",
                "isEmailOrBillingAddressChanged": false,
                "shouldUpdatePaymentDetails": true,
                "marketingPreferences": false,
                "shippingAddress": null,
                "deliveryKey": this.shippingOption.deliveryKey,
                "countryCode": this.profile.getCountry()
            });

            got.post('https://us.burberry.com/checkout-api/submit-payment?country=US&language=en', {
                body: payload,
                headers: {
                    authority: 'us.burberry.com',
                    accept: 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    authorization: `Bearer ${this.ciamToken}`,
                    'content-type': 'application/json',
                    origin: 'https://us.burberry.com',
                    referer: 'https://us.burberry.com/checkout/review-and-pay',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
                    'x-atg-burberryid': this.burberryID,
                },
                agent: this.httpAgent,
                cookieJar: this.cookieJar,
                responseType: 'json'
            })
            .then(({ body }) => {
                console.log(body);
            })
            .catch(({ response }) => {
                if(!response || response == undefined)
                    reject({ message: `Request Error Submitting Checkout, Retrying`, interval: this.delays.error, type: 'error' });
                else {
                    let statusCode = response.statusCode;

                    switch(true){
                        case statusCode == 400: {
                            let reason = response.body.details.message;
                            terminal.subCart();
                            terminal.addFailed();
                            webhooks.failed(reason, this.id, this.input, 'Burberry US', 'Normal', this.product, this.profile.getProfileName(), this.proxy);
                            status(this.id, 'normal', `Checkout Failed - ${reason}`, 'failed');
                            reject({ message: 'Stop' });
                            break;
                        };
                        case statusCode >= 300 && statusCode <= 399:
                        case statusCode >= 401 && statusCode <= 403: {
                            this.rotateProxy();
                            reject({ message: 'Proxy Banned Submitting Checkout, Rotating Proxy', interval: this.delays.error, type: 'error'});
                            break;
                        };
                        case statusCode == 404:
                            reject({ message: 'Error Submitting Checkout - Page Not Found, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode == 429:
                            reject({ message: 'Rate Limited Submitting Checkout, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        case statusCode >= 500 && statusCode <= 599: 
                            reject({ message: 'Server Error Submitting Checkout, Retrying', interval: this.delays.error, type: 'error'});
                            break;
                        default: {
                            reject({ message: `Unknown Error Submitting Checkout (${statusCode}), Retrying`, interval: this.delays.error, type: 'error' });
                            break;
                        };
                    };
                };
            });
        });
    };

    stop(){
        terminal.subTask();
        status(this.id, 'normal', 'Task Stopped', 'error');
    };
};

module.exports = Normal;