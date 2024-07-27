
// ydpExt

// MIT License Copyright (c) 2023 Wxp

import * as http from "node:http";
import * as https from "node:https";
import * as net from "node:net";
import * as event from "node:events";


export class fallbackServer extends event.EventEmitter{
    #wsServer: net.Server;
    #httpServer = http.createServer();
    #listening = false;

    constructor(httpPort:number,wsPort:number,hostAddr:string,httpUrl:string,wsUrl:string){
        super();
        this.#wsServer = net.createServer();
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
        this.#wsServer.on('connection',(socket)=>{
            socket.on('error',(e)=>{
                console.warn('[fallbackServer][ws][err] socket raise error.','\n',e);
                try{socket.destroy();}catch(ee){}
            });
            let url: URL;
            try{
                url = new URL(wsUrl);
            }catch(e){
                console.warn('[fallbackServer][ws][err] not a vaild ws url "',httpUrl,'". \n',e);
                socket.write('Please check you fallback url settings. ');
                socket.destroy();
                return;
            }
            if (url.protocol!='ws:' && url.protocol!='wss:'){
                console.warn('[fallbackServer][ws][err] we only accept ws and wss target, but receive "'+url.protocol+'". ');
                socket.write('Please check you fallback url settings. ');
                socket.destroy();
                return;
            }
            let remote = net.connect({
                host: url.host,
                port: url.port
            });
            remote.on('error',(e)=>{
                console.warn('[fallbackServer][ws][err] remote raise error.','\n',e);
                socket.write(`${e.name} ${e.message} ${e.cause}`);
                socket.destroy();
            });
            remote.on('connection', ()=>{
                remote.pipe(socket);
                socket.pipe(remote);
            });
        });
        this.#httpServer.listen(httpPort,hostAddr);
        this.#wsServer.listen({
            host: hostAddr,
            port: wsPort
        });
    }

    isListening(){
        return this.#listening;
    }

}
