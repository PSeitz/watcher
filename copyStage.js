/* jshint strict: false */


var fs = require('fs');
var nodepath = require('path');
var exec = require('child_process').exec;
var util = require('util');

var queue = require('./queue.js');

var argv = require('yargs')
    .usage('Watch and copy files with scp')
    .demand('source')
    .alias('s', 'source')
    .describe('s', 'path to source folder')
    .demand('target')
    .alias('t', 'target')
    .describe('t', 'path to target folder hostname:/somefolder')
    .string('target')
    .string('source')
    .default('c', 1)
    .describe('c', 'last x commits')
    .default('ql', 100)
    .alias('ql', 'queuelimit')
    .describe('ql', 'the maximum entries, which should be handled by queue')
    .example('node watch -c 2 -s /somefolder/ -t hostname:/mkay/sometarget/')
    .check(function(argv){
        if (argv.target.indexOf(":") < 0) {
            console.log("Expecting hostname:/mkay/sometarget in target ");
            return false;
        }
        return true;
    })
    .argv;

var source = argv.source;
var target = argv.target;

var sshMachine = target.split(":")[0] + ":";
target = target.split(":")[1];

console.log("target:"+target);
console.log("source:"+source);

//git --no-pager diff --name-only HEAD~1

queue.setLimit(argv.ql);

var append = argv.c ? "HEAD~"+argv.c:"" ;

// console.log('git --no-pager diff --cached --name-only --diff-filter=MA ' + append);

function onFinish(message){
    exec('osascript ShowNotification.scpt "' + message + '"');  
}

function copyFileList(error, stdout, stderr){
        // if (stdout) util.log('stdout: ' + stdout);
        if (stderr) util.log('stderr: ' + stderr);
        if (error !== null) {
            util.log('exec error: ' + error);
        }

        var fileList = stdout.split("\n");
        for (var i = 0; i < fileList.length; i++) {
            var changedFile = fileList[i];
            if (changedFile === "") continue;
            // fileList[i]

            var completeTargetPath = sshMachine + target + changedFile;
            var completeSourcePath = source +"/" + changedFile;
            completeSourcePath = nodepath.normalize(completeSourcePath);
            completeTargetPath = nodepath.normalize(completeTargetPath);

            if(!fs.existsSync(completeSourcePath)) {
                continue;
            }
            queue.addToQueue({
                command: 'scp ' + completeSourcePath + ' ' + completeTargetPath,
                changedFile: changedFile,
                targetPath:  target + changedFile,
                onFinish: onFinish
            });
        }
}

exec('git --no-pager diff --cached --name-only --diff-filter=MA ' + append ,{ cwd: source }, copyFileList);
exec('git --no-pager diff --name-only --diff-filter=MA ' + append ,{ cwd: source }, copyFileList);
exec('git ls-files --others --exclude-standard ' + append ,{ cwd: source }, copyFileList);


