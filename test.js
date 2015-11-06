/* jshint strict: false */

var exec = require('child_process').exec;

var queue = require('./queue.js');


queue.setLimit(5);

//Start copying
for (var i = 0; i < 4; i++) {
    queue.addToQueue({
        command: '',
        changedFile: "changedFile",
        targetPath:  "target"
    });
}

setTimeout(function(){
    //Notice queue full, stop copying
    for (var i = 0; i < 6; i++) {
        queue.addToQueue({
            command: '',
            changedFile: "changedFile",
            targetPath:  "target"
        });
    }

    setTimeout(function(){
        //Copy after some time again
        queue.addToQueue({
            command: '',
            changedFile: "changedFile",
            targetPath:  "target"
        });
    }, 6000);

}, 500);