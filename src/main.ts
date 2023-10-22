
// ydpExt

// MIT License Copyright (c) 2023 Wxp

import { bing } from "./bing.js";
import * as bingServer from "./bingServer.js";
import { extType } from "./extType.js";
import * as random from "./random.js";
import * as fs from "node:fs";
import * as worker from "node:worker_threads";
import * as child from "node:child_process";
import * as logServer from "./logServer.js";
import * as os from "node:os";
import * as fallbackServer from "./fallbackServer.js";

const fileType = process.argv[1].split('.').pop();
const rootPath = (()=>{var t = process.argv[1].split('/');t.pop();return t.join('/');})();
process.chdir(rootPath);

const mainAppName = 'youdaoExt';
const mainAppVersion = [1,0,0];
const isPreRelease = false;

const bannedApplicationName = [
    '金字塔是如何建成的？',
    '为什么人类需要睡眠？',
    '一年有多少个小时？',
    '如何制作蛋糕？',
    '全息投影的工作原理是什么？',
    '给我看鼓舞人心的名言',
    '我想学习一项新技能',
    '教我一个新单词',
    '火烈鸟为何为粉色？',
    '向我展示食谱',
    '教我关于登月的信息',
    '让我大笑',
    '有什么新闻？',
    '宇宙的起源',
    '世界上最小的哺乳动物是什么？',
    '给我列出今晚晚餐的购物清单',
    '给我说个笑话',
    '天气如何？',
    '如何创建预算？',
    '如何设定可实现的目标？',
    '最深的海洋是哪个？',
    '给雷雨写一封情书',
    '问我一个你想问的问题',
    '寻找非虚构作品',
    '我需要有关家庭作业的帮助',
    '以海盗的口吻写一首关于外太空鳄鱼的俳句'
];

var logServerAddr = '127.0.0.1';
var logServerPort = 12345;
var serverAddr = '127.0.0.2';
var signatureServerPort = 9988;
var chathubServerPort = 9989;
var fallbackSignatureServerPort = 8988;
var fallbackChathubServerPort = 8989;

var fallbackSignatureServerUrl = 'https://www.bing.com/turing/conversation/create';
var fallbackChathubServerUrl = 'wss://sydney.bing.com/sydney/ChatHub';



console.log(`[version] youdaoExtBingServer version ${mainAppVersion[0]}.${mainAppVersion[1]}.${mainAppVersion[2]}${isPreRelease?' [PreRelease] ':''} .`);
console.log('[copyright] this project is developed by Wxp, MIT License Copyright (c) 2023 Wxp');
console.log('[repo] you can find this project at "https://github.com/DSFdsfWxp/ydpExt".');
console.log(`[platform] running on "${os.arch()}","${os.platform()}".`);
console.log(`[nodejs] current nodejs version is "${process.version}".`);

if (typeof process.env['ydpSysRootPath'] != 'string'){
    console.error('[path][err] the environment var "ydpSysRootPath" is not set! ');
    console.log('[info] failed to init. ');
    process.exit(-1);
}
if (typeof process.env['mtpPath'] != 'string'){
    console.error('[path][err] the environment var "mtpPath" is not set! ');
    console.log('[info] failed to init. ');
    process.exit(-1);
}

console.log(`[path] current working path is "${rootPath}". `);
console.log(`[env] current ydpSysRootPath is "${process.env['ydpSysRootPath']}". `);
console.log(`[env] current mtpPath is "${process.env['mtpPath']}". `);
console.log('[config] loading config...');


if (fs.existsSync('./config.json')){
    var raw = fs.readFileSync('./config.json').toString();
    var obj = {};
    try{
        obj = JSON.parse(raw);
        if (typeof obj['logServerAddr'] == 'string') logServerAddr = obj['logServerAddr'];
        if (typeof obj['logServerPort'] == 'number') logServerPort = obj['logServerPort'];
        if (typeof obj['serverAddr'] == 'string') serverAddr = obj['serverAddr'];
        if (typeof obj['signatureServerPort'] == 'number') signatureServerPort = obj['signatureServerPort'];
        if (typeof obj['chathubServerPort'] == 'number') chathubServerPort = obj['chathubServerPort'];
        if (typeof obj['fallbackSignatureServerPort'] == 'number') fallbackSignatureServerPort = obj['fallbackSignatureServerPort'];
        if (typeof obj['fallbackChathubServerPort'] == 'number') fallbackChathubServerPort = obj['fallbackChathubServerPort'];
    }catch(e){
        console.warn('[config][warn] parse config file "./config.json" failed, using default config. ','\n',e);
    }
}else{
    console.warn('[config][warn] "./config.json" not existed, using default config. ');
}

if (fs.existsSync(`${process.env['mtpPath']}/bing-url.json`)){
    var raw = fs.readFileSync(`${process.env['mtpPath']}/bing-url.json`).toString();
    var obj = {};
    try{
        obj = JSON.parse(raw);
        if (typeof obj['signature'] == 'string') fallbackSignatureServerUrl = obj['signature'];
        if (typeof obj['chathub'] == 'string') fallbackChathubServerUrl = obj['chathub'];
    }catch(e){
        console.warn(`[config][warn] parse config file "${process.env['mtpPath']}/bing-url.json" failed, using default config. `,'\n',e);
    }
}else{
    console.warn(`[config][warn] "${process.env['mtpPath']}/bing-url.json" not existed, using default config. `);
}

console.log('[config] loaded config. ');
console.log(`[fallback] current fallback bing signatue create url is "${fallbackSignatureServerUrl}". `);
console.log(`[fallback] current fallback bing chathub url is "${fallbackChathubServerUrl}". `);
console.log("[info] starting...");
console.log('[info] ');


function checkStartUp(){
    if (fallbackserver.isListening() && logServer.isListening() && server.isListening()){
        console.log('[info] started.');
        console.log('[info] ');
        updateAppLst();
    }
}

logServer.createServer(logServerAddr,logServerPort,()=>{
    logServer.bindToStream(process.stdout);
    logServer.bindToStream(process.stderr);
    console.log("[info] log server listened at",`${logServerAddr}:${logServerPort} .`);
    checkStartUp();
});

var server = new bingServer.bingServer(signatureServerPort,chathubServerPort,serverAddr);
var fallbackserver = new fallbackServer.fallbackServer(fallbackSignatureServerPort,fallbackChathubServerPort,serverAddr,fallbackSignatureServerUrl,fallbackChathubServerUrl);

var acbs: extType.application.remoteApplicationControlBlock[] = [];
var nowAcb: extType.application.remoteApplicationControlBlock;
var inApplication = false;
var lst:string[] = [];

function updateAppLst(){
    fs.readdirSync('./ext').forEach(c=>{
        if (fs.existsSync(`./ext/${c}/index.${fileType}`) && !lst.includes(c)) lst.push(c);
    });
}

function removeApplictionControlBlock(index:number){
    acbs = acbs.slice(0,index).concat(acbs.slice(index+1));
    //console.log(acbs);
}

async function updateApplictionControlBlock(acb:extType.application.remoteApplicationControlBlock){
    if (typeof acb.worker == 'undefined') return;
    return new Promise((resolve:(v:extType.application.remoteApplicationControlBlock)=>void,reject)=>{
        var id = random.randomUUID();
        var nm: extType.extMain.message.income.updateApplictionControlBlock = {
            type: 'updateApplictionControlBlock',
            id: id
        };
        var cb = (v)=>{
            if (typeof v['type'] != 'string') return;
            if (v.id!=id) return;
            if (v.type=='updateApplictionControlBlock'){
                let m = v as extType.extMain.message.outcome.updateApplictionControlBlock;
                resolve(m.acb);
                acb.worker.off('message',cb);
            }
        };
        console.log(`[main] start CrossThreadCall, id "${id}". \n`,nm);
        acb.worker.on('message',cb);
        //acb.worker.postMessage(nm);
        acb.worker.postMessage(nm);
    });
}

async function callApplicationHandle(acb:extType.application.remoteApplicationControlBlock,name: 'init' | 'exit' | 'input' | 'switchIn' | 'switchOut',session: bingServer.conversationSession,userMessage?: bing.incomeMessage.userMesssage,cbs?:{cb?:(text:string,suggestedResponse:string[],nowNum:number,maxNum:number)=>void,updateCb?:(text:string,nowNum:number,maxNum:number,suggestedResponse:string[])=>void,doneCb?:()=>void,aliveCb?:()=>boolean}){
    if (typeof acb.worker == 'undefined') return;
    return new Promise((resolve:(v:null)=>void,reject:(e:extType.extMain.message.outcome.workerError)=>void)=>{
        var id = random.randomUUID();
        switch (name){
            case 'exit':{
                if (acb.inited==false) resolve(null);
            }
            case 'switchIn':{
                if (acb.inited==false) resolve(null);
            }
            case 'init':{
                let nm:extType.extMain.message.income.handleCall = {
                    type: 'handleCall',
                    id: id,
                    name: name,
                    session: session
                };
                let cb = (v)=>{
                    if (typeof v['type'] != 'string'||v.id!=id){
                        acb.worker.once('message',cb);
                        return;
                    };
                    switch (v.type){
                        case 'handleCallDone':{
                            //acb.worker.off('message',cb);
                            resolve(null);
                            return;
                        }
                        case 'error':{
                            //acb.worker.off('message',cb);
                            reject(v);
                            return;
                        }
                        case 'handleCb':{
                            let m = v as extType.extMain.message.outcome.handleCb;
                            cbs.cb(m.text,m.suggestedResponse,m.nowNum,m.maxNum);
                            acb.worker.once('message',cb);
                            return;
                        }
                        default:{
                            acb.worker.once('message',cb);
                            break;
                        }
                    }
                };
                acb.worker.once('message',cb);
                console.log(`[main] start CrossThreadCall, id "${id}". \n`,nm);
                acb.worker.postMessage(nm);
                break;
            }
            case 'switchOut':{
                if (acb.inited==false){
                    resolve(null);
                    break;
                }
                let nm: extType.extMain.message.income.handleCall = {
                    type: 'handleCall',
                    id: id,
                    name: name,
                    session: session
                };
                let cb = (v)=>{
                    if (typeof v['type'] != 'string' || v.id!=id){
                        acb.worker.once('message',cb);
                        return;
                    }
                    switch (v.type){
                        case 'handleCallDone':{
                            //acb.worker.off('message',cb);
                            resolve(null);
                            return;
                        }
                        case 'error':{
                            //acb.worker.off('message',cb);
                            reject(v);
                            return;
                        }
                        default:{
                            acb.worker.once('message',cb);
                            break;
                        }
                    }
                };
                acb.worker.once('message',cb);
                console.log(`[main] start CrossThreadCall, id "${id}". \n`,nm);
                acb.worker.postMessage(nm);
                break;
            }
            case 'input':{
                let nm: extType.extMain.message.income.handleCall = {
                    type: 'handleCall',
                    id: id,
                    name: name,
                    session: session,
                    userMessage: userMessage
                };
                let cb = (v)=>{
                    if (typeof v['type'] != 'string' || v.id!=id){
                        acb.worker.once('message',cb);
                        return;
                    }
                    switch (v.type){
                        case 'handleCallDone':{
                            //acb.worker.off('message',cb);
                            resolve(null);
                            return;
                        }
                        case 'handleUpdateCb':{
                            let m = v as extType.extMain.message.outcome.handleUpdateCb;
                            cbs.updateCb(m.text,m.nowNum,m.maxNum,m.suggestedResponse);
                            acb.worker.once('message',cb);
                            break;
                        }
                        case 'handleAliveCall':{
                            let m = v as extType.extMain.message.outcome.handleAliveCall;
                            let nm: extType.extMain.message.income.handleAliveCb = {
                                type: 'handleAliveCb',
                                id: m.id,
                                alive: cbs.aliveCb()
                            };
                            acb.worker.postMessage(nm);
                            acb.worker.once('message',cb);
                            break;
                        }
                        case 'handleDoneCb':{
                            cbs.doneCb();
                            acb.worker.once('message',cb);
                            break;
                        }
                        case 'error':{
                            //acb.worker.off('message',cb);
                            reject(v);
                            return;
                        }
                        case 'handleCb':{
                            let m = v as extType.extMain.message.outcome.handleCb;
                            cbs.cb(m.text,m.suggestedResponse,m.nowNum,m.maxNum);
                            acb.worker.once('message',cb);
                            break;
                        }
                        default:{
                            acb.worker.once('message',cb);
                            break;
                        }
                    }
                };
                acb.worker.once('message',cb);
                console.log(`[main] start CrossThreadCall, id "${id}". \n`,nm);
                acb.worker.postMessage(nm);
                break;
            }
        }
    });
}


server.on("create",(url,headers,cb:(code,statusTxt,conversationIdPair)=>void)=>{
    var cidPair = bingServer.bingServer.generateConversationIdPair('youdaoExtBingUser');
    console.log(`[server] received signature create request on path "${url}", responsing cid "${cidPair.conversationId}". `);
    cb(200,"OK",cidPair);
});

server.on("connect",(url,headers,cb:(isAllow)=>void)=>{
    console.log(`[server] received chathub connect request on path "${url}". `);
    cb(true);
});

server.on("message",async (userMessage:bing.incomeMessage.userMesssage,conversationSession:bingServer.conversationSession,updateCb:(text:string,nowNum:number,maxNum:number,suggestedRespond:string[])=>void,doneCb:(serviceVersion:string)=>void,alive:()=>boolean)=>{
    console.log(`[server] received message ${JSON.stringify(userMessage.text)}\n[server] with tone "${conversationSession.createAt.tone}" from cid "${conversationSession.cid}" at ${userMessage.timestamp}. `);
    //updateCb(`server receive "${userMessage.text}" at ${userMessage.timestamp}.`,1,50,["ok","alright","test","overflow"]);
    //doneCb("youdaoExtBing v1.0");
    if (!inApplication){
        if (!lst.includes(userMessage.text) || bannedApplicationName.includes(userMessage.text.trim())){
            updateAppLst();
            //tipCb('Generating');
            if (!lst.includes(userMessage.text)){
                updateCb(`**youdaoExtBingServer**  \n **v${mainAppVersion[0]}.${mainAppVersion[1]}.${mainAppVersion[2]}**   \nYou are not in any application now.  \nChoose one to enter.  \nHere're ${lst.length} application(s) installed.`,0,1024,lst);
                doneCb(mainAppName);
                return;
            }
        }
        for (var i=0;i<acbs.length;i++){
            if (acbs[i].rawName==userMessage.text && acbs[i].switchOut==true && acbs[i].inited==true){
                var aTxt = "";
                callApplicationHandle(acbs[i],"switchIn",conversationSession,undefined,{cb:(text,suggestedResponse,nowNum,maxNum)=>{
                    aTxt = text;
                    updateCb(text,nowNum,maxNum,suggestedResponse);
                }}).then(()=>{
                    updateApplictionControlBlock(acbs[i]).then((racb)=>{
                        acbs[i] = Object.assign(acbs[i],racb);
                        nowAcb = acbs[i];
                        inApplication = true;
                        if (aTxt.length==0) updateCb(`Now you are in "${nowAcb.name}".`,nowAcb.nowNum,nowAcb.maxNum,[]);
                        doneCb(nowAcb.name);
                    });
                },(e:extType.extMain.message.outcome.workerError)=>{
                    updateAppLst();
                    updateCb(`Error happened while switching to "${acbs[i].name}".  \`\`\`\n${e.desc}\n${e.detail}\n\`\`\`\nChoose one app to enter.`,0,1024,lst);
                    removeApplictionControlBlock(i);
                    doneCb(mainAppName);
                });
                return;
            }
        }
        var workerData: extType.extMain.workerPayload = {
            fileType: fileType,
            applicationName: userMessage.text,
            rootPath: rootPath
        }
        var acb: extType.application.remoteApplicationControlBlock = {
            name: userMessage.text,
            rawName: userMessage.text,
            inited: false,
            switchOut: false,
            nowNum: 0,
            maxNum: -1,
            worker: new worker.Worker(`./extmain.${fileType}`,{workerData:workerData,env:Object.assign({basePath:`./ext/${userMessage.text}`,mtpPath:process.env['mtpPath'],ydpSysRootPath:process.env['ydpSysRootPath']},process.env)})
        };
        acb.worker.on('error',(e)=>{
            console.log(`[error] application worker thread "${userMessage.text}" error.\n${e}`);
        });
        acb.worker.on('exit',(c)=>{
            console.log(`[info] application worker thread "${userMessage.text}" exit with code ${c}.`);
            //inApplication = false;
            acb.inited = false;
            /*
            let pos = acbs.indexOf(acb);
            if (pos!=-1) removeApplictionControlBlock(pos);
            */
        });
        acb.worker.on('message',(v)=>{
            console.log('[main] received CrossThreadCall response from worker thread "'+acb.name+'". \n',v);
        });
        var aTxt = "";
        callApplicationHandle(acb,'init',conversationSession,undefined,{cb:(text, suggestedResponse, nowNum, maxNum)=>{
            aTxt = text;
            updateCb(text,nowNum,maxNum,suggestedResponse);
        }}).then(()=>{
            updateApplictionControlBlock(acb).then((racb)=>{
                acb = Object.assign(acb,racb);
                if (aTxt.length==0) updateCb(`Now you are in "${acb.name}".`,acb.nowNum,acb.maxNum,[]);
                doneCb(acb.name);
                acbs.push(acb);
                nowAcb = acb;
                inApplication = true;
            });
        },(e:extType.extMain.message.outcome.workerError)=>{
            updateCb(`Error happened while loading app "${userMessage.text}".  \n\`\`\`\n${e.desc}\n${e.detail}\n\`\`\`\nChoose one app to enter.`,0,1024,lst);
            doneCb(mainAppName);
            console.log(e.desc,e.detail);
        });
    }else{
        if (userMessage.text.length==0){
            updateCb(`You enter an empty string.`,nowAcb.nowNum,nowAcb.maxNum,[]);
            doneCb(nowAcb.name);
            return;
        }
        if (!nowAcb.inited && userMessage.text!='#exit'){
            updateCb(`App "${nowAcb.name}" has already terminated for some reasons.  \nYou can turn to the log to find out the problem. `,nowAcb.nowNum,nowAcb.maxNum,['#exit']);
            doneCb(nowAcb.name);
            return;
        }
        if (userMessage.text[0]=='#' && userMessage.text.substring(0,2)!='##'){
            switch(userMessage.text){
                case "#switch":{
                    var aTxt = "";
                    callApplicationHandle(nowAcb,"switchOut",conversationSession,undefined,{cb:(text,suggestedResponse,nowNum,maxNum)=>{
                        aTxt = text;
                        updateAppLst();
                        updateCb(`${text}  \nNow you are out of "${nowAcb.name}".  \nChoose an application to switch to.`,0,1024,lst);
                    }}).then(()=>{
                        updateApplictionControlBlock(nowAcb).then((rach)=>{
                            nowAcb.inited = rach.inited;
                            nowAcb.maxNum = rach.maxNum;
                            nowAcb.name = rach.name;
                            nowAcb.nowNum = rach.nowNum;
                            nowAcb.switchOut = nowAcb.switchOut;
                            updateAppLst();
                            if (aTxt.length==0) updateCb(`Now you are out of "${nowAcb.name}".  \nChoose an application to switch to.`,0,1024,lst)
                            inApplication = false;
                            nowAcb.switchOut = true;
                            doneCb(mainAppName);
                        });
                    },(e:extType.extMain.message.outcome.workerError)=>{
                        updateAppLst();
                        updateCb(`Error happened while switching out from "${nowAcb.name}".  \n\`\`\`\n${e.desc}\n${e.detail}\n\`\`\`\nChoose an application to enter.`,0,1024,lst);
                        inApplication = false;
                        removeApplictionControlBlock(acbs.indexOf(nowAcb));
                        doneCb(mainAppName);
                    });
                    break;
                }
                case "#exit":{
                    var aTxt = "";
                    callApplicationHandle(nowAcb,"exit",conversationSession,undefined,{cb:(text,suggestedResponse,nowNum,maxNum)=>{
                        aTxt = text;
                        updateAppLst();
                        updateCb(`${text}  \nNow you are out of "${nowAcb.name}".  \nChoose an application to switch to.`,0,1024,lst);
                    }}).then(()=>{
                        updateAppLst();
                        if (aTxt.length==0) updateCb(`Now "${nowAcb.name}" is closed.  \nChoose an application to switch to.`,0,1024,lst)
                        inApplication = false;
                        nowAcb.switchOut = true;
                        removeApplictionControlBlock(acbs.indexOf(nowAcb));
                        doneCb(mainAppName);
                    },(e:extType.extMain.message.outcome.workerError)=>{
                        updateAppLst();
                        updateCb(`Error happened while exiting "${nowAcb.name}".  \n\`\`\`\n${e.desc}\n${e.detail}\n\`\`\`\nChoose an application to enter.`,0,1024,lst);
                        inApplication = false;
                        /*
                        for (let i=0;i<acbs.length;i++){
                            if (acbs[i].rawName==nowAcb.rawName) removeApplictionControlBlock(i);
                        }
                        */
                        removeApplictionControlBlock(acbs.indexOf(nowAcb));
                        doneCb(mainAppName);
                    });
                    break;
                }
                case "#memClean":{
                    let mem = child.spawn('memsize');
                    mem.stdout.on('data',(data)=>{
                        updateCb(String(data),nowAcb.nowNum,nowAcb.maxNum,[]);
                    });
                    mem.on('close',()=>{
                        doneCb(nowAcb.name);
                    });
                    mem.on('error',(ee)=>{
                        updateCb(`Error happened.  \n\`\`\`\n${ee}\n\`\`\``,nowAcb.nowNum,nowAcb.maxNum,[]);
                        doneCb(nowAcb.name);
                    });
                    break;
                }
                default:{
                    updateCb(`Unrecognised super command "${userMessage.text}".`,nowAcb.nowNum,nowAcb.maxNum,[]);
                    doneCb(nowAcb.name);
                    break;
                }
            }
            return;
        }
        var utxt = userMessage.text;
        if (userMessage.text.substring(0,2)=='##') utxt = userMessage.text.substring(1);
        callApplicationHandle(nowAcb,"input",conversationSession,{text:utxt,timestamp:userMessage.timestamp},{
            updateCb:(text,nowNum,maxNum,suggestedResponse)=>{
                nowAcb.nowNum = nowNum;
                nowAcb.maxNum = maxNum;
                updateCb(text,nowNum,maxNum,suggestedResponse);
            },
            doneCb:()=>{
                doneCb(nowAcb.name);
            },
            aliveCb:()=>{
                return alive();
            }
        }).then(()=>{},(e)=>{
            updateAppLst();
            updateCb(`Error happened while calling the handle "input" of the application "${nowAcb.name}".  \n\`\`\`\n${e.desc}\n${e.detail}\n\`\`\`\nChoose an application to enter.`,0,1024,lst);
            inApplication = false;
            removeApplictionControlBlock(acbs.indexOf(nowAcb));
            doneCb(mainAppName);
        });
    }
});

fallbackserver.on('http',(code,msg,header)=>{
    console.log(`[fallbackServer] signature create request responsed ${code},"${msg}". `);
});

fallbackserver.on('ws',(header,url)=>{
    console.log(`[fallbackServer] received chathub request at path "${url}". `);
});

fallbackserver.on('remoteMsg',(data)=>{
    console.log(`[fallbackServer] received a message from bing server. \n${data.toString()}`);
});

fallbackserver.on('localMsg',(data)=>{
    console.log(`[fallbackServer] received a message form penmods client. \n${data.toString()}`);
});

process.on('uncaughtException',(e,o)=>{
    /*
    if (e.cause['code']=='EIO' && e.cause['errno']==-5 && e.cause['syscall']=='write'){
        logServer.disableRawWrite();
    } 
    */
    logServer.disableRawWrite();
    try{
        console.log('[error] uncaughtException\n',e,'\n',o);
    }catch(E){}
});

process.on('unhandledRejection',(res,promise)=>{
    try{
        console.log('[error] unhandledRejection\n',res,'\n',promise);
    }catch(E){}
});



server.on('listening',()=>{
    console.log(`[info] signature create server listened at "http://${serverAddr}:${signatureServerPort}" .`);
    console.log(`[info] chathub server listened at "ws://${serverAddr}:${chathubServerPort}" .`);
    checkStartUp();
});

fallbackserver.on('listening',()=>{
    console.log(`[info] fallback signature create server listened at "http://${serverAddr}:${fallbackSignatureServerPort}" .`);
    console.log(`[info] fallback chathub server listened at "ws://${serverAddr}:${fallbackChathubServerPort}" .`);
    checkStartUp();
})


