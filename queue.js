
/* jshint strict: false */
var exec = require('child_process').exec;
var util = require('util');
var nodepath = require('path');

var running = false;

var service = {};
service.limit = 100;
var queue = [];

var delayToWorkqueue;
var queueInterval;
var discardMode = false;

function onAfterDelay(){
    if (discardMode){
        util.log('discarding all entries');
        queue = [];
        discardMode = false;
        return;
    }
    startQueue();
}

function startDelayedQueue(queueFull){
    if (queueFull && !discardMode) {
        util.log('queue size too big. Stop Queue and wait...' );
        stopQueue();
        discardMode = true;
        startDelayedQueue();
        return;
    }

    if (delayToWorkqueue) clearTimeout(delayToWorkqueue);
    var timeout = discardMode ? 5000 : 450;
    delayToWorkqueue = setTimeout(onAfterDelay, timeout);
}

function addToQueue(entry){
    var queueFull = queue.length > service.limit;
    if (!queueFull) {
        queue.push(entry);
    }
    startDelayedQueue(queueFull);
}

function startQueue(){
    if (!running) workQueue();
}

function stopQueue(){
    if (queueInterval) clearInterval(queueInterval);
    running=false;
}

function workQueue(){
    "use strict";
    running = true;
    util.log('workQueue');
    if (queueInterval) clearInterval(queueInterval);
    queueInterval = setInterval(function(){
        var entry = queue.pop();
        if (queue.length === 0){
            stopQueue();
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

            if (entry.onFinish) exec(entry.onFinish);

        });
        

    }, 60);
}


function createDirectory(pathToFile, onFinish){
    var dirname  = nodepath.dirname(pathToFile);
    var command = "ssh z620 'mkdir -p "+dirname+"'";
    console.log(command);
    if (onFinish) exec(command, onFinish);
}

service.addToQueue = addToQueue;

service.setLimit = function(limit){
    service.limit = limit;
};

module.exports = service;



