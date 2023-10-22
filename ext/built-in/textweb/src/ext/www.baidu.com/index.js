import * as https from "node:https";
import * as fs from "node:fs";
import * as sharedLib from "../../sharedLib.js";
var page = 1;
var wd = '';
const cookiePath = `${process.env['basePath']}/ext/www.baidu.com/cookie.txt`;

export async function handle(context, input) {
    if (input == context.url) {
        return {
            txt: '### Baidu\nType text to search.',
            title: 'Baidu',
            suggest: ['>电阻率','>电阻率 知乎','>西瓜图片'],
            links: []
        };
    }
    switch (input) {
        case '#nextPage': {
            page++;
            break;
        }
        case '#previousPage': {
            if (page > 1)
                page--;
            break;
        }
        default: {
            page = 1;
            wd = input;
            break;
        }
    }
    var cookie = '';
    if (fs.existsSync(cookiePath)) cookie = fs.readFileSync(cookiePath).toString();
    var res = await baidu(wd, page,cookie);
    var out = [];
    var links = [];
    out.push(`### Search result for "${wd}"\n#### Page ${page}  \n\=\=\=\=\=\=  \n`);
    res.forEach(c => {
        links.push(c.url);
        var date = '';
        if (c.date.length > 0) {
            var dd = new Date(parseInt(c.date) * 1000);
            //dd.setUTCDate(parseInt(c.date));
            date = dd.toLocaleString();
        }
        out.push(`### ${links.length - 1}.${c.name}\n#### ${c.site}\n${date}  \n\`\`\`\n${c.preview}\n\`\`\``);
    });
    return {
        txt: out.join('  \n'),
        title: `${wd} - Baidu`,
        links: links,
        suggest: ['>#nextPage', '>#previousPage']
    };
}
async function baidu(wd, page,cookie) {
    return new Promise((resolve, reject) => {
        //const wd = 'fes2中铁的化合价';
        //const page = 1;
        var pg = '';
        if (page > 1) {
            pg = `&pn=${page + 1}0`;
        }
        var header = {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "zh-CN,zh;q=0.9,en-GB;q=0.8,en-US;q=0.7,en;q=0.6",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": cookie,
            "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
        };
        var url = new URL(`https://www.baidu.com/s?wd=${encodeURIComponent(wd)}${pg}`);
        var req = https.request({ protocol: 'https:', host: url.host, hostname: url.hostname, servername: url.hostname, port: 443, method: 'GET', headers: header, path: url.pathname + url.search,lookup: sharedLib.dnsLookup }, (res) => {
            var raw = '';
            res.on('data', (d) => {
                raw += String(d);
            });
            res.on('end', () => {
                //console.log(raw);
                //fs.writeFileSync('./raw.html',raw);
                var r = (() => {
                    var t = raw.split('<div id="content_left" tabindex="0">');
                    t.shift();
                    return t.join('');
                })();
                var res = r.split('<!--s-data:');
                res.shift();
                var rres = [];
                res.forEach(resc => {
                    var t = resc.split('-->')[0];
                    var o;
                    try {
                        o = JSON.parse(t);
                    }
                    catch (e) {
                        t = t.replaceAll('\\', '\\\\');
                        t = t.replaceAll('\\\\"', '\\"');
                        t = t.replaceAll('\\\\t', '\\t');
                        t = t.replaceAll('\\\\n', '\\n');
                        o = JSON.parse(t);
                    }
                    rres.push(o);
                });
                //fs.writeFileSync('./outLst.json',JSON.stringify(rres));
                var o = [];
                rres.forEach(c => {
                    var oo = {
                        name: '',
                        site: '',
                        url: '',
                        preview: '',
                        date: ''
                    };
                    try {
                        if (typeof c.calcProcess == 'string') {
                            if (typeof c.result == 'string')
                                oo.name = c.result;
                            oo.site = '计算器';
                            oo.preview = `${c.calcProcess}=${c.result}`;
                            oo.url = '计算器';
                            o.push(oo);
                            return;
                        }
                        if (typeof c.title == 'string')
                            oo.name = c.title;
                        if (typeof c.kgTitle == 'string' && oo.name == '')
                            oo.name = c.kgTitle;
                        if (typeof c.cardTitle == 'string' && oo.name == '')
                            oo.name = c.cardTitle;
                        oo.name = oo.name.replaceAll('<em>', '').replaceAll('</em>', '');
                        var t = oo.name.split(' - ');
                        if (t.length > 1)
                            t.pop();
                        oo.name = t.join(' - ');
                        if (typeof c.contentText == 'string')
                            oo.preview = c.contentText.replaceAll('<em>', '').replaceAll('</em>', '');
                        if (typeof c.source == 'object') {
                            if (typeof c.source.sitename == 'string')
                                oo.site = c.source.sitename;
                        }
                        if (typeof c.source == 'string' && oo.site == '')
                            oo.site = c.source;
                        if (typeof c.tplData == 'object') {
                            if (typeof c.tplData.LinkFoundTime == 'string')
                                oo.date = c.tplData.LinkFoundTime;
                            if (typeof c.tplData.classicInfo == 'object') {
                                if (typeof c.tplData.classicInfo.url == 'string')
                                    oo.url = c.tplData.classicInfo.url;
                            }
                        }
                        if (typeof c.tools == 'object') {
                            if (typeof c.tools.url == 'string' && oo.url == '')
                                oo.url = c.tools.url;
                        }
                        if (oo.site == '' && oo.url != '') {
                            try {
                                var u = new URL(oo.url);
                                //console.log(u.host,u.hostname);
                                if (u.host == 'wenku.baidu.com')
                                    oo.site = '百度文库';
                            }
                            catch (e) {
                                //console.log(e);
                            }
                        }
                        if (oo.url != '')
                            o.push(oo);
                    }
                    catch (e) {
                        return;
                    }
                });
                //fs.writeFileSync('./outObj.json',JSON.stringify(o));
                resolve(o);
            });
        });
        req.end();
    });
}
//var raw = fs.readFileSync('./raw.html').toString();
