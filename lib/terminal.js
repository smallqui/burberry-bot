const terminal = require('set-terminal-title');

let carts = 0;
let checkouts = 0;
let failed = 0;
let tasks = 0;
let queued = 0;

class Terminal {
    idle(){
        terminal(`bonsai cli - demo  |  idling`, { verbose: false });
    };
    set(){
        terminal(`bonsai cli - demo |  ${tasks} running task(s)  |  ${carts} carted  |  ${checkouts} checkout(s)  |  ${failed} failed `, { verbose: false });
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
    addQueued(){
        queued++;
        this.set();
    };
    subQueued(){
        queued--;
        this.set();
    };
};

module.exports = Terminal;