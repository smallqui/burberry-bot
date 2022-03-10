const chalk = require('chalk');

const captcha = chalk.hex('#526B92');

const status = (id, site, mode, message, type) => {
    const date = new Date();
    const time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    
    let color;

    switch(type){
        case 'captcha':
            color = '#526B92';
            break;
        case 'queued':
            color = '#FFFF00';
            break;
        case 'monitor':
            color = '#00008B';
            break;
        case 'precheckout':
            color = '#00FFFF';
            break;
        case 'submitting':
            color = '#800080';
            break;
        case 'processing':
            color = '#FF8800';
            break;
        case 'success':
            color = '#00FF00';
            break;
        case 'failed':
            color = '#EE4B2B';
            break;
        case 'error':
            color = '#FF0000'
            break;
    };

    console.log(chalk.yellow(`[${time}][${id}][${site}][${mode}] `) + chalk.hex(color)(message));
};

module.exports = { status };