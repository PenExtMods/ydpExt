import * as imageJs from "image-js";
import * as libEncode from "./libEncode.js";
import * as sharedLib from "./sharedLib.js";
import * as https from "node:https";
import * as http from "node:http";
import * as childProcess from "node:child_process";
import * as fs from "node:fs";

export async function ffmpegDecodeToPng(data,extname){
    return new Promise((resolve,reject)=>{
        var fn = sharedLib.random.randomUUID();
        fs.writeFileSync(`${process.env['ydpSysRootPath']}/tmp/${fn}.${extname}`,data);
        var ffmpeg = childProcess.spawn('chroot',['.','ffmpeg','-i',`/tmp/${fn}.${extname}`,`/tmp/${fn}.png`],{cwd:`${process.env['ydpSysRootPath']}`});
        var outTxt = '';
        ffmpeg.stdout.on('data',(d)=>{
            outTxt += String(d);
        });
        ffmpeg.stderr.on('data',(d)=>{
            outTxt += String(d);
        });
        ffmpeg.on('close',(code)=>{
            if (code!=0){
                console.log('[libPic] ffmpeg exit with code',code,'\n','stdout&stderr:\n',outTxt);
            }else{
                console.log('[libPic] ffmpeg exit with code',code,'. ');
            }
            if (!fs.existsSync(`${process.env['ydpSysRootPath']}/tmp/${fn}.png`)){
                reject(outTxt);
                return;
            }
            var res = fs.readFileSync(`${process.env['ydpSysRootPath']}/tmp/${fn}.png`);
            fs.unlinkSync(`${process.env['ydpSysRootPath']}/tmp/${fn}.png`);
            fs.unlinkSync(`${process.env['ydpSysRootPath']}/tmp/${fn}.${extname}`);
            resolve(res);
        });
    });
}

export async function offlinePic(data){
    var img;
    try{
        img = await imageJs.Image.load(data);
    }catch(e){
        console.warn(e);
        return '';
    }
    return `data:image/png;base64,${img.toBase64('png')}`;
}

export async function processPic(path) {
    //console.log(path);
    if (path == '/favicon.ico')
        return {
            buff: Buffer.from('you request /favicon.ico'),
            type: 'text/plain'
        };
    var url = libEncode.decode(path.split('/')[1]);
    var opt = JSON.parse(libEncode.decode(path.split('/')[2]));
    console.log('[libPic] receive a request',url, opt);
    var dataType = '';
    var data = await (async () => {
        return new Promise((resolve, reject) => {
            var u = new URL(url);
            var freq = (u.protocol == 'https:') ? https : http;
            var req = freq.request({ host: u.host, hostname: u.hostname, protocol: u.protocol, servername: u.host, path: u.pathname + u.search, port: u.port, method: 'GET', headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36', 'Accept-Encoding':'gzip, deflate, br','Accept':'image/webp,image/*;q=0.8' },lookup:sharedLib.dnsLookup });
            var data = [];
            var encoding = '';
            req.on('response', (res) => {
                dataType = res.headers['content-type'];
                if (typeof res.headers['content-encoding'] =='string') encoding = res.headers['content-encoding'];
                res.on('data', (d) => {
                    data.push(Buffer.from(d));
                });
                res.on("error", (e) => {
                    reject(e);
                });
                res.on("end", () => {
                    if (encoding!=''){
                        resolve(sharedLib.decompress(encoding,Buffer.concat(data)));
                        return;
                    }
                    resolve(Buffer.concat(data));
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.end();
        });
    })();
    console.log('[libPic] receive a',dataType,'from',url);
    if (!dataType.startsWith('image/')){
        console.log('not an image: ',dataType);
        return {
            buff: Buffer.from('Not an image: '+dataType),
            type: 'text/plain'
        };
    }
    if (dataType.includes('webp')){
        try{
            data = await ffmpegDecodeToPng(data,'webp');
        }catch(e){
            console.log('[libPic] ffmpegDecodeToPng fail.\n',e);
            return {
                buff: Buffer.from('[libPic] ffmpegDecodeToPng fail.\n'+String(e)),
                type: 'text/plain'
            };
        }
    }
    if (dataType.includes('gif')){
        try{
            data = await ffmpegDecodeToPng(data,'gif');
        }catch(e){
            console.log('[libPic] ffmpegDecodeToPng fail.\n',e);
            return {
                buff: Buffer.from('[libPic] ffmpegDecodeToPng fail.\n'+String(e)),
                type: 'text/plain'
            };
        }
    }
    if (dataType.includes('svg')){
        console.log('svg');
        var svgOpt = JSON.parse(libEncode.decode(path.split('/')[3]));
        return {
            buff: Buffer.from(sharedLib.svgDealer(data.toString(),svgOpt)),
            type: 'image/svg+xml'
        };
    }

    if (opt.cutRepeatWidth > opt.maxWidth)
        throw 'ilvaild cutRepeatWidth';
    var img;
    try {
        img = await imageJs.Image.load(data);
    }
    catch (e) {
        console.log('[libPic] load pic fail, trying ffmpeg. \n',e);
        try{
            data = await ffmpegDecodeToPng(data,'pic');
            img = await imageJs.Image.load(data);
        }catch(ee){
            console.log('[libPic] try ffmpeg failed. \n',ee);
            return {
                type: 'text/plain',
                buff:Buffer.from(`${url}\n${JSON.stringify(opt)}\n${ee}`)
            };
        }
    }
    console.log('[libPic] load pic successfully, height,width => ',img.height,',', img.width,'.');
    if (img.width < opt.maxWidth) {
        return {
            buff:Buffer.from(img.toBuffer({ format: 'png' })),
            type: 'image/png'
        };
    }
    if ((opt.maxWidth / img.width) >= opt.minResizeRate) {
        return {
            buff: Buffer.from(img.resize({ width: opt.maxWidth }).toBuffer({ format: 'png' })),
            type: 'image/png'
        };
    }
    var n = (-Math.floor((-(img.width - opt.maxWidth)) / (opt.maxWidth - opt.cutRepeatWidth))) + 1;
    console.log(n);
    //var nimg = imageJs.Image.createFrom(img,{width:opt.maxWidth,height:n*img.height});
    var nimg = img.clone().resize({ width: opt.maxWidth, height: n * img.height });
    for (var i = 0; i < n - 1; i++) {
        let nnimg = img.crop({ x: (i * (opt.maxWidth - opt.cutRepeatWidth)), width: (img.width - (opt.maxWidth + i * (opt.maxWidth - opt.cutRepeatWidth)) - opt.maxWidth) > 0 ? opt.maxWidth : (img.width - (opt.maxWidth + i * (opt.maxWidth - opt.cutRepeatWidth))) });
        //return Buffer.from(nnimg.toBuffer({format:'jpg'}));
        nimg = nimg.insert(nnimg, { x: 0, y: (n) * img.height });
    }
    return {
        buff: Buffer.from(nimg.toBuffer({ format: 'png' })),
        type: 'image/png'
    };
}
export async function processLagacy(Url, nowUrl, processServerHost, opt,svgOpt) {
    return new Promise((resolve, reject) => {
        try {
            /*
            if (!processServerHost.startsWith('http://'))
                processServerHost = `http://${processServerHost}`;
            if (!processServerHost.endsWith('/'))
                processServerHost = `${processServerHost}/`;
            var url = '';
            var uobj = new URL(nowUrl);
            if (Url.trim().length == 0) {
                resolve([]);
                return;
            }
            if (Url.startsWith('//')) url = `${uobj.protocol}${Url}`;
            if (url=='' && Url.startsWith('/')) url = `${uobj.protocol}//${uobj.host}${Url}`;
            if (url=='' && Url.startsWith('data:image/')) url = Url;
            if (url=='') url = `${uobj.protocol}//${uobj.host}${uobj.pathname}/${Url}`;
            var oopt = libEncode.encode(JSON.stringify(opt));
            if (!url.startsWith('https://') && !url.startsWith('http://')) {
                if (url.startsWith('data:image/svg+xml;utf8,')) {
                    resolve([]);
                    return;
                }
                //resolve([`  \n<img src="${url}"/>  \n`]);
                resolve([{ type: 'pic', title: 'pic', data: `${url}`, tip: '' }]);
                return;
            }
            var u = new URL(url);
            var freq = (u.protocol == 'https:') ? https : http;
            var req = freq.request({ host: u.host, hostname: u.hostname, protocol: u.protocol, servername: u.host, path: u.pathname + u.search, port: u.port, method: 'GET', headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36' } });
            req.on('response', (res) => {
                if (typeof res.headers['content-type'] != 'string') {
                    try {
                        res.destroy();
                    }
                    catch (e) { }
                    resolve([{ type: 'pic', title: 'pic', data: `${processServerHost}${libEncode.encode(url)}/${oopt}`, tip: '' }]);
                    return;
                }
                if (res.headers['content-type'].includes('svg')) {
                    var data = '';
                    res.on('data', (d) => {
                        data += String(d);
                    });
                    res.on("end", () => {
                        try {
                            res.destroy();
                        }
                        catch (e) { }
                        var t = data.split('>')[0];
                        var w = t.split(' width="')[1];
                        w = (typeof w == 'string') ? w.split('"')[0] : '';
                        var h = t.split(' height="')[1];
                        h = (typeof h == 'string') ? h.split('"')[0] : '';
                        const f = (tx) => {
                            var t = tx.split('');
                            while (true) {
                                var tt = t.pop();
                                if (!(/[a-z]/.test(tt))) {
                                    t.push(tt);
                                    return t.join('');
                                }
                            }
                        };
                        var ww = (w.length > 0) ? parseFloat(f(w)) : -1;
                        var hh = (h.length > 0) ? parseFloat(f(h)) : -1;
                        while (true) {
                            if (ww < 0)
                                break;
                            if (ww * 10 > opt.maxWidth) {
                                break;
                            }
                            ww *= 10;
                            if (w.includes('ex'))
                                break;
                        }
                        while (true) {
                            if (hh < 0)
                                break;
                            if (hh * 10 > opt.maxWidth) {
                                break;
                            }
                            hh *= 10;
                            if (h.includes('ex'))
                                break;
                        }
                        if (ww > 0)
                            data = data.replace(w, `${ww}px`);
                        if (hh > 0)
                            data = data.replace(h, `${hh}px`);
                        data = data.replaceAll(' style="', ' style="color:white;').replaceAll('ex" ', 'px" ');
                        console.log(data);
                        //resolve([`  \n<img src="data:image/svg+xml;base64,${libEncode.base64(data)}"/>  \n`]);
                        resolve([{ type: 'pic', title: 'pic', data: `data:image/svg+xml;base64,${libEncode.base64(data)}`, tip: '' }]);
                        return;
                        //resolve([]);
                    });
                    res.on("error", (e) => {
                        reject(e);
                    });
                }
                else {
                    try {
                        res.destroy();
                    }
                    catch (e) { }
                    resolve([{ type: 'pic', title: 'pic', data: `${processServerHost}${libEncode.encode(url)}/${oopt}`, tip: '' }]);
                    return;
                }
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.end();
            */
           var o = sharedLib.picProcess(Url,nowUrl,processServerHost,JSON.stringify(opt),svgOpt);
           if (o.trim().length==0) resolve([]);
           resolve([{ type: 'pic', title: 'pic', data: o, tip: '' }]);
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
}
