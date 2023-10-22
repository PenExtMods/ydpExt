
// init.js

// MIT License Copyright (c) 2023 Wxp

// here we init the built-in exts


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
    console.log('[info] start to init the built-in exts.');
    for (let i=0;i<builtInList.length;i++){
        if (fs.existsSync(`./ext/built-in/${builtInList[i]}/init.sh`)){
            console.log(`[info] initing built-in ext "${builtInList[i]}".`);
            try{
                child.execSync(`./init.sh`,{cwd:`./ext/built-in/${builtInList[i]}`});
            }catch(e){
                console.error(`[error] failed to init the built-in ext "${builtInList[i]}" .`);
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

                console.error('[info] init built-in exts failed. ');
                process.exit(-1);
            }
        }
    }
    console.log('[info] inited the built-in exts.');
}

main();