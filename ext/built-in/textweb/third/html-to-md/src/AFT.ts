import { AFTSvgProcessOpt } from "./type";

function encode(txt:string) {
    return Buffer.from(txt).toString('hex');
}

function base64(str:string) {
    const binString = Array.from(new TextEncoder().encode(str), (x) => String.fromCodePoint(x)).join("");
    return btoa(binString);
}
function deBase64(str:string) {
    const binString = atob(str);
    return new TextDecoder().decode(Uint8Array.from(binString, (m:string) => {
        let t = m.codePointAt(0);
        if (typeof t == 'undefined') return 1114112;
        return t;
    }));
}

export function makePicUrl(url: string, processServerHost: string, processPicOpt: string,processSvgPicOpt:AFTSvgProcessOpt) {
    if (!processServerHost.startsWith('http://'))
        processServerHost = `http://${processServerHost}`;
    if (!processServerHost.endsWith('/'))
        processServerHost = `${processServerHost}/`;
    return `${processServerHost}${encode(url)}/${encode(processPicOpt)}/${encode(JSON.stringify(processSvgPicOpt))}`;
}

export function smartURL(url: string, nowUrl: string) {
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

function svgDealer(src:string,opt:AFTSvgProcessOpt){
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
    const f = (input:string)=>{
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

export function picProcess(data:string,nowUrl:string,picProcessHost:string,picProcessOpt:string,picSvgProcessOpt:AFTSvgProcessOpt){
    if (data.startsWith('data:image/svg+xml;utf8,') || data.startsWith('#') || data.startsWith('javascript:')) return '';
    if (data.startsWith('data:image/svg+xml;base64,')){
        return `data:image/svg+xml;base64,${base64(svgDealer(deBase64(data.split(',')[1]),picSvgProcessOpt))}`;
    }
    if (data.startsWith('data:')){
        return data;
    }
    return makePicUrl(smartURL(data,nowUrl),picProcessHost,picProcessOpt,picSvgProcessOpt);
}

export function wrapPic(type:'a'|'li',picNoWrap:boolean,str:string,data:string,layer:number,linkIndex:number){
    if (layer>3) layer = 3;
    //str = str.replace(/[☈]/g,'');
    //console.log('in',str);
    if (type=='li' && picNoWrap) return str;
    var out:string[] = [];
    var o = '';
    var linkIndexTxt = (linkIndex==-1) ? '' : `\\[${linkIndex}\\]`;
    str.split('\n').forEach(c=>{
        if (c.replace(/[ \*☈]/g,'').trim().length==0) return;
        if (c.startsWith('![') && c.endsWith(')') && c.includes('](')){
            let t = out.join('').trim();
            if (t.length>0){
                if (type=='a') o+= ` [${t}${linkIndexTxt}](${data}) `;
                if (type=='li'){
                    if (!t.startsWith('* ') && !t.startsWith('☈☈')){
                        if(o.length>0) o += `\n${'☈☈'.repeat(layer-1)}* `;
                        if (o.length==0) o+= `* `;
                    }else{
                        t = `\n${t}`;
                    }
                    o += t;
                }
                //console.log(t,o);
            }
            if (picNoWrap) o+=`\n${c}\n`;
            if (!picNoWrap) o+= `\n\n  \n${c}  \n\n\n`;
            out = [];
            return;
        }
        var d = c; 
        if (c.trim().startsWith('☈☈') && !c.trim().includes('☈☈* ') && type=='li'){
            d = '';
            var tt = c.trim();
            for(var i=0;i<tt.length;i++){
                if (tt[i]=='☈'){
                    d+='☈';
                    continue;
                }
                d+=`* ${c.replace(d,'')}`;
                break;
            }
        }
        out.push((type=='li') ? `${(o.length>0 || out.length>0)?`\n`:''}${(d.trim().startsWith('☈☈') || d.trim().startsWith('* ')) ? '' : `${'☈☈'.repeat(layer-1)}* `}${d}` : c);
    });
    if (out.length>0){
        if (type=='a') o+=` [${out.join('').trim()}${linkIndexTxt}](${data}) `;
        //if (type=='li') o+=`${o.length>0 ? `\n${'*'.repeat(layer)}` : '* '}${out.join('').trim()}`;
        if (type=='li') o+= out.join('');
    }
    //console.log('ret',o);
    return o;
}