
// ydpExt

// MIT License Copyright (c) 2023 Wxp

import { WebSocket, WebSocketServer } from "ws";
import * as http from "node:http";
import { bing } from "./bing.js";
import * as random from "./random.js";
import EventEmitter from "node:events";

export interface conversationIdPair{
    conversationId: string,
    clientId: string,
    conversationSignature: string,
    result: {
        value: "Success",
        message: null
    }
}

export interface conversationSession{
    cid: string,
    createAt:{
        timestamp: string,
        path: string,
        tone: 'creative' | 'moderate' | 'precise'
    },
    path: string,
    timestamp: string,
    nowNum: number,
    maxNum: number
}

enum clientStage{
    none,
    inited,
    requested,
    blocked
}

enum serverStage{
    none,
    updating,
    done
}

export class bingServer extends EventEmitter{
    #wsServer: WebSocketServer;
    #httpServer = http.createServer();
    #listening = false;

    #session: conversationSession = {
        cid: '',
        createAt: {
            timestamp: '',
            path: '',
            tone: 'moderate'
        },
        path: '',
        timestamp: '',
        maxNum: -1,
        nowNum: 0
    };

    constructor(httpPort: number, wsPort: number, host: string){
        super();
        this.#wsServer = new WebSocketServer({port:wsPort,host:host});

        this.#wsServer.on('listening',()=>{
            if (this.#httpServer.listening){
                this.#listening = true;
                this.emit('listening');
            }else{
                this.#httpServer.on('listening',()=>{
                    this.#listening = true;
                    this.emit('listening');
                });
            }
        });

        this.#httpServer.on("error",(e)=>{
            console.warn(`[bingServer][http] err\n${e}`);
        });
        this.#wsServer.on("error",(e)=>{
            console.warn(`[bingServer][ws] err\n${e}`);
        });
        this.#wsServer.on("connection",(socket,req)=>{
            socket.on("error",(e)=>{
                console.warn(`[bingServer][ws] socket err\n${e}`);
                try{socket.close();}catch(ee){}
            });
            // on("connect",url,header,cb(isAllow))
            this.emit("connect",req.url,req.headers,(allow:boolean)=>{
                if (!allow){
                    socket.close();
                    return;
                }
                this.#session.path = req.url;
                var stageClient: clientStage = clientStage.none;
                var stageServer: serverStage = serverStage.none;
                /*
                socket.on("close",(code)=>{
                    console.log(`[bingServer][ws] client closed ${code}`);
                });
                */
                socket.on("message",(data)=>{
                    var d = [];
                    data.toString().split('\u001e').forEach(c=>{
                        if (c.trim().length==0) return;
                        var t: object;
                        try{
                            t = JSON.parse(c);
                        }catch(e){
                            return;
                        }
                        if (Object.keys(t).length==0) return;
                        d.push(t);
                    });
                    d.forEach(dc=>{
                        //console.log(JSON.stringify(dc,undefined,'  '));
                        switch (stageClient){
                            case clientStage.none:{
                                let m: bing.incomeMessage.raw.init = dc;
                                if (m.version!=1 || m.protocol!="json"){
                                    console.warn(`[bingServer] reject an unspported init request, protocol: "${m.protocol}", version: "${m.version}"`);
                                    socket.close();
                                    socket.removeAllListeners();
                                }
                                let msg:bing.outcomeMessage.raw.empty;
                                this.#sendMsg(socket,msg);
                                stageClient = clientStage.inited;
                                break;
                            }
                            case clientStage.inited:{
                                if (dc.type!=4) return;
                                let m = dc as bing.incomeMessage.raw.userInput;
                                let um: bing.incomeMessage.userMesssage = {
                                    text: m.arguments[0].message.text,
                                    timestamp: m.arguments[0].message.timestamp
                                };
                                if (m.arguments[0].conversationId!=this.#session.cid) {
                                    console.warn(`[bingServer][ws] only support single client conversation, but receive a request from another client "${m.arguments[0].conversationId}"`);
                                    socket.close();
                                    stageClient = clientStage.blocked;
                                    return;
                                }
                                if (m.arguments[0].optionsSets.includes('galileo')) this.#session.createAt.tone = 'moderate';
                                if (m.arguments[0].optionsSets.includes('h3imaginative')) this.#session.createAt.tone = 'creative';
                                if (m.arguments[0].optionsSets.includes('h3precise')) this.#session.createAt.tone = 'precise';

                                stageClient = clientStage.requested;
                                let mText = "";
                                this.#session.timestamp = this.#generateTimestamp();
                                let mMessageId = random.randomUUID();
                                let mRequestId = random.randomUUID();
                                let mSuggestedResponse: string[] = [];

                                // on("message",userMessage,conversationSession,updateCb(text,nowNum,maxNum,suggestedResponse[]),doneCb(serviceVersion),alive())
                                this.emit("message",um,this.#session,(text:string,nowNum:number,maxNum:number,suggestedResponse:string[])=>{
                                    if (stageServer==serverStage.done) return;
                                    stageServer = serverStage.updating;
                                    mText = text;
                                    this.#session.nowNum = nowNum;
                                    this.#session.maxNum = maxNum;
                                    mSuggestedResponse = suggestedResponse;
                                    let nmSuggestedRespond: bing.outcomeMessage.rawType.suggestedResponse[] = [];
                                    suggestedResponse.forEach(src=>{
                                        if (src.trim().length==0) return;
                                        nmSuggestedRespond.push({
                                            text: src,
                                            messageId: random.randomUUID(),
                                            messageType: "Suggestion",
                                            contentOrigin: "SuggestionChipsFalconService",
                                            createdAt: this.#session.timestamp,
                                            timestamp: this.#generateTimestamp(),
                                            offense: "Unknown",
                                            feedback:{
                                                tag: null,
                                                updatedOn: null,
                                                type: "None"
                                            },
                                            author: 'user'
                                        });
                                    });
                                    let nmMsg: bing.outcomeMessage.rawType.messagePartial = {
                                        text: mText,
                                        author: 'bot',
                                        adaptiveCards: [{
                                            type: "AdaptiveCard",
                                            version: "1.0",
                                            body:[{
                                                type: "TextBlock",
                                                text: mText,
                                                wrap: true
                                            }]
                                        }],
                                        sourceAttributions: [],
                                        suggestedResponses: nmSuggestedRespond,
                                        timestamp: this.#generateTimestamp(),
                                        createdAt: this.#session.timestamp,
                                        messageId: mMessageId,
                                        offense: "Unknown",
                                        contentOrigin: 'DeepLeo',
                                        feedback:{
                                            tag: null,
                                            type: "None",
                                            updatedOn: null
                                        }
                                    };
                                    let nmArg: bing.outcomeMessage.rawType.updateMessageArgument={
                                        requestId: mRequestId,
                                        messages: [nmMsg],
                                        throttling:{
                                            maxNumLongDocSummaryUserMessagesInConversation: 50,
                                            maxNumUserMessagesInConversation: this.#session.maxNum,
                                            numLongDocSummaryUserMessagesInConversation: 0,
                                            numUserMessagesInConversation: this.#session.nowNum
                                        },
                                        result: null
                                    };
                                    let nm: bing.outcomeMessage.raw.updateMessage={
                                        type: 1,
                                        target: 'update',
                                        arguments: [nmArg]
                                    };
                                    this.#sendMsg(socket,nm);
                                },(serviceVersion:string)=>{
                                    if (stageServer==serverStage.done) return;
                                    stageServer = serverStage.done;
                                    let nmSuggestedRespond: bing.outcomeMessage.rawType.suggestedResponse[] = [];
                                    mSuggestedResponse.forEach(src=>{
                                        if (src.trim().length==0) return;
                                        nmSuggestedRespond.push({
                                            text: src,
                                            messageId: random.randomUUID(),
                                            messageType: "Suggestion",
                                            contentOrigin: "SuggestionChipsFalconService",
                                            createdAt: this.#generateTimestamp(),
                                            timestamp: this.#generateTimestamp(),
                                            offense: "Unknown",
                                            feedback:{
                                                tag: null,
                                                updatedOn: null,
                                                type: "None"
                                            },
                                            author: 'user'
                                        });
                                    });
                                    let nmMsg: bing.outcomeMessage.rawType.messageFull={
                                        author: 'bot',
                                        text: mText,
                                        messageId: mMessageId,
                                        requestId: mRequestId,
                                        createdAt: this.#session.timestamp,
                                        timestamp: this.#generateTimestamp(),
                                        contentOrigin: "DeepLeo",
                                        feedback:{
                                            type: "None",
                                            tag: null,
                                            updatedOn: null
                                        },
                                        offense: "Unknown",
                                        market: m.arguments[0].message.market,
                                        region: m.arguments[0].message.region,
                                        locale: m.arguments[0].message.locale,
                                        suggestedResponses: nmSuggestedRespond,
                                    };
                                    let nmItem: bing.outcomeMessage.rawType.chatResponseItem={
                                        requestId: mRequestId,
                                        conversationId: m.arguments[0].conversationId,
                                        messages: [nmMsg],
                                        firstNewMessageIndex: 0,
                                        shouldInitiateConversation: m.arguments[0].isStartOfSession,
                                        telemetry:{
                                            startTime: this.#session.timestamp
                                        },
                                        throttling:{
                                            maxNumLongDocSummaryUserMessagesInConversation: 50,
                                            maxNumUserMessagesInConversation: this.#session.maxNum,
                                            numLongDocSummaryUserMessagesInConversation: 0,
                                            numUserMessagesInConversation: this.#session.nowNum
                                        },
                                        result:{
                                            serviceVersion: serviceVersion,
                                            value: "Success"
                                        },
                                        conversationExpiryTime: "9999-12-31T23:59:59+00:00",
                                        suggestedResponses: null
                                    };
                                    let nm: bing.outcomeMessage.raw.updateCompleteMessage={
                                        invocationId: m.invocationId,
                                        item: nmItem,
                                        type: 2
                                    };
                                    let fm: bing.outcomeMessage.raw.interrupt = {
                                        type: 3,
                                        invocationId: m.invocationId
                                    }
                                    this.#sendMsg(socket,nm,fm);
                                    this.#sendMsg(socket,fm);
                                },()=>{
                                    return (socket.readyState==socket.OPEN);
                                });
                                break;
                            }
                            case clientStage.requested:{
                                console.warn(`[bingServer] receive an unexpected message \n${JSON.stringify(dc)}`);
                                break;
                            }
                            case clientStage.blocked:{
                                break;
                            }
                            default:{
                                console.warn('[bingServer] never go here');
                                break;
                            }
                        }
                    });
                });
            });
        });
        this.#httpServer.on("request",(req,res)=>{
            res.on("error",(e)=>{
                console.warn(`[bingServer][http] res err\n${e}`);
                try{res.destroy();}catch(ee){}
            });
            // on("create",url,headers,cb(code,statusTxt,conversationIdPair))
            this.emit("create",req.url,req.headers,(code:number,statusTxt:string,cidPair?:conversationIdPair)=>{
                res.writeHead(code,statusTxt);
                if (code===200) res.write(JSON.stringify(cidPair));
                this.#session.cid = cidPair.conversationId;
                this.#session.createAt.path = req.url;
                this.#session.createAt.timestamp = this.#generateTimestamp();
                res.end();
            });
        });
        this.#httpServer.listen(httpPort,host);
    }

    static generateConversationIdPair(userType:string){
        var out: conversationIdPair = {
            conversationId: `51D|${userType}|${random.randomString(64,random.map.numberAndUpperLetter)}`,
            conversationSignature: random.randomString(44,random.map.numberAndLetterAndSymbol),
            clientId: random.randomString(15,random.map.number),
            result: {
                value: "Success",
                message: null
            }
        };
        return out;
    }
    #sendMsg(socket:WebSocket,...msgs:object[]){
        var out = [];
        msgs.forEach(c=>{
            out.push(JSON.stringify(c));
            //console.log(`[bingServer] msg will be sent\n${JSON.stringify(c,undefined,'  ')}`);
        });
        try{socket.send(out.join('\u001e') + '\u001e');}catch(e){
            console.warn(`[bingServer][ws] err while sending msgs\n${e}`);
        }
    }
    #generateTimestamp(){
        var d = new Date();
        var t = d.toISOString().split('Z')[0];
        var offset = 0 - d.getTimezoneOffset();
        var offsetH = (Math.floor(offset/60)<10) ? `0${Math.floor(offset/60)}` : `${Math.floor(offset/60)}`;
        var offsetM = (Math.floor(offset%60)<10) ? `0${Math.floor(offset%60)}` : `${Math.floor(offset%60)}`;
        return `${t}+${offsetH}:${offsetM}`;
    }

    isListening(){
        return this.#listening;
    }

}