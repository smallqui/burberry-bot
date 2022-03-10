const fs = require('fs');
const path = require('path');

let proxyList = new Array();

const setProxyList = async () => {
    const proxyLocation = path.resolve(__dirname, `../proxies.txt`);
    const proxies = fs.readFileSync(proxyLocation, 'utf-8');
    const list = proxies.toString().split('\n');
    proxyList = list;
};

const getProxy = () => {
    return proxyList[Math.floor(Math.random() * proxyList.length)];
};

const getAgent = (proxy) => {
    if(proxy){
        const proxyCredentials = proxy.split(':');
        return `http://${proxyCredentials[2]}:${proxyCredentials[3]}@${proxyCredentials[0]}:${proxyCredentials[1]}`;
    }
    else 
        return null;
};

module.exports = { setProxyList, getProxy, getAgent };