
/* jshint strict: false */
var exec = require('child_process').exec;
var util = require('util');
var nodepath = require('path');

var running = false;

var service = {};
service.limit = 100;
var queue = [];

var delayToWorkqueue;

function addToQueue(entry){
    if (queue.length <= service.limit) queue.push(entry);
    
    if (delayToWorkqueue) clearInterval(delayToWorkqueue);

    delayToWorkqueue = setTimeout(function () {
        if (queue.length > service.limit){
            util.log('queue size too big: ' + queue.length );
            util.log('discarding all entries');

            delayToWorkqueue = setTimeout(function () {
                queue = [];
            }, 2500);

            return;
        }
        startQueue();

    }, 450);

}

function startQueue(){
    if (!running) workQueue();
}

function workQueue(){
    "use strict";
    running = true;
    var queueInterval = setInterval(function(){
        var entry = queue.pop();
        if (queue.length === 0){
            clearInterval(queueInterval);
            running=false;
        }
        if (!entry) return;
        util.log("copying: " + entry.command);

        exec(entry.command,
        function(error, stdout, stderr) {
            if (stdout) util.log('stdout: ' + stdout);
            if (stderr) util.log('stderr: ' + stderr);
            if (error !== null) {
                util.log('exec error: ' + error);
                console.log("OMG not copied " +entry.changedFile);

                if (error.toString().indexOf("No such file or directory")>0) {
                    createDirectory(entry.targetPath, function(error, stdout, stderr) {
                        if (stdout) util.log('mkdir stdout: ' + stdout);
                        if (stderr) util.log('mkdir stderr: ' + stderr);
                        if (error !== null) {
                            queue.push(entry);
                            startQueue();
                        }
                        
                    });
                }
            }

            exec(entry.onFinish);

        });
        

    }, 60);
}


function createDirectory(pathToFile, onFinish){
    var dirname  = nodepath.dirname(pathToFile);
    var command = "ssh z620 'mkdir -p "+dirname+"'";
    console.log(command);
    exec(command, onFinish);
}

service.addToQueue = addToQueue;

service.setLimit = function(limit){
    service.limit = limit;
};

module.exports = service;



