
// ydpExt

// MIT License Copyright (c) 2023 Wxp

import * as net from "node:net";

var clientList:net.Socket[] = [];

var noRawWrite = false;

var listening = false;

const server = net.createServer({},(socket)=>{
    socket.on('end',()=>{
        socket.removeAllListeners();
        var pos = clientList.indexOf(socket);
        if (pos==-1) return;
        clientList = clientList.slice(0,pos).concat(clientList.slice(pos+1));
        //console.log(clientList);
        console.log('[logServer] A logServer client disattached. ip:',socket.remoteAddress,'.');
    });
    socket.on('close',()=>{
        socket.removeAllListeners();
        var pos = clientList.indexOf(socket);
        if (pos==-1) return;
        clientList = clientList.slice(0,pos).concat(clientList.slice(pos+1));
        //console.log(clientList);
        console.log('[logServer] A logServer client disattached. ip:',socket.remoteAddress,'.');
    });
    socket.on('error',(e)=>{
        console.log('[logServer] error happened in socket','ip:',socket.remoteAddress,'\n',e,'\n');
    });
    if (!clientList.includes(socket)) clientList.push(socket);
    //socket.write(`======\nYou are not connected to youdaoExt's log server.\nYour Ip: ${socket.remoteAddress}\n======\n`);
    console.log('[logServer] A logServer client attached. ip:',socket.remoteAddress,'.');
    //console.log(clientList);
});

export function createServer(address:string,port:number,cb:()=>void){
    server.on('listening',()=>{
        listening = true;
        cb();
    });
    server.on('error',(e)=>{
        console.log('[logServer] error happened\n',e,'\n');
    });
    server.listen(port,address);
}

export function log(txt:string|Uint8Array){
    clientList.forEach(socket=>{
        try{
            socket.write(txt);
        }catch(e){
            console.log('[logServer] error happened in log\n',e);
        }
    });
}

export function disableRawWrite(){
    noRawWrite = true;
}

export function bindToStream(s:any){
    s['__logServerwrite'] = s.write;
    s.write = (...args):boolean=>{
        var ret = true;
        try{
            if (!noRawWrite) ret = s.__logServerwrite.apply(s,args);
        }catch(e){}
        if (args.length>0) log(args[0]);
        return ret;
    }
}

export function isListening(){
    return listening;
}