#!/usr/bin/env node

/* jshint undef: true, unused: true, loopfunc: true, node: true, strict: false */

var nodepath = require('path');
var exec = require('child_process').exec;
var util = require('util');
var queue = require('./queue.js');
var chokidar = require('chokidar');
var argv = require('yargs')
    .usage('Watch and copy files with scp')
    .demand('source')
    .alias('s', 'source')
    .describe('s', 'path to source folder')
    .demand('target')
    .alias('t', 'target')
    .describe('t', 'path to target machine and folder hostname:/oh/em/gee')
    .default('ql', 20)
    .alias('ql', 'queuelimit')
    .describe('ql', 'the maximum entries, which should be handled by queue')
    .string('target')
    .string('source')
    .example('node watch -s /somefolder/ -t hostname:/mkay/sometarget/')
    .argv;

var source = argv.source;
var target = argv.target;

console.log("target:"+target);
console.log("source:"+source);

function watch(path, rootPath, onChange) {
    // ignores .dotfiles
    chokidar.watch(path, {ignored: /[\/\\]\./}).on('change', function(path) {
        if (path) {
            // var subPath = replaceString(source, "", path);
            // var completeSubPath = subPath + "/" + filename;
            // completeSubPath = nodepath.normalize(completeSubPath);
            // console.log("chokidar:"+);
            var relPath = path.replace(rootPath, "");
            onChange(relPath);
        }
    })
    .on('ready', function() { 
        util.log('\033[94m Initial scan complete. Ready for changes.\033[0m');
    });


}

watch(source, source, function(changedFile) {
    "use strict";
    var completeSourcePath = source + changedFile;
    var completeTargetPath = target + changedFile;
    completeSourcePath = nodepath.normalize(completeSourcePath);
    completeTargetPath = nodepath.normalize(completeTargetPath);

    // copy(completeSourcePath, completeTargetPath, changedFile);

    queue.addToQueue({
        command: 'scp ' + completeSourcePath + ' ' + completeTargetPath,
        changedFile: changedFile,
        targetPath:  completeTargetPath,
        sourcePath:  completeSourcePath,
        onFinish: 'osascript ShowNotification.scpt "Copied ' + changedFile + '"'
    });

});



function copy(sourcePath, targetPath, changedFile) {

    util.log("start copying from " + sourcePath + " to " + targetPath);

    exec('scp ' + sourcePath + ' ' + targetPath,
        function(error, stdout, stderr) {
            if (stdout) util.log('stdout: ' + stdout);
            if (stderr) util.log('stderr: ' + stderr);

            var message = '"Copied ' + changedFile + ' to  '+targetPath+' "';

            if (error !== null) {
                util.log('exec error: ' + error);
                message = '"OMG not copied '+ changedFile + ' Error:' + error+'"';
            }

            console.log(message);

            exec('osascript ShowNotification.scpt  '+message,
                function(error, stdout, stderr) {
                    if (stdout) util.log('stdout: ' + stdout);
                    if (stderr) util.log('stderr: ' + stderr);
                    if (error !== null) {
                        util.log('exec error: ' + error);
                    }
                });

        });

}
