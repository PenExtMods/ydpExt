
// ydpExt

// MIT License Copyright (c) 2023 Wxp

import { bing } from "./bing.js";
import * as bingServer from "./bingServer.js";
import { extType } from "./extType.js";
import * as random from "./random.js";
import * as fs from "node:fs";
import * as worker from "node:worker_threads";

if (worker.isMainThread) process.exit(-1);

var workerData = worker.workerData as extType.extMain.workerPayload;

//process.chdir(workerData.rootPath);

if (!fs.existsSync(`./ext/${workerData.applicationName}/index.${workerData.fileType}`)) {
    var e:extType.extMain.message.outcome.workerError = {
        type: 'error',
        id: random.randomUUID(),
        desc: `File "./ext/${workerData.applicationName}/index.${workerData.fileType}" is not existed.`,
        detail: null
    };
    worker.parentPort.emit("message",e);
    process.exit(-4);
}

var imported: extType.application.importedStruct;

try{
    // here does not work in js.
    imported = await import(`./ext/${workerData.applicationName}/index.${workerData.fileType}`) as extType.application.importedStruct;
}catch(e){
    var e: extType.extMain.message.outcome.workerError = {
        type: 'error',
        id: random.randomUUID(),
        desc: 'Error happen while loading application.',
        detail: e
    };
    worker.parentPort.emit("message",e);
    process.exit(-5);
}

var acb: extType.application.applicationControlBlock = {
    imported: imported,
    base: buildBase(imported),
    inited: false,
    switchOut: false,
    maxNum: -1,
    nowNum: 0,
    name: ''
};
acb.name = acb.base.applicationName;

function buildBase(imported:extType.application.importedStruct){
    console.log(`[extMain] building base for "${workerData.applicationName}".`);
    var out = {
        applicationName: workerData.applicationName,
        handle: {
            init: (...arg)=>{},
            exit: (...arg)=>{},
            input: (...arg)=>{},
            switchOut: (...arg)=>{},
            switchIn: (...arg)=>{}
        }
    }
    if (typeof imported.constructor == 'function'){
        console.log('[extMain] deteted lagacy constructor function, using it.');
        out = Object.assign(out,imported.constructor());
    }else{
        if (typeof imported.applicationName == 'string') out.applicationName = imported.applicationName;
        if (typeof imported.exit == 'function') out.handle.exit = imported.exit;
        if (typeof imported.init == 'function') out.handle.init = imported.init;
        if (typeof imported.switchIn == 'function') out.handle.switchIn = imported.switchIn;
        if (typeof imported.switchOut == 'function') out.handle.switchOut = imported.switchOut;
        if (typeof imported.input == 'function') out.handle.input = imported.input;
    }
    console.log('[extMain] base build done.');
    return out;
}

function handleCallDone(id:string){
    var m: extType.extMain.message.outcome.handleCallDone = {
        type: 'handleCallDone',
        id: id
    };
    worker.parentPort.postMessage(m);
}

worker.parentPort.on("message",async (v)=>{
    if (typeof v['type'] != 'string') return;
    switch (v.type){
        case 'updateApplictionControlBlock':{
            let nm: extType.extMain.message.outcome.updateApplictionControlBlock = {
                type: 'updateApplictionControlBlock',
                id: v.id,
                acb: {
                    inited: acb.inited,
                    switchOut: acb.switchOut,
                    maxNum: acb.maxNum,
                    name: acb.name,
                    nowNum: acb.nowNum
                }
            };
            worker.parentPort.postMessage(nm);
            break;
        }
        case 'handleCall':{
            let m = v as extType.extMain.message.income.handleCall;
            switch (m.name){
                case 'init':{
                    try{
                        await acb.base.handle.init(m.session,(text,suggestedResponse,nowNum,maxNum)=>{
                            acb.maxNum = maxNum;
                            acb.nowNum = nowNum;
                            let nm: extType.extMain.message.outcome.handleCb = {
                                type: 'handleCb',
                                id: m.id,
                                text: text,
                                suggestedResponse: suggestedResponse,
                                nowNum: nowNum,
                                maxNum: maxNum
                            };
                            worker.parentPort.postMessage(nm);
                            acb.inited = true;
                        });
                    }catch(e){
                        let em: extType.extMain.message.outcome.workerError = {
                            type: 'error',
                            id: m.id,
                            desc: `Error happened while calling the handle "${m.name}" of the application "${acb.name}".`,
                            detail: e
                        };
                        worker.parentPort.postMessage(em);
                        process.exit(-6);
                    }
                    acb.inited = true;
                    handleCallDone(m.id);
                    break;
                }
                case 'exit':{
                    try{
                        await acb.base.handle.exit(m.session,(text,suggestedResponse,nowNum,maxNum)=>{
                            acb.maxNum = maxNum;
                            acb.nowNum = nowNum;
                            let nm: extType.extMain.message.outcome.handleCb = {
                                type: 'handleCb',
                                id: m.id,
                                text: text,
                                suggestedResponse: suggestedResponse,
                                nowNum: nowNum,
                                maxNum: maxNum
                            };
                            worker.parentPort.postMessage(nm);
                        });
                    }catch(e){
                        let em: extType.extMain.message.outcome.workerError = {
                            type: 'error',
                            id: m.id,
                            desc: `Error happened while calling the handle "${m.name}" of the application "${acb.name}".`,
                            detail: e
                        };
                        worker.parentPort.postMessage(em);
                        process.exit(-6);
                    }
                    handleCallDone(m.id);
                    process.exit();
                    break;
                }
                case 'switchIn':{
                    try{
                        await acb.base.handle.switchIn(m.session,(text,suggestedResponse,nowNum,maxNum)=>{
                            acb.maxNum = maxNum;
                            acb.nowNum = nowNum;
                            let nm: extType.extMain.message.outcome.handleCb = {
                                type: 'handleCb',
                                id: m.id,
                                text: text,
                                suggestedResponse: suggestedResponse,
                                nowNum: nowNum,
                                maxNum: maxNum
                            };
                            worker.parentPort.postMessage(nm);
                            acb.switchOut = false;
                        });
                    }catch(e){
                        let em: extType.extMain.message.outcome.workerError = {
                            type: 'error',
                            id: m.id,
                            desc: `Error happened while calling the handle "${m.name}" of the application "${acb.name}".`,
                            detail: e
                        };
                        worker.parentPort.postMessage(em);
                        process.exit(-6);
                    }
                    handleCallDone(m.id);
                    break;
                }
                case 'switchOut':{
                    try{
                        await acb.base.handle.switchOut(m.session);
                        acb.switchOut = true;
                    }catch(e){
                        let em: extType.extMain.message.outcome.workerError = {
                            type: 'error',
                            id: m.id,
                            desc: `Error happened while calling the handle "${m.name}" of the application "${acb.name}".`,
                            detail: e
                        };
                        worker.parentPort.postMessage(em);
                        process.exit(-6);
                    }
                    handleCallDone(m.id);
                    break;
                }
                case 'input':{
                    let hold = false;
                    try{
                        await acb.base.handle.input(m.session,m.userMessage,(text,nowNum,maxNum,suggestedResponse)=>{
                            let nm: extType.extMain.message.outcome.handleUpdateCb = {
                                type: 'handleUpdateCb',
                                id: m.id,
                                text: text,
                                nowNum: nowNum,
                                maxNum: maxNum,
                                suggestedResponse: suggestedResponse
                            };
                            worker.parentPort.postMessage(nm);
                        },()=>{
                            let nm: extType.extMain.message.outcome.handleDoneCb = {
                                type: 'handleDoneCb',
                                id: m.id
                            };
                            worker.parentPort.postMessage(nm);
                        },()=>{
                            return new Promise((resolve,reject)=>{
                                let nm: extType.extMain.message.outcome.handleAliveCall = {
                                    type: 'handleAliveCall',
                                    id: m.id
                                };
                                let cb = (v)=>{
                                    if (typeof v['type'] != 'string' || v['id']!= nm.id){
                                        worker.parentPort.once('message',cb);
                                        return;
                                    }
                                    let m = v as extType.extMain.message.income.handleAliveCb;
                                    if (!(m.alive)) handleCallDone(m.id);
                                    resolve(m.alive);
                                    //worker.parentPort.off('message',cb);
                                };
                                worker.parentPort.once('message',cb);
                                worker.parentPort.postMessage(nm);
                            });
                        },()=>{
                            hold = true;
                        });
                    }catch(e){
                        let em: extType.extMain.message.outcome.workerError = {
                            type: 'error',
                            id: m.id,
                            desc: `Error happened while calling the handle "${m.name}" of the application "${acb.name}".`,
                            detail: e
                        };
                        worker.parentPort.postMessage(em);
                        process.exit(-6);
                    }
                    if (!hold) handleCallDone(m.id);
                    break;
                }
                default: {
                    break;
                }
            }
            break;
        }
    }
});

process.addListener("uncaughtException",(e,o)=>{
    var em: extType.extMain.message.outcome.workerError = {
        type: 'error',
        id: random.randomUUID(),
        desc: 'uncaughtException in worker',
        detail: {
            err: e,
            origin: o
        }
    };
    worker.parentPort.postMessage(em);
    process.exit(-2);
});

process.addListener('unhandledRejection',(r,p)=>{
    var em: extType.extMain.message.outcome.workerError = {
        type: 'error',
        desc: 'unhandledRejection in worker',
        id: random.randomUUID(),
        detail: {
            err: r
        }
    };
    worker.parentPort.postMessage(em);
    process.exit(-3);
});

