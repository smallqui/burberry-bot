const path = require('path');
const webhooks = require('../config.json')[0].webhooks;
const { WebhookClient, MessageEmbed } = require('discord.js');


const logo = 'https://colourlex.com/wp-content/uploads/2021/02/vine-black-painted-swatch.jpg';

class Webhooks {
    getWebhookClientData(webhook){
        const webhookSplit = webhook.replace(/\/\s*$/,'').split('/');
        return {
            id: webhookSplit[5],
            token: webhookSplit[6]
        };
    };
    testWebhook(){
        if(!webhooks.success)
            return null;
        else {
            try{
                const webhookClient = new WebhookClient(this.getWebhookClientData(webhooks.success));
                const embed = new MessageEmbed();
                
                embed.setTitle('Test Webhook Sent :bell:')
                .setColor(789015)
                .setFooter(`Burberrybot`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Burberrybot",
                    avatarURL: logo,
                    embeds: [embed],
                });
            }
            catch(error){
                return null
            };
        };
    };
    cart(id, sku, site, mode, product, profile){
        if(!webhooks.sendCart || !webhooks.cart)
            return null;
        else {
            try{
                const webhookClient = new WebhookClient(this.getWebhookClientData(webhooks.cart));
                const embed = new MessageEmbed();
                
                embed.setTitle(`Product Carted :rocket:`)
                .setDescription(`**[${product.name}](${product.url})**`)
                .addField('Site', site, false)
                .addField('Query', sku, true)
                .addField('Mode', mode, true)
                .addField('Size', product.size, true)
                .addField('Price', product.price, true)
                .addField('Task ID', `||${id}||`, true)
                .addField('Profile', `||${profile}||`, true)
                .setThumbnail(product.image)
                .setColor(789015)
                .setFooter(`Burberrybot`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Burberrybot",
                    avatarURL: logo,
                    embeds: [embed],
                });
            }
            catch(error){
                return null;
            };
        };
    };
    success(id, sku, site, mode, product, profile, proxy){
        if(!webhooks.success)
            return null;
        else {
            try{
                const webhookClient = new WebhookClient(this.getWebhookClientData(webhooks.success));
                const embed = new MessageEmbed();
                
                embed.setTitle('Checkout Successful 🎉')
                .setDescription(`**[${product.name}](${product.url})**`)
                .addField('Order Number', orderNumber, false)
                .addField('Site', site, false)
                .addField('Query', sku, true)
                .addField('Mode', mode, true)
                .addField('Size', product.size, true)
                .addField('Price', product.price, true)
                .addField('Task ID', `||${id}||`, true)
                .addField('Profile', `||${profile}||`, true)
                .addField('Proxy IP', `||${proxy}||`, true)
                .setThumbnail(product.image)
                .setColor(5034907)
                .setFooter(`Burberrybot`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Burberrybot",
                    avatarURL: logo,
                    embeds: [embed],
                });
            }
            catch(error){
                return null;
            };
        };
    };
    failed(reason, id, sku, site, mode, product, profile, proxy){
        if(!webhooks.sendFailed || !webhooks.failed)
            return null;
        else {
            try{
                const webhookClient = new WebhookClient(this.getWebhookClientData(webhooks.failed));
                const embed = new MessageEmbed();
                
                embed.setTitle('Checkout Failed :japanese_goblin:')
                .setDescription(`**[${product.name}](${product.url})**`)
                .addField('Reason', reason, false)
                .addField('Site', site, false)
                .addField('Query', sku, true)
                .addField('Mode', mode, true)
                .addField('Size', product.size, true)
                .addField('Price', product.price, true)
                .addField('Task ID', `||${id}||`, true)
                .addField('Profile', `||${profile}||`, true)
                .addField('Proxy IP', `||${proxy}||`, true)
                .setThumbnail(product.image)
                .setColor(14298951)
                .setFooter(`Burberrybot`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Burberrybot",
                    avatarURL: logo,
                    embeds: [embed],
                });
            }
            catch(error){
                return null;
            };
        };
    };
};

module.exports = Webhooks;