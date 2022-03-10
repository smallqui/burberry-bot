const Normal = require('./normal');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const directory = path.join(__dirname, '../');

const startTasks = async () => {
    const tasks = new Array();
    fs.createReadStream(directory + 'tasks.csv')
    .pipe(csv())
    .on('data', (data) => {

        const json = {
            taskCount: data.taskCount,
            taskDetails: {
                input: data.input.split(','),
                size: data.size.split(','),
                quantity: data.quantity,
                site: data.site,
                mode: data.mode,
                captcha: data.captcha,
                shippingRate: data.shippingRate,
            },
            delays: {
                monitor: data.monitorDelay,
                error: data.errorDelay,
            },
            profile: {
                profileName: data.profileName,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phoneNumber,
                billing: {
                    cardHolder: `${data.firstName} ${data.lastName}`,
                    cardNumber: data.cardNumber,
                    cardMonth: data.cardMonth,
                    cardYear: data.cardYear,
                    cardCVV: data.cardCVV,
                },
                shipping: {
                    address1: data.address1,
                    address2: data.address2,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    zipcode: data.zipcode,
                },
            },
        };

        tasks.push(json);
    })
    .on('end', () => {
        tasks.forEach(task => {
            for(let i = 0; i < task.taskCount; i++){
                switch(task.taskDetails.mode){
                    case 'normal':
                        new Normal(task.taskDetails, task.profile, task.delays).start();
                };
            };
        });
    });
};

module.exports = { startTasks };