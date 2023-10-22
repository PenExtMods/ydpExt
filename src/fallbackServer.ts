
// ydpExt

// MIT License Copyright (c) 2023 Wxp

import * as http from "node:http";
import * as https from "node:https";
import { WebSocket,WebSocketServer } from "ws";
import * as event from "node:events";


export class fallbackServer extends event.EventEmitter{
    #wsServer: WebSocketServer;
    #httpServer = http.createServer();
    #listening = false;

    constructor(httpPort:number,wsPort:number,hostAddr:string,httpUrl:string,wsUrl:string){
        super();
        this.#wsServer = new WebSocketServer({port:wsPort,host:hostAddr});
        https.globalAgent.options.keepAlive = true;

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
            console.warn(`[fallbackServer][http] err\n${e}`);
        });
        this.#wsServer.on("error",(e)=>{
            console.warn(`[fallbackServer][ws] err\n${e}`);
        });
        this.#httpServer.on("request",(req,res)=>{
            let url:URL;
            try{
                url = new URL(httpUrl);
            }catch(e){
                console.warn('[fallbackServer][http][err] not a vaild http url "',httpUrl,'". \n',e);
                res.writeHead(500);
                res.write('Please check you fallback url settings. ');
                res.end();
                return;
            }
            if (url.protocol!='https:'){
                console.warn('[fallbackServer][http][err] we only accept https target, but receive "'+url.protocol+'". ');
                res.writeHead(500);
                res.write('Please check you fallback url settings. ');
                res.end();
                return;
            }
            let header = req.headers;
            header['host'] = url.host;
            var rreq = https.request({host:url.host,hostname:url.hostname,path:url.pathname+url.search,servername:url.host,headers:header,method:req.method});
            req.pipe(rreq);
            rreq.on('response',(rres)=>{
                // on("http",code,msg,header)
                this.emit('http',rres.statusCode,rres.statusMessage,rres.headers);
                res.writeHead(rres.statusCode,rres.statusMessage,rres.headers);
                rres.pipe(res);
                rres.on('end',()=>{
                    try{res.end();}catch(ee){}
                });
                rres.on('error',(e)=>{
                    console.warn('[fallbackServer][http][err] rres raise error.','\n',e);
                    res.writeHead(500);
                    res.write('Request failed. '+String(e.name)+' '+String(e.message)+' '+String(e.cause));
                    res.end();
                });
            });
            req.on('end',()=>{
                try{rreq.end();}catch(ee){}
            });
            rreq.on('error',(e)=>{
                console.warn('[fallbackServer][http][err] rreq raise error.','\n',e);
                res.writeHead(500);
                res.write('Request failed. '+String(e.name)+' '+String(e.message)+' '+String(e.cause));
                res.end();
            });
            req.on('error',(e)=>{
                console.warn('[fallbackServer][http][err] req raise error.','\n',e);
                try{
                    res.writeHead(500);
                    res.write('Request failed. '+String(e.name)+' '+String(e.message)+' '+String(e.cause));
                    res.end();
                }catch(Ee){}
            });
            res.on('error',(e)=>{
                console.warn('[fallbackServer][http][err] res raise error.','\n',e);
            });
        });
        this.#wsServer.on('connection',(socket,req)=>{
            socket.on('error',(e)=>{
                console.warn('[fallbackServer][ws][err] socket raise error.','\n',e);
                try{socket.close();}catch(ee){}
            });
            let url: URL;
            try{
                url = new URL(wsUrl);
            }catch(e){
                console.warn('[fallbackServer][ws][err] not a vaild ws url "',httpUrl,'". \n',e);
                socket.send('Please check you fallback url settings. ');
                socket.close();
                return;
            }
            if (url.protocol!='ws:' && url.protocol!='wss:'){
                console.warn('[fallbackServer][ws][err] we only accept ws and wss target, but receive "'+url.protocol+'". ');
                socket.send('Please check you fallback url settings. ');
                socket.close();
                return;
            }
            let header = req.headers;
            // on('ws',header,url)
            this.emit('ws',req.headers,req.url);
            header['host'] = url.host;
            let remote = new WebSocket(wsUrl,{headers:header});
            remote.on('error',(e)=>{
                console.warn('[fallbackServer][ws][err] remote raise error.','\n',e);
                socket.send(`${e.name} ${e.message} ${e.cause}`);
                socket.close();
            });
            remote.on('close',(code,reason)=>{
                socket.close(code);
            });
            remote.on('message',(data)=>{
                // on('remoteMsg',data)
                this.emit('remoteMsg',data);
                socket.send(data);
            });
            remote.on('open',()=>{
                socket.on('message',(data)=>{
                    // on('localMsg',data)
                    this.emit('localMsg',data);
                    remote.send(data);
                });
                socket.on('close',(code,reason)=>{
                    remote.close(code);
                });
            });
        });
        this.#httpServer.listen(httpPort,hostAddr);
    }

    isListening(){
        return this.#listening;
    }

}