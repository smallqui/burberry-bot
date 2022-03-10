const Terminal = require('./lib/terminal');
const { startTasks } = require('./src/tasks');
const { setProxyList } = require('./lib/proxy');
const chalk = require('chalk');

const readline = require('readline');
const Webhooks = require('./lib/webhooks');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const header = () => {
    console.log(chalk.yellow(`
    ******                  **                                    **                 **  
   /*////**                /**                            **   **/**                /**  
   /*   /**  **   ** ******/**       *****  ****** ******//** ** /**       ******  ******
   /******  /**  /**//**//*/******  **///**//**//*//**//* //***  /******  **////**///**/ 
   /*//// **/**  /** /** / /**///**/******* /** /  /** /   /**   /**///**/**   /**  /**  
   /*    /**/**  /** /**   /**  /**/**////  /**    /**     **    /**  /**/**   /**  /**  
   /******* //******/***   /****** //******/***   /***    **     /****** //******   //** 
   ///////   ////// ///    /////    ////// ///    ///    //      /////    //////     //  
   `));
    console.log(chalk.yellow(`burberrybot - written by https://github.com/B75571`));
    console.log(chalk.yellow('1 - start tasks\n2 - test webhook\n3 - exit'));
};

const menu = () => {
    rl.question(chalk.yellow('choose an option: '), async option => {
        switch(true){
            case option == 1:
                terminal.set();
                await setProxyList();
                await startTasks();
                break;
            case option == 2: {
                console.log(chalk.yellow(`webhook sent`));
                webhooks.testWebhook();
                menu();
                break;
            };
            case option == 3:
                process.exit(0);
            default:
                menu();
                break;
        };
    });
};

const terminal = new Terminal;
const webhooks = new Webhooks;
terminal.idle();
header();
menu();