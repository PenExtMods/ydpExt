
// build.js

// MIT License Copyright (c) 2023 Wxp

// here we build the built-in exts

import * as fs from "node:fs";
import * as child from "node:child_process";

const rootPath = (()=>{var t = process.argv[1].split('/');t.pop();return t.join('/');})();

var builtInList = [];

if (!fs.existsSync('./ext/built-in')){
    console.warn('[warn] path "./ext/built-in" not existed.');
}else{
    builtInList = fs.readdirSync('./ext/built-in');
}

function main(){
    console.log('[info] start to build main.');
    console.log('[info] removing old building.');
    if (fs.existsSync('./build')){
        fs.rmSync('./build',{recursive:true});
    }
    fs.mkdirSync('./build',{recursive:true});
    console.log('[info] building ydpExt.');
    try{
        child.execSync('npx tsc');
    }catch(e){
        console.error(`[error] failed to build ydpExt.`);
        //console.log(Object.keys(e));
        if (Buffer.isBuffer(e.stdout)){
            console.log('[error] here are the stdout. ');
            console.log(e.stdout.toString());
        }
        if (Buffer.isBuffer(e.stderr)){
            console.log('[error] here are the stderr. ');
            console.log(e.stderr.toString());
        }
        console.log('[error] here the raw error object. ');
        console.log(e);

        console.error('[info] build failed. ');
        process.exit(-1);
    }
    fs.mkdirSync('./build/node_modules',{recursive:true});
    fs.cpSync(`./package.json`,`./build/package.json`,{force:true});
    fs.cpSync(`./LICENSE`,`./build/LICENSE`,{force:true});
    fs.cpSync(`./node_modules/ws`,`./build/node_modules/ws`,{recursive:true,force:true});
    console.log('[info] start to build the built-in exts.');
    fs.mkdirSync('./build/ext',{recursive:true});
    for (let i=0;i<builtInList.length;i++){
        console.log(`[info] building built-in ext "${builtInList[i]}".`);
        if (!fs.existsSync(`./ext/built-in/${builtInList[i]}/build.sh`)){
            fs.cpSync(`./ext/built-in/${builtInList[i]}`,`./build/ext/${builtInList[i]}`,{recursive:true,force:true});
            continue;
        }
        try{
            child.execSync(`./build.sh`,{cwd:`./ext/built-in/${builtInList[i]}`});
            fs.cpSync(`./ext/built-in/${builtInList[i]}/build`,`./build/ext/${builtInList[i]}`,{recursive:true,force:true});
        }catch(e){
            console.error(`[error] failed to build the built-in ext "${builtInList[i]}" .`);
            if (Buffer.isBuffer(e.stdout)){
                console.log('[error] here are the stdout. ');
                console.log(e.stdout.toString());
            }
            if (Buffer.isBuffer(e.stderr)){
                console.log('[error] here are the stderr. ');
                console.log(e.stderr.toString());
            }
            console.log('[error] here the raw error object. ');
            console.log(e);

            console.error('[info] build failed. ');
            process.exit(-1);
        }
    }
    console.log('[info] built main.');
}

main();