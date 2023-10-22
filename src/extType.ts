
// ydpExt

// MIT License Copyright (c) 2023 Wxp

import { bing } from "./bing.js";
import * as bingServer from "./bingServer.js";
import * as worker from "node:worker_threads";

export namespace extType{
    export namespace application{
        export interface handle{
            switchOut: (session:bingServer.conversationSession)=>void,
            switchIn: (session:bingServer.conversationSession,cb:(text:string,suggestedResponse:string[],nowNum:number,maxNum:number)=>void)=>void,
            input: (session:bingServer.conversationSession,userMessage:bing.incomeMessage.userMesssage,updateCb:(text:string,nowNum:number,maxNum:number,suggestedResponse:string[])=>void,doneCb:()=>void,alive:()=>Promise<boolean>,hold:()=>void)=>void,
            exit: (session:bingServer.conversationSession,cb:(text:string,suggestedResponse:string[],nowNum:number,maxNum:number)=>void)=>void,
            init: (session:bingServer.conversationSession,cb:(text:string,suggestedResponse:string[],nowNum:number,maxNum:number)=>void)=>void
        }
        export class base{
            handle: handle;
            applicationName: string;
        }
        export interface importedStruct{
            constructor?: ()=>base,
            applicationName?: string,
            switchOut?: (session:bingServer.conversationSession)=>void,
            switchIn?: (session:bingServer.conversationSession,cb:(text:string,suggestedResponse:string[],nowNum:number,maxNum:number)=>void)=>void,
            input?: (session:bingServer.conversationSession,userMessage:bing.incomeMessage.userMesssage,updateCb:(text:string,nowNum:number,maxNum:number,suggestedResponse:string[])=>void,doneCb:()=>void,alive:()=>Promise<boolean>,hold:()=>void)=>void,
            exit?: (session:bingServer.conversationSession,cb:(text:string,suggestedResponse:string[],nowNum:number,maxNum:number)=>void)=>void,
            init?: (session:bingServer.conversationSession,cb:(text:string,suggestedResponse:string[],nowNum:number,maxNum:number)=>void)=>void
        }
        export interface applicationControlBlock{
            imported: importedStruct,
            base: base,
            inited: boolean,
            switchOut: boolean,
            name: string,
            nowNum: number,
            maxNum: number
        }
        export interface remoteApplicationControlBlock{
            inited: boolean,
            switchOut: boolean,
            name: string,
            nowNum: number,
            maxNum: number,
            rawName?: string,
            worker?: worker.Worker
        }
    }
    export namespace extMain{
        export interface workerPayload{
            applicationName: string,
            fileType: string,
            rootPath: string
        }
        export namespace message{
            export namespace income{
                export interface handleCall{
                    type: 'handleCall',
                    id: string,
                    name: 'init' | 'exit' | 'input' | 'switchIn' | 'switchOut',
                    session: bingServer.conversationSession,
                    userMessage?: bing.incomeMessage.userMesssage
                }
                export interface updateApplictionControlBlock{
                    type: 'updateApplictionControlBlock',
                    id: string
                }
                export interface handleAliveCb{
                    type: 'handleAliveCb',
                    alive: boolean,
                    id: string
                }
            }
            export namespace outcome{
                export interface handleCb{
                    type: 'handleCb',
                    id: string,
                    text:string,
                    suggestedResponse:string[],
                    nowNum:number,
                    maxNum:number
                }
                export interface handleUpdateCb{
                    type: 'handleUpdateCb',
                    id: string,
                    text:string,
                    nowNum:number,
                    maxNum:number,
                    suggestedResponse:string[]
                }
                export interface handleAliveCall{
                    type: 'handleAliveCall',
                    id: string
                }
                export interface handleDoneCb{
                    type: 'handleDoneCb',
                    id: string
                }
                export interface workerError{
                    type: 'error'
                    id: string,
                    desc: string,
                    detail: any
                }
                export interface updateApplictionControlBlock{
                    type: 'updateApplictionControlBlock',
                    id: string,
                    acb: application.remoteApplicationControlBlock
                }
                export interface handleCallDone{
                    type: 'handleCallDone',
                    id: string,
                }
            }
        }
        
    }
}