const path = require('path');
const webhooks = require('../config.json')[0].webhooks;
const { WebhookClient, MessageEmbed } = require('discord.js');


const logo = 'https://images-platform.99static.com/v5LBqfmCbHQLkvIuBXuZwnA7YY4=/64x76:657x669/500x500/top/smart/99designs-contests-attachments/86/86429/attachment_86429847';

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
                .setFooter(`Bonsai (demo)`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Bonsai",
                    avatarURL: logo,
                    embeds: [embed],
                });
            }
            catch(error){
                return null
            };
        };
    };
    footsCart(id, sku, site, mode, product, profile){
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
                .setFooter(`Bonsai (demo)`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Bonsai",
                    avatarURL: logo,
                    embeds: [embed],
                });
            }
            catch(error){
                return null;
            };
        };
    };
    footsSuccess(id, sku, site, mode, product, profile, proxy){
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
                .setFooter(`Bonsai (demo)`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Bonsai",
                    avatarURL: logo,
                    embeds: [embed],
                });
            }
            catch(error){
                console.log(error);
            };
        };
    };
    footsFailed(reason, id, sku, site, mode, product, profile, proxy){
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
                .setFooter(`Bonsai (demo)`, logo)
                .setTimestamp(new Date());
        
                webhookClient.send({
                    username: "Bonsai",
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