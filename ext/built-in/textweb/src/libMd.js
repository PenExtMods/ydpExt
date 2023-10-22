export function splitBlock(txt) {
    var out = [];
    if (txt[0] != '[' && txt[0] != '(') {
        out.push('');
    }
    var stack = [];
    var skipBlockTarget = null;
    for (var i = 0; i < txt.length; i++) {
        if (skipBlockTarget!=null){
            if (txt[i]=='\\'){
                skipBlockTarget[skipBlockTarget.length-1] += txt.slice(i,i+2);
                i++;
                continue;
            }
            skipBlockTarget[skipBlockTarget.length-1] += '\`';
            if (txt[i]=='\`'){
                skipBlockTarget = null;
                continue;
            }
            continue;
        }
        switch (txt[i]) {
            case '\`':{
                let target = out;
                if (stack.length>0){
                    target = out[out.length-1];
                    for (let ii = 1; ii < stack.length - 1; ii++) {
                        target = target.content[target.content.length - 1];
                    }
                    target = target.content;
                }
                target.push('\`');
                skipBlockTarget = target;
                break;
            }
            case '(':
            case '[': {
                //console.log(stack);
                //console.log(out[out.length-1]);
                let o = { type: (txt[i] == '[' ? '[]' : '()'), content: [] };
                if (stack.length == 0)
                    out.push(o);
                if (stack.length > 0) {
                    let target = out[out.length - 1];
                    for (let ii = 1; ii < stack.length - 1; ii++) {
                        target = target.content[target.content.length - 1];
                    }
                    target.content.push(o);
                }
                stack.push(txt[i]);
                break;
            }
            case ')':
            case ']': {
                if (stack.length == 0){
                    //console.log(txt,txt[i],i);
                    console.warn('txt must be a vaild txt with block');
                    break;
                }
                    
                if (stack[stack.length - 1] != (txt[i] == ']' ? '[' : '(')){
                    console.warn('txt must be a vaild txt with block');
                    break;
                }
                stack.pop();
                break;
            }
            default: {
                let t = (txt[i] == '\\') ? txt.slice(i, i + 2) : txt[i];
                let p = t.length - 1;
                let target = out;
                if (stack.length > 0) {
                    //console.log(stack,out[out.length-1],txt[i]);
                    for (let ii = 0; ii < stack.length; ii++) {
                        //console.log(target);
                        target = target[target.length - 1].content;
                    }
                }
                if (typeof target[target.length - 1] != 'string')
                    target.push('');
                target[target.length - 1] += t;
                i += p;
                break;
            }
        }
    }
    return out;
}



function splitMdCodeBlock(txt) {
    var out = [];
    var st = txt.split('\`\`\`');
    for (var i = 0; i < st.length; i++) {
        if (i % 2 == 0) {
            if (st[i].length > 0)
                out.push(st[i]);
        }
        else {
            out.push({ type: 'code', content: st[i] });
        }
    }
    return out;
}
function splitMd(txt) {
    var out = [];
    splitMdCodeBlock(txt).forEach(c => {
        if (typeof c == 'object') {
            out.push(c);
            return;
        }
        if (typeof c != 'string')
            throw new TypeError('invaild return result from splitMdCodeBlock');
        out = out.concat(splitBlock(c));
    });
    return out;
}
export function joinCodeBlock(obj) {
    var out = [];
    obj.forEach(c => {
        if (c.type == 'code') {
            out.push(`\`\`\`${c}\`\`\``);
        }
        else {
            out.push(c);
        }
    });
    return out;
}
function joinBlock(obj) {
    var out = [];
    obj.forEach(c => {
        if (c.type != '[]' && c.type != '()') {
            out.push(c);
            return;
        }
        var stack = [0];
        var t = (c.type == '[]') ? '[' : '(';
        while (stack.length > 0) {
            //console.log(out[out.length-2],out[out.length-1],stack);
            var target = c;
            var lastPos = stack.pop();
            stack.forEach(i => {
                target = target.content[i];
            });
            if (target.content.length <= lastPos) {
                if (stack.length > 0)
                    stack[stack.length - 1]++;
                t += ((target.type == '[]') ? ']' : ')');
                continue;
            }
            target = target.content[lastPos];
            //console.log(target);
            if (typeof target == 'string') {
                t += target;
                stack.push(lastPos + 1);
                continue;
            }
            t += ((target.type == '[]') ? '[' : '(');
            stack.push(lastPos);
            stack.push(0);
        }
        out.push(t);
    });
    return out;
}
export function makeMd(obj) {
    var out = '';
    obj.forEach(c => {
        switch (c.type) {
            case undefined: {
                out += String(c);
                break;
            }
            case 'code': {
                out += `\`\`\`${c.content}\`\`\``;
                break;
            }
            case 'link': {
                out += ` [${c.txt.replace(/(?<=[^\\+])[\[]/g, '\\[').replace(/(?<=[^\\+])[\]]/g, '\\]')}](${c.link}) `;
                break;
            }
            case 'pic': {
                out += `  \n![${c.title}](${c.data}${(c.tip == '') ? '' : ` "${c.tip}"`})  \n`;
                break;
            }
        }
    });
    //out = out.replaceAll(' * ', ' \n* ');
    //console.log(out);
    var oout = [];
    out.split('\n').forEach(c=>{
        if (c.replaceAll('\t','').replaceAll('\r','').trim()!='*') oout.push(c);
    })
    return oout.join('\n');
}
function decodeMdObj(obj) {
    var out = [];
    for (var i = 0; i < obj.length; i++) {
        if (obj[i].type == '[]') {
            if (i + 1 < obj.length) {
                if (obj[i + 1].type == '()') {
                    var preData = joinBlock(obj[i + 1].content).join('').split(' ');
                    var txt = joinBlock(obj[i].content).join('');
                    var tip = (preData.length > 1) ? preData.pop() : '';
                    var data = preData.join(' ');
                    tip = tip.slice(1, tip.length - 1);
                    if (typeof out[out.length - 1] == 'string') {
                        if (out[out.length - 1].endsWith('!')) {
                            out[out.length - 1] = out[out.length - 1].slice(0, out[out.length - 1].length - 1);
                            if (out[out.length - 1].trim().length == 0)
                                out.pop();
                            out.push({ type: 'pic', title: txt, data: data, tip: tip });
                            i++;
                            continue;
                        }
                    }
                    out.push({ type: 'link', txt: txt, link: data, tip: tip });
                    i++;
                    continue;
                }
            }
        }
        if (obj[i].type == '()' || obj[i].type == '[]') {
            out.push(joinBlock([obj[i]]).join(''));
            continue;
        }
        out.push(obj[i]);
    }
    return out;
}
export function concatMdObj(obj) {
    var out = [0];
    obj.forEach(c => {
        if (typeof c == 'string' && typeof out[out.length - 1] == 'string') {
            out[out.length - 1] += c;
            return;
        }
        if (c.type == 'link' && out[out.length - 1].type == 'link' && c.link == out[out.length - 1].link && c.tip == out[out.length - 1].tip) {
            out[out.length - 1].txt += c.txt;
            return;
        }
        out.push(c);
    });
    out.shift();
    return out;
}
export function decodeMd(txt) {
    var out = [];
    decodeMdObj(splitMd(txt)).forEach(c => {
        if (c.type == 'link') {
            decodeMdObj(splitMd(c.txt)).forEach(cc => {
                if (cc.type == 'pic') {
                    out.push(cc);
                }
                else {
                    out.push({ type: 'link', txt: makeMd([cc]), link: c.link, tip: c.tip });
                }
            });
            return;
        }
        out.push(c);
    });
    return concatMdObj(out);
}
