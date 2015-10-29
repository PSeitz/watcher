#!/usr/bin/env node

/* jshint undef: true, unused: true, loopfunc: true, node: true, strict: false */

var nodepath = require('path');
var exec = require('child_process').exec;
var util = require('util');
var chokidar = require('chokidar');
var argv = require('yargs')
    .usage('Watch and copy files with scp')
    .demand('source')
    .alias('s', 'source')
    .describe('s', 'path to source folder')
    .demand('target')
    .alias('t', 'target')
    .describe('t', 'path to target machine and folder hostname:/oh/em/gee')
    .string('target')
    .string('source')
    .example('node watch -s /somefolder/ -t hostname:/mkay/sometarget/')
    .argv;

var source = argv.source;
var target = argv.target;

console.log("target:"+target);
console.log("source:"+source);

function watch(path, rootPath, onChange) {
    chokidar.watch(path, {ignored: /[\/\\]\./}).on('change', function(path) {
        if (path) {
            // var subPath = replaceString(source, "", path);
            // var completeSubPath = subPath + "/" + filename;
            // completeSubPath = nodepath.normalize(completeSubPath);
            // console.log("chokidar:"+);
            var relPath = path.replace(rootPath, "");
            onChange(relPath);
        }
    });

}

watch(source, source, function(changedFile) {
    "use strict";
    var completeSourcePath = source + changedFile;
    var completeTargetPath = target + changedFile;
    completeSourcePath = nodepath.normalize(completeSourcePath);
    completeTargetPath = nodepath.normalize(completeTargetPath);

    copy(completeSourcePath, completeTargetPath, changedFile);
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
