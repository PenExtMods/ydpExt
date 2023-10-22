import * as md from "./libMd.js";
import * as pic from "./libPic.js";
import * as http from "node:http";
import * as https from "node:https";
import * as html2md from "html-to-md";
import * as encode from "./libEncode.js";
import * as random from "./libRandom.js";
import * as zlib from "node:zlib";
import * as fs from "node:fs";
import * as dns from "node:dns";

export {md,pic,encode,random};
const html2mdFix = html2md.default;

https.globalAgent.options.keepAlive = true;

export function dnsLookup(hostname,...args){
    var callback = (err,address,family)=>{};
    args.forEach(c=>{
        if (typeof c == 'function') callback = c;
    });
    dns.resolve4(hostname,(e,address)=>{
        var result = (Array.isArray(address)) ? address[0] : undefined;
        if (result!=undefined){
            console.log(`[dns] resolve ${hostname} to ${result} .`);
        }else{
            console.error(`[dns] failed to solve ${hostname}.\n`,e);
        }
        callback(e,result,(result==undefined?undefined:4));
    });
}

export function decompress(format,buff){
    switch (format){
        case 'br':{
            return zlib.brotliDecompressSync(buff);
        }
        case 'gzip':{
            return zlib.gunzipSync(buff);
        }
        case 'deflate':{
            return zlib.inflateSync(buff);
        }
    }
    return buff;
}


export function lagacyGetHtmlTitle(src, empty) {
    var t = src.split('<title>');
    if (t.length == 1)
        return empty;
    t.shift();
    t = t.join('<title>').split('</title>');
    if (t[0].length==0) return empty;
    return t[0];
}
export function getHtmlTitle(src, empty,smartTitle) {
    var t = src.split('<title>');
    if (t.length == 1)
        return (smartTitle.length>0) ? smartTitle : empty;
    t.shift();
    t = t.join('<title>').split('</title>');
    if (t[0].length==0) return (smartTitle.length>0) ? smartTitle : empty;
    return t[0];
}
export function render(input,extraData) {
    var url = new URL(input.context.context.url);
    var opt = Object.assign({
        ignoreTags: ['','style', 'head', '!doctype', 'form', 'svg', 'noscript', 'script', 'meta','!DOCTYPE'],
        skipTags: ['div', 'html', 'body', 'nav', 'section', 'footer', 'main', 'aside', 'article', 'header',"abbr","acronym","address","applet","area","article","aside","audio","base","basefont","bdi","bdo","bgsound","big","blink","body","button","canvas","caption","center","circle","cite","clipPath","col","colgroup","command","content","data","datalist","dd","defs","details","dfn","dialog","dir","div","dl","dt","element","ellipse","embed","fieldset","figcaption","figure","font","footer","foreignObject","frame","frameset","g","header","hgroup","html","iframe","image","ins","isindex","kbd","keygen","label","legend","line","linearGradient","link","listing","main","map","mark","marquee","mask","math","menu","menuitem","meter","multicol","nav","nextid","nobr","noembed","noframes","object","optgroup","option","output","param","path","pattern","picture","plaintext","polygon","polyline","progress","q","radialGradient","rb","rbc","rect","rp","rt","rtc","ruby","samp","section","select","shadow","slot","small","source","spacer","stop","strike","sub","summary","sup","template","text","textarea","tfoot","time","title","track","tspan","tt","u","var","video","wbr","xmp"],
        emptyTags: [],
        aliasTags: {
            'figure': 'p',
            'dl': 'p',
            'dd': 'p',
            'dt': 'p',
            'figcaption': 'p'
        },
        enableATF: true,
        extraData: extraData,
        renderCustomTags: false
    }, input.option);
    if (!Buffer.isBuffer(input.context.body))
        throw new TypeError('input.context.body must be a Buffer');
    // fix for windows \r\n
    var body = input.context.body.toString().replaceAll('\r\n','\n');

    /* ## now this part done in html-to-md
    // fix for moegirl not end tag
    if (!body.includes('</body>') && (body.includes('<body>')||body.includes('<body '))) body += '\n</body>\n';
    if (!body.includes('</html>') && (body.includes('<html>')||body.includes('<html '))) body += '\n</html>\n';
    */

    return {
        txt: html2mdFix(body, opt, true),
        suggest: [],
        title: getHtmlTitle(input.context.body.toString(), url.host,extraData.head.txt)
    };
}
export function lagacyRender(input) {
    var url = new URL(input.context.context.url);
    var opt = Object.assign({
        ignoreTags: ['','style', 'head', '!doctype', 'form', 'svg', 'noscript', 'script', 'meta','!DOCTYPE'],
        skipTags: ['div', 'html', 'body', 'nav', 'section', 'footer', 'main', 'aside', 'article', 'header'],
        emptyTags: [],
        aliasTags: {
            'figure': 'p',
            'dl': 'p',
            'dd': 'p',
            'dt': 'p',
            'figcaption': 'p'
        },
        renderCustomTags: false
    }, input.option);
    if (!Buffer.isBuffer(input.context.body))
        throw new TypeError('input.context.body must be a Buffer');
    return {
        txt: html2mdFix(input.context.body.toString().replaceAll('\r\n','\n'), opt, true),
        suggest: [],
        title: lagacyGetHtmlTitle(input.context.body.toString(), url.host)
    };
}

export async function offlineSave(txt,pics,progressCb=(now,total)=>{}){
    var out = txt;
    for(let i=0;i<pics.length;i++){
        progressCb(i,pics.length);
        let c = pics[i];
        if (c.trim().length==0) continue;
        if (c.startsWith('data:')) continue;
        if (!c.startsWith('https://') && !c.startsWith('http://')) continue;
        var context = {
            url: c,
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            cookie: '',
            refer: c
        };
        var req = {
            context: context,
            body: null,
            method: 'GET',
            header: {}
        };
        var res = await fetch(req);
        if (!Buffer.isBuffer(res.body)){
            out = out.replaceAll(`![pic](${c})`,'![pic]()');
            continue;
        }
        if (res.body.length==0){
            out = out.replaceAll(`![pic](${c})`,'![pic]()');
            continue;
        }
        var type = res.header['content-type'];
        if (typeof type!='string'){
            out = out.replaceAll(`![pic](${c})`,'![pic]()');
            continue;
        }
        if (type.includes('svg')){
            out = out.replaceAll(`![pic](${c})`,`![pic](data:image/svg+xml;base64,${encode.base64(res.body.toString())})`);
            continue;
        }
        var u = await pic.offlinePic(res.body);
        out = out.replaceAll(`![pic](${c})`,`![pic](${u})`);
    };
    progressCb(pics.length,pics.length);
    return out;
}

export async function lagacyProcess(input, processServerHost) {
    return new Promise(async (resolve, reject) => {
        try{
            var out = [];
            var links = [];
            var pics = [];
            //var url = new URL(input.url);
            var obj = md.decodeMd(input.context.txt);
            for (var i = 0; i < obj.length; i++) {
                var c = obj[i];
                switch (c.type) {
                    case 'code':
                    default:
                    case undefined: {
                        out.push(c);
                        break;
                    }
                    case 'link': {
                        if (typeof c.link != 'string') {
                            out.push(c);
                            break;
                        }
                        if (typeof c.txt != 'string') {
                            out.push(c);
                            break;
                        }
                        //c.tip = '';
                        c.txt = c.txt.replaceAll('\n', '');
                        if (c.link.startsWith('javascript:'))
                            c.link = '#';
                        /*
                        if (!c.link.startsWith('https://') && !c.link.startsWith('http://') && !c.link.startsWith('/')) {
                            out.push(c);
                            break;
                        }
                        */
                        //var lnk = (c.link.startsWith('/') ? `${url.host}${c.link}` : `${input.url}/${c.link}`);
                        var lnk = smartURL(c.link,input.url);
                        if (lnk != '' && !links.includes(lnk))
                            links.push(lnk);
                        let o = Object.assign({}, c);
                        if (links.indexOf(lnk)!=-1) o.txt += `\\[${links.indexOf(lnk)}\\]`;
                        out.push(o);
                        //console.log(o);
                        break;
                    }
                    case 'pic': {
<<<<<<< HEAD
                        let o = await pic.process(c.data, input.url, processServerHost, input.opt,input.svgOpt);
=======
                        let o = await pic.processLagacy(c.data, input.url, processServerHost, input.opt,input.svgOpt);
>>>>>>> 5220509 (init.)
                        if (!pics.includes(o[0].data)) pics.push(o[0].data);
                        out = out.concat(o);
                        break;
                    }
                }
            }
            //console.log(md.makeMd(out));
            resolve({
                title: input.context.title,
                suggest: input.context.suggest,
                links: links,
                txt: md.makeMd(out),
                pics: pics
            });
        }catch(e){
            reject(e);
        }
    });
}
export async function fetch(request) {
    return new Promise((resolve, reject) => {
        var url = new URL((request.context.url.includes('%')?request.context.url:encodeURI(request.context.url)));
        var rurl = new URL((request.context.refer.includes('%')?request.context.refer:encodeURI(request.context.refer)));
        var header = Object.assign({}, request.header);
        header['User-Agent'] = request.context.ua;
        header['Host'] = url.host;
        header['Referer'] = `${rurl.protocol}//${rurl.host}/`;
        header['Accept-Encoding'] = 'gzip, deflate, br';
        header['Connection'] = 'keep-alive';
        if (request.context.cookie.length > 0)
            header['Cookie'] = request.context.cookie;
        var opt = { host: url.host, hostname: url.hostname, protocol: url.protocol, servername: url.host, method: request.method, headers: header, path: (url.pathname.trim().length==0 ? '/' : url.pathname) + url.search, port: (url.port == '') ? null : url.port,setHost:false,lookup:dnsLookup };
        var req;
        if (url.protocol == 'https:')
            req = https.request(opt);
        if (url.protocol == 'http:')
            req = http.request(opt);
        var data = [];
        req.on("response", (res) => {
            if (res.statusCode == 301 || res.statusCode == 302 || res.statusCode == 307 || res.statusCode == 308) {
                var rreq = Object.assign({}, request);
                rreq.context.url = smartURL(res.headers['location'],request.context.url);
                var r = fetch(rreq);
                r.then((v) => {
                    resolve(v);
                });
                r.catch((e) => {
                    reject(e);
                });
                return;
            }
            var out = {
                context: request.context,
                body: null,
                header: res.headers,
                code: res.statusCode,
                msg: res.statusMessage
            };
            res.on("error", (e) => {
                reject(e);
                try {
                    res.destroy();
                }
                catch (ee) { }
            });
            res.on("data", (c) => {
                data.push(Buffer.from(c));
            });
            res.on("end", () => {
                if (data.length > 0)
                    out.body = decompress(res.headers['content-encoding'],Buffer.concat(data));
                resolve(out);
            });
        });
        req.on("error", (e) => {
            reject(e);
        });
        if (request.body != null)
            req.write(request.body);
        req.end();
    });
}

export function makePicUrl(url, processServerHost, processPicOpt,processSvgPicOption) {
    if (!processServerHost.startsWith('http://'))
        processServerHost = `http://${processServerHost}`;
    if (!processServerHost.endsWith('/'))
        processServerHost = `${processServerHost}/`;
    return `${processServerHost}${encode.encode(url)}/${encode.encode(processPicOpt)}/${encode.encode(JSON.stringify(processSvgPicOption))}`;
}

export function smartURL(url, nowUrl) {
    if (typeof url!='string') throw new TypeError('url must be a string');
    if (typeof nowUrl!='string') throw new TypeError('nowUrl must be a string');
    var u = new URL(nowUrl);
    if (url.trim().length==0) return '';
    if (url.startsWith('https://')) return url;
    if (url.startsWith('http://')) return url;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('#')) return url;
    if (url.startsWith('javascript:')) return '#';
    if (url.startsWith('//')) return `${u.protocol}${url}`;
    if (url.startsWith('/')) return `${u.protocol}//${u.host}${url}`;
    if (u.pathname.endsWith('/')) return `${u.protocol}//${u.host}${u.pathname}${url}`;
    let t = u.pathname.split('/');
    t.pop();
    return `${u.protocol}//${u.host}${t.join('/')}/${url}`;
}

export function svgDealer(src,opt){
    if (src.includes(' style="')){
        src = src.replace(/( style=")/g,' style="color:white;');
    }else{
        src = src.replace('<svg','<svg style="color:white;"');
    }
    if (!src.includes(' height="')){
        src = src.replace('<svg',`<svg height="${opt.maxHight}px"`);
    }
    if (!src.includes(' width="')){
        src = src.replace('<svg',`<svg width="${opt.maxWidth}px"`);
    }
    const f = (input)=>{
        var o = input.split('');
        while (/a-zA-Z/.test(o[o.length-1])){
            o.pop();
            if (o.length==0) break;
        }
        return o.join('');
    };
    var w = src.split(' width="')[1].split('"')[0];
    var wn = parseFloat(f(w));
    var h = src.split(' height="')[1].split('"')[0];
    var hn = parseFloat(f(h));
    if (wn==0) wn = opt.maxWidth;
    if (hn==0) hn = opt.maxHight;
    if (w.includes('ex') && h.includes('ex')){
        hn*=10;
        wn*=10;
    }else{
        hn = (opt.maxWidth/wn) * hn;
        wn = opt.maxWidth;
    }
    if (wn>opt.maxWidth){
        hn = (opt.maxWidth/wn) * hn;
        wn = opt.maxWidth;
    }
    if (hn>opt.maxHight){
        wn = (opt.maxHight/hn);
        hn = opt.maxHight;
    }
    src = src.replace(` width="${w}"`,` width="${wn}px"`);
    src = src.replace(` height="${h}"`,` height="${hn}px"`);
    return src;
}

export function picProcess(data,nowUrl,picProcessHost,picProcessOpt,picSvgProcessOpt){
    if (data.startsWith('data:image/svg+xml;utf8,') || data.startsWith('#') || data.startsWith('javascript:')) return '';
    if (data.startsWith('data:image/svg+xml;base64,')){
        return `data:image/svg+xml;base64,${encode.base64(svgDealer(encode.deBase64(data.split(',')[1]),picSvgProcessOpt))}`;
    }
    if (data.startsWith('data:')){
        return data;
    }
    return makePicUrl(smartURL(data,nowUrl),picProcessHost,picProcessOpt,picSvgProcessOpt);
}

export function loadCookie(host,cookieDir){
    if (cookieDir.endsWith('/')) cookieDir = cookieDir.slice(0,cookieDir.length-1);
    var list = fs.readdirSync(cookieDir);
    var thost = host.split('.');
    var out = '';
    while (thost.length>0){
        let nowName = `${thost.join('.')}.json`;
        thost.shift();
        if (list.includes(nowName)){
            let o = {
                cookie:'',
                banSite: []
            };
            try{
                o = Object.assign(o,JSON.parse(fs.readFileSync(`${cookieDir}/${nowName}`).toString()));
            }catch(e){}
            o.cookie = o.cookie.trim();
            if (o.cookie.length==0 || o.banSite.includes(host)) continue;
            if (o.cookie.endsWith(';')) o.cookie = o.cookie.slice(0,o.cookie.length-1);
            if (!out.trim().endsWith(';') && out.length!=0) out += '; ';
            out += o.cookie;
        }
        //thost.shift();
    }
    return out;
}