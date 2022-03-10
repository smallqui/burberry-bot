const terminal = require('set-terminal-title');

let carts = 0;
let checkouts = 0;
let failed = 0;
let tasks = 0;

class Terminal {
    idle(){
        terminal(`burberrybot  |  idling`, { verbose: false });
    };
    set(){
        terminal(`burberrybot  |  ${tasks} running task(s)  |  ${carts} carted  |  ${checkouts} checkout(s)  |  ${failed} failed `, { verbose: false });
    };
    addTask(){
        tasks++;
        this.set();
    };
    subTask(){
        tasks--;
        this.set()
    };
    addCart(){
        carts++;
        this.set();
    };
    subCart(){
        carts--;
        this.set();
    };
    addCheckouts(){
        checkouts++;
        this.set();
    };
    subCheckouts(){
        checkouts--;
        this.set();
    };
    addFailed(){
        failed++;
        this.set();
    };
    subFailed(){
        failed--;
        this.set();
    };
};

module.exports = Terminal;