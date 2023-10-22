
import * as https from 'node:https';

const target = {
    'moegirl':'zh.moegirl.org.cn'
};

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

var nowTargetHost = '';
var nowMatch = '';

export async function handle(context, input) {
    return new Promise((resolve,reject)=>{
        try{
            if (input == context.url) {
                var url = new URL(context.url);
                nowMatch = url.host.split('.')[0];
                if (typeof target[nowMatch] =='string') nowTargetHost = target[nowMatch];
                if (nowTargetHost=='') return {
                    txt: `### Wiki for textweb\nError: not any target match "${nowMatch}".`,
                    title: nowMatch + ' - Wiki for tweb',
                    suggest: ['close'],
                    links: []
                }
                resolve({
                    txt: `### Wiki for textweb\nNow target is "${nowMatch}".  \nType text to search.`,
                    title: nowMatch + ' - Wiki for tweb',
                    suggest: ['>Warma'],
                    links: []
                });
                return;
            }
            if (nowTargetHost=='') resolve({
                txt: `### Wiki for textweb\nError: not any target match "${nowMatch}".`,
                title: nowMatch + ' - Wiki for tweb',
                suggest: ['close'],
                links: []
            });
        
            var req = https.request({host:nowTargetHost,hostname:nowTargetHost,servername:nowTargetHost,method:'GET',port:443,path:`/api.php?action=opensearch&redirects=resolve&search=${encodeURIComponent(input)}`,headers:{'user-agent':ua,'accept':'application/json'}});
        
            req.on("error",(e)=>{
                console.log(e);
                reject(e);
            });
        
            req.on('response',(res)=>{
                if (res.statusCode!=200){
                    resolve({
                        txt: `### [Error]\n\`\`\`\ncode ${res.statusCode} msg "${res.statusMessage}"`,
                        title: `${input} - ${nowMatch + ' - Wiki for tweb'}`,
                        links: [],
                        suggest: [`>${input}`]
                    });
                    return;
                }
                var data = [];
                res.on('data',(d)=>{
                    data.push(Buffer.from(d));
                });
                res.on('end',()=>{
                    var txt = Buffer.concat(data).toString();
                    console.log(txt);
                    var obj = JSON.parse(txt);
                    var links = obj[3];
                    var titles = obj[1];
                    for (var i=0;i<titles.length;i++){
                        titles[i] = decodeURIComponent(titles[i]);
                    }
                    var out = [];
                    out.push(`### [${nowMatch}] Search result for "${input}"\n======  \n`);
                    titles.forEach(c=>{
                        out.push(`#### ${titles.indexOf(c)}. ${c}  \n`);
                    });
                    resolve({
                        txt: out.join('  \n'),
                        title: `${input} - ${nowMatch + ' - Wiki for tweb'}`,
                        links: links,
                        suggest: []
                    });
                });
            });
            req.end();
        }catch(e){
            console.log(e);
            reject(e);
        }
    });
}