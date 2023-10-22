var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _application_page, _application_nowPageId, _application_picServer;
import { extType } from "../../extType.js";
import * as sharedLib from "./sharedLib.js";
import * as fs from "node:fs";
import * as http from "node:http";
const processServerHost = "http://127.0.0.3:2233/";
var processPicOpt = {
    maxWidth: 250,
    minResizeRate: 0,
    cutRepeatWidth: 80
};
var processSvgPicOption = {
    maxHeight: 100,
    maxWidth: 250
};

const picLoadFailTip = fs.readFileSync(`${process.env['basePath']}/picFail.png`);

export function constructor() {
    return new application();
}
const cmds = ['refresh', 'close', 'switch', 'info', 'save', 'show', '#exit'];
const basePath = `${process.env['mtpPath']}/textweb`;
const exportPath = `${basePath}/offline`;
const cookiePath = `${basePath}/cookie`;

var hpsite = ['https://www.baidu.com','https://moegirl.wiki.tweb','https://www.bilibili.com','https://nodejs.org/en', 'https://v1.hitokoto.cn/?c=a&encode=text', 'https://www.runoob.com','https://zh.moegirl.org.cn/Warma' ,'https://cn.bing.com' , 'https://zh.moegirl.org.cn/%E6%90%9E%E5%A7%AC%E6%97%A5%E5%B8%B8', '#exit'];

if (fs.existsSync(`${basePath}/sites.json`)){
    let raw = fs.readFileSync(`${basePath}/sites.json`).toString();
    let obj = {
        sites:[]
    };
    try{
        obj = Object.assign(obj,JSON.parse(raw));
    }catch(e){
        console.warn('[sites] load sites failed, using built-in values. \n',e);
    }
    if (obj.sites.length>0) hpsite = obj.sites.concat(['#exit']);
}

async function newPage(Url, updateCb, doneCb, nowPageId, maxPageId) {
    var out = {
        success: false,
        page: {}
    };
    updateCb('[Loading exts]', maxPageId, maxPageId, []);
    var name = '';
    var extConf = {
        version: 1,
        type: 'config',
        acceptSite: []
    };
    var url;
    try {
        url = new URL(Url);
    } catch (e) {
        updateCb(`[Error] load url failed.  \n\`\`\`\n${e}\n\`\`\``, maxPageId, maxPageId, []);
        doneCb();
        return out;
    }
    var context = {
        url: Url,
        ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        cookie: '',
        refer: Url
    };
    fs.readdirSync('./ext/textweb/ext').forEach(c => {
        //console.log(c);
        if (name.length > 0)
            return out;
        if (fs.existsSync(`./ext/textweb/ext/${c}/ext.json`) && url.host.includes(c)) {
            var conf = JSON.parse(fs.readFileSync(`./ext/textweb/ext/${c}/ext.json`).toString());
            if (conf.acceptSite.includes(url.host)) {
                name = c;
                extConf = conf;
            }
        }
    });
    var extInterface = {
        handle: () => { return { txt: '', title: '', suggest: [], links: [] }; },
        hookFetch: () => { return { skip: false }; },
        hookRender: () => { return { skip: false }; },
        hookProcess: () => { return { skip: false }; },
        hookShow: () => { return {}; }
    };
    var ext;
    if ((extConf.type == 'handle' || extConf.type == 'hook') && name.length > 0) {
        ext = await import(`./ext/${name}/${extConf.index}`);
        if (typeof ext['handle'] == 'function')
            extInterface.handle = ext['handle'];
        if (typeof ext['fetch'] == 'function')
            extInterface.hookFetch = ext['fetch'];
        if (typeof ext['render'] == 'function')
            extInterface.hookRender = ext['render'];
        if (typeof ext['show'] == 'function')
            extInterface.hookShow = ext['show'];
        if (typeof ext['process'] == 'function')
            extInterface.hookProcess = ext['process'];
    }
    if (extConf.type == 'handle') {
        updateCb('[Waiting for ext handle]', maxPageId, maxPageId, []);
        let r;
        try {
            r = await extInterface.handle(context, Url);
        }
        catch (e) {
            updateCb(`[Error]  \nError happen in ext handle "${name}/${extConf.index}".\n\`\`\`\n${e.code}\n${e.message}\n${e.cause}\n${e.stack}\n\`\`\``, nowPageId, maxPageId, cmds);
            doneCb();
            return out;
        }
        updateCb('[Done]', maxPageId, maxPageId, []);
        var np = {
            context: context,
            title: r.title,
            processResult: r,
            isHandle: true,
            handle: ext['handle']
        };
        out.success = true;
        out.page = np;
        updateCb(r.txt, nowPageId + 1, maxPageId, r.suggest.concat(cmds));
        doneCb();
        return out;
    }
    else {
        updateCb('[Loading Cookie]', maxPageId, maxPageId, []);
        try{
            context.cookie = sharedLib.loadCookie(url.host,cookiePath);
            console.log('[cookie] loaded cookie for',url.host,context.cookie);
        }catch(e){
            console.warn(`[cookie] load cookie for "${url.host}" fail`,e);
        }
        var req = {
            context: context,
            body: null,
            method: 'GET',
            header: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Sec-Ch-Ua': '"Chromium";v="117", "Not)A;Brand";v="8", "Google Chrome";v="117"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Linux"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Accept-Language': 'zh-CN,zh;q=0.9,en-GB;q=0.8,en-US;q=0.7,en;q=0.6',
                'Cache-Control': 'max-age=0'
            }
        };
        updateCb('[Waiting for ext hookFetch]', maxPageId, maxPageId, []);
        let hfr;
        try {
            hfr = await extInterface.hookFetch(req);
        }
        catch (e) {
            updateCb(`[Error]  \nError happen in ext hookFetch "${name}/${extConf.index}".\n\`\`\`\n${e.code}\n${e.message}\n${e.cause}\n${e.stack}\n\`\`\``, nowPageId, maxPageId, cmds);
            doneCb();
            return out;
        }
        var fr;
        if (hfr.skip) {
            fr = hfr.overwrite;
        }
        else {
            updateCb('[Fetching content]', maxPageId, maxPageId, []);
            try {
                fr = await sharedLib.fetch(req);
            }
            catch (e) {
                updateCb(`[Error]  \nError happen while fetching "${Url}".\n\`\`\`\n${e.code}\n${e.message}\n${e.cause}\n${e.stack}\n\`\`\``, nowPageId, maxPageId, cmds);
                doneCb();
                return out;
            }
        }
        if (!Buffer.isBuffer(fr.body)) {
            updateCb(`[Error]  \nError happen while fetching "${Url}".\n\`\`\`\nEmpty body\n\`\`\``, nowPageId, maxPageId, cmds);
            doneCb();
            return out;
        }
        updateCb('[Waiting for ext hookRender]', maxPageId, maxPageId, []);
        let hrr;
        try {
            hrr = await extInterface.hookRender({ context: fr, option: (typeof extConf.renderOption == 'object') ? extConf.renderOption : {} });
        }
        catch (e) {
            updateCb(`[Error]  \nError happen in ext hookRender "${name}/${extConf.index}".\n\`\`\`\n${e.code}\n${e.message}\n${e.cause}\n${e.stack}\n\`\`\``, nowPageId, maxPageId, cmds);
            doneCb();
            return out;
        }
        let rr;
        var extraData = {
            links: [],
            pics: [],
            nowUrl: Url,
            processPicOpt: JSON.stringify(processPicOpt),
            processServerHost: processServerHost,
            processSvgPicOpt: processSvgPicOption,
            head: {
                level: 9,
                txt: ''
            }
        };
        if (hrr.skip) {
            rr = hrr.overwrite;
        }
        else {
            updateCb('[Rendering content]', maxPageId, maxPageId, []);
            try {
                rr = sharedLib.render({ context: fr, option: (typeof extConf.renderOption == 'object') ? extConf.renderOption : {} },extraData);
            } catch (e) {
                updateCb(`[Error]  \nError happen in render "${Url}".\n\`\`\`\n${e.code}\n${e.message}\n${e.cause}\n${e.stack}\n\`\`\``, nowPageId, maxPageId, cmds);
                doneCb();
                return out;
            }
        }
        updateCb('[Waiting for ext hookProcess]', maxPageId, maxPageId, []);
        let hpr;
        try {
            hpr = await extInterface.hookProcess({ context: rr,processServerHost:processServerHost, opt: processPicOpt, svgOpt:processSvgPicOption ,url: `${url.protocol}//${url.host}/${url.pathname}${url.search}` });
        }
        catch (e) {
            updateCb(`[Error]  \nError happen in ext hookProcess "${name}/${extConf.index}".\n\`\`\`\n${e.code}\n${e.message}\n${e.cause}\n${e.stack}\n\`\`\``, nowPageId, maxPageId, cmds);
            doneCb();
            return out;
        }
        let pr;
        if (hpr.skip) {
            pr = hpr.overwrite;
        }
        else {
            updateCb('[Processing content]', maxPageId, maxPageId, []);
            try {
                //pr = await sharedLib.process({ context: rr, opt: processPicOpt,svgOpt:processSvgPicOption , url: `${url.protocol}//${url.host}/${url.pathname}${url.search}` }, processServerHost);
                pr = {
                    title: rr.title,
                    txt: rr.txt,
                    suggest: rr.suggest,
                    links: extraData.links,
                    pics: extraData.pics
                }
            } catch (e) {
                //console.log(e);
                updateCb(`[Error]  \nError happen in process "${Url}".\n\`\`\`\n${e.code}\n${e.message}\n${e.cause}\n${e.stack}\n\`\`\``, nowPageId, maxPageId, cmds);
                doneCb();
                return out;
            }
        }
        updateCb('[Waiting for ext hookShow]', maxPageId, maxPageId, []);
        try {
            let t = await extInterface.hookShow(rr);
            if (typeof t.overwrite == 'object')
                pr = t.overwrite;
        }
        catch (e) {
            updateCb(`[Error]  \nError happen in ext hookShow "${name}/${extConf.index}".\n\`\`\`\n${e}\n\`\`\``, nowPageId, maxPageId, cmds);
            doneCb();
            return out;
        }
        updateCb('[Done]', maxPageId, maxPageId, []);
        var np = {
            context: context,
            title: pr.title,
            processResult: pr,
            isHandle: false
        };
        out.success = true;
        out.page = np;
        updateCb(np.processResult.txt, nowPageId, maxPageId, np.processResult.suggest.concat(cmds));
        doneCb();
        return out;
    }
}
export class application extends extType.application.base {
    constructor() {
        super();
        this.applicationName = "TextWeb";
        _application_page.set(this, []);
        _application_nowPageId.set(this, -1);
        this.handle = {
            input: async (session, um, updateCb, doneCb, alive, hold) => {
                if (__classPrivateFieldGet(this, _application_nowPageId, "f") == -1) {
                    try {
                        let u = new URL(um.text);
                    } catch (e) {
                        updateCb('[Error] invaild url.', __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, hpsite);
                        doneCb();
                        return;
                    }
                    let r = await newPage(um.text, updateCb, doneCb, __classPrivateFieldGet(this, _application_page, "f").length, __classPrivateFieldGet(this, _application_page, "f").length);
                    if (r.success)
                        __classPrivateFieldGet(this, _application_page, "f").push(r.page);
                    __classPrivateFieldSet(this, _application_nowPageId, __classPrivateFieldGet(this, _application_page, "f").length - 1, "f");
                    return;
                }
                else {
                    if (__classPrivateFieldGet(this, _application_nowPageId, "f") == -2) {
                        for (var i = 0; i < __classPrivateFieldGet(this, _application_page, "f").length; i++) {
                            if (__classPrivateFieldGet(this, _application_page, "f")[i].title == um.text) {
                                __classPrivateFieldSet(this, _application_nowPageId, i, "f");
                                break;
                            }
                        }
                        if (__classPrivateFieldGet(this, _application_nowPageId, "f") == -2) {
                            var lst = [];
                            __classPrivateFieldGet(this, _application_page, "f").forEach(c => {
                                lst.push(c.title);
                            });
                            updateCb("Choose a tab to switch in.", -2, __classPrivateFieldGet(this, _application_page, "f").length - 1, lst);
                            doneCb();
                            return;
                        }
                        updateCb(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.txt, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                        doneCb();
                        return;
                    }
                    if (um.text.startsWith('>')) {
                        if (!__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].isHandle) {
                            updateCb('[Error] This page has not got a handle.', __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, cmds);
                            doneCb();
                            return;
                        }
                        updateCb(`[Waiting ext handle]`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, []);
                        let r = await __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].handle(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].context, um.text.slice(1));
                        updateCb(r.txt, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, r.suggest.concat(cmds));
                        __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult = r;
                        __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].title = r.title;
                        return;
                    }
                    else {
                        if (um.text.startsWith('open ')) {
                            let r = await newPage(um.text.slice(5), updateCb, doneCb, __classPrivateFieldGet(this, _application_page, "f").length, __classPrivateFieldGet(this, _application_page, "f").length);
                            if (r.success)
                                __classPrivateFieldGet(this, _application_page, "f").push(r.page);
                            __classPrivateFieldSet(this, _application_nowPageId, __classPrivateFieldGet(this, _application_page, "f").length - 1, "f");
                            return;
                        }
                        if (um.text.startsWith('setmrr ')) {
                            processPicOpt.minResizeRate = parseFloat(um.text.slice(7));
                            updateCb(`[Info] Now pic minResizeRate is ${processPicOpt.minResizeRate}`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, cmds);
                            doneCb();
                            return;
                        }
                        if (!((/[^0-9]/g).test(um.text))) {
                            if (typeof __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.links[parseInt(um.text)] == 'string') {
                                let r = await newPage(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.links[parseInt(um.text)], updateCb, doneCb, __classPrivateFieldGet(this, _application_page, "f").length, __classPrivateFieldGet(this, _application_page, "f").length);
                                if (r.success)
                                    __classPrivateFieldGet(this, _application_page, "f").push(r.page);
                                __classPrivateFieldSet(this, _application_nowPageId, __classPrivateFieldGet(this, _application_page, "f").length - 1, "f");
                                return;
                            }
                            else {
                                updateCb(`[Error] the page ${__classPrivateFieldGet(this, _application_nowPageId, "f")} does not has link ${um.text}.`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                doneCb();
                                return;
                            }
                        }
                        switch (um.text) {
                            case 'show': {
                                updateCb(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.txt, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                doneCb();
                                return;
                            }
                            case 'info': {
                                updateCb(`[Tab] ${__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].title}  \nUrl: ${__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].context.url}`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                doneCb();
                                return;
                            }
                            case 'refresh': {
                                let r = await newPage(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].context.url, updateCb, doneCb, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1);
                                if (r.success)
                                    __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")] = r.page;
                                return;
                            }
                            case 'switch': {
                                var lst = [];
                                __classPrivateFieldGet(this, _application_page, "f").forEach(c => {
                                    lst.push(c.title);
                                });
                                __classPrivateFieldSet(this, _application_nowPageId, -2, "f");
                                updateCb("Choose a tab to switch in.", -2, __classPrivateFieldGet(this, _application_page, "f").length - 1, lst);
                                doneCb();
                                return;
                            }
                            case 'close': {
                                if (__classPrivateFieldGet(this, _application_nowPageId, "f") == 0) {
                                    __classPrivateFieldGet(this, _application_page, "f").shift();
                                    if (__classPrivateFieldGet(this, _application_page, "f").length == 0) {
                                        __classPrivateFieldSet(this, _application_nowPageId, -1, "f");
                                        updateCb('### TextWeb\nYou are not in any page.  \nType url to enter one.', -1, -1, hpsite);
                                        doneCb();
                                        return;
                                    }
                                    updateCb(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.txt, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                    doneCb();
                                    return;
                                }
                                else {
                                    __classPrivateFieldSet(this, _application_page, __classPrivateFieldGet(this, _application_page, "f").slice(0, __classPrivateFieldGet(this, _application_nowPageId, "f")).concat(__classPrivateFieldGet(this, _application_page, "f").slice(__classPrivateFieldGet(this, _application_nowPageId, "f") + 1, __classPrivateFieldGet(this, _application_page, "f").length)), "f");
                                    if (__classPrivateFieldGet(this, _application_nowPageId, "f") > __classPrivateFieldGet(this, _application_page, "f").length - 1)
                                        __classPrivateFieldSet(this, _application_nowPageId, __classPrivateFieldGet(this, _application_page, "f").length - 1, "f");
                                    updateCb(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.txt, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                    doneCb();
                                    return;
                                }
                            }
                            case 'save': {
                                let d = new Date();
                                let dt = d.toISOString().replace(/[/\\\-\.\:_ ]/g,'');
                                try {
                                    updateCb(`[Save] working to offline resource...`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, []);
                                    fs.writeFileSync(`${exportPath}/${__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].title.replaceAll('/', '').replaceAll('\\', '')}-${dt}.md`, await sharedLib.offlineSave(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.txt,__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.pics,(now,total)=>{
                                        updateCb(`[Save] working to offline resource... (${now}/${total})`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, []);
                                    }));
                                    updateCb(`[Save] Exported at \`${exportPath}/${__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].title.replaceAll('/', '').replaceAll('\\', '')}-${dt}.md\`.`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                    doneCb();
                                    return;
                                }
                                catch (e) {
                                    updateCb(`[Error] Error happened while exporting.  \n\`\`\`\n${e.code}\n${e.message}\n${e.stack}\n${e.cause}\n\`\`\``, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                    doneCb();
                                    return;
                                }
                            }
                            default: {
                                updateCb(`[Error] not vaild cmd "${um.text}"`, __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1, __classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest.concat(cmds));
                                doneCb();
                                return;
                            }
                        }
                    }
                }
            },
            exit: (session, cb) => {
            },
            switchIn: (session, cb) => {
                if (__classPrivateFieldGet(this, _application_nowPageId, "f") == -1) {
                    cb('### TextWeb\nYou are not in any page.  \nType url to enter one.', hpsite, 0, 0);
                }
                else {
                    cb(__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.txt, (__classPrivateFieldGet(this, _application_page, "f")[__classPrivateFieldGet(this, _application_nowPageId, "f")].processResult.suggest).concat(cmds), __classPrivateFieldGet(this, _application_nowPageId, "f"), __classPrivateFieldGet(this, _application_page, "f").length - 1);
                }
            },
            switchOut: (session) => {
            },
            init: (session, cb) => {
                cb('### TextWeb\nv1.0.0  \nYou are not in any page.  \nType url to enter one.', hpsite, -1, -1);
            }
        };
        _application_picServer.set(this, http.createServer(async (req, res) => {
            try {
                var out = await sharedLib.pic.processPic(req.url);
                if (out.type.startsWith('image/')){
                    res.writeHead(200, 'OK', { 'content-type': out.type, 'content-length': `${out.buff.length}` });
                    res.write(out.buff);
                }else{
                    res.writeHead(200, 'OK', { 'content-type': 'image/png', 'content-length': `${picLoadFailTip.length}` });
                    res.write(picLoadFailTip);
                }
                
                res.end();
            } catch (e) {
                console.log('[picProcessServer] picProcessServerError', e);
                try {
<<<<<<< HEAD
=======
                    res.writeHead(200, 'OK', { 'content-type': 'image/png', 'content-length': `${picLoadFailTip.length}` });
                    res.write(picLoadFailTip);
>>>>>>> 5220509 (init.)
                    res.end();
                } catch (ee) { }
            }
        }));
        __classPrivateFieldGet(this, _application_picServer, "f").on("error", (e) => { });
        __classPrivateFieldGet(this, _application_picServer, "f").listen(2233, '127.0.0.3');
    }
}
_application_page = new WeakMap(), _application_nowPageId = new WeakMap(), _application_picServer = new WeakMap();
