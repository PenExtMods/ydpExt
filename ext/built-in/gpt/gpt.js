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
var _apiVersionBackyard_nowCid, _apiVersionBackyard_nowEvent, _apiVersionBackyard_nowMsgs;
import * as https from "node:https";
import * as event from "node:events";
import * as random from './random.js';
import * as fs from "node:fs";
const configPath = `${process.env['basePath']}/config.json`;
var config = {
    url: 'https://api.openai.com/v1/chat/completions',
    key: ''
};
if (fs.existsSync(configPath)) {
    let raw = fs.readFileSync(configPath).toString();
    try {
        config = Object.assign(config, JSON.parse(raw));
    }
    catch (e) {
        console.log(`[gpt][config] load config file failed, using default values. \n`, e);
    }
}
export class baseBackyard {
    constructor() {
        this.name = '';
    }
    create() { }
    ;
    dumpMsgRecord() { return []; }
    ;
    request(txt) { return new event.EventEmitter(); }
    ;
    retry() { return new event.EventEmitter(); }
    ;
}
export class apiVersionBackyard extends baseBackyard {
    constructor() {
        super();
        this.name = "ApiVersion";
        _apiVersionBackyard_nowCid.set(this, random.randomUUID());
        _apiVersionBackyard_nowEvent.set(this, new event.EventEmitter());
        _apiVersionBackyard_nowMsgs.set(this, []);
    }
    dumpMsgRecord() {
        return __classPrivateFieldGet(this, _apiVersionBackyard_nowMsgs, "f");
    }
    create() {
        __classPrivateFieldSet(this, _apiVersionBackyard_nowCid, random.randomUUID(), "f");
        __classPrivateFieldSet(this, _apiVersionBackyard_nowMsgs, [], "f");
    }
    request(txt) {
        __classPrivateFieldGet(this, _apiVersionBackyard_nowEvent, "f").removeAllListeners();
        __classPrivateFieldSet(this, _apiVersionBackyard_nowEvent, new event.EventEmitter(), "f");
        var auth = `Bearer ${config.key}`;
        var request = https.request(config.url, {
            "headers": {
                "accept": "application/json",
                "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                "authorization": auth,
                "content-type": "application/json",
                "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "method": "POST"
        });
        if (txt.length != 0) {
            var msg = {
                role: 'user',
                content: txt
            };
            __classPrivateFieldGet(this, _apiVersionBackyard_nowMsgs, "f").push(msg);
        }
        var rmsg = {
            stream: true,
            model: 'gpt-3.5-turbo',
            temperature: 0.5,
            presence_penalty: 0,
            frequency_penalty: 0,
            top_p: 1,
            messages: __classPrivateFieldGet(this, _apiVersionBackyard_nowMsgs, "f")
        };
        request.on("response", (res) => {
            var tmp = '';
            var result = {
                role: 'assistant',
                content: ''
            };
            var done = false;
            res.on("data", (c) => {
                tmp += String(c);
                if (tmp.startsWith('data: ') && tmp.endsWith('\n\n')) {
                    tmp.split('\n\n').forEach(dl => {
                        if (done)
                            return;
                        if (dl.trim().length == 0)
                            return;
                        if (dl.slice(6) == "[DONE]") {
                            __classPrivateFieldGet(this, _apiVersionBackyard_nowEvent, "f").emit("done", result.content);
                            done = true;
                            if (txt.length == 0) {
                                var msg = {
                                    role: 'user',
                                    content: 'Generate again.'
                                };
                                __classPrivateFieldGet(this, _apiVersionBackyard_nowMsgs, "f").push(msg);
                            }
                            __classPrivateFieldGet(this, _apiVersionBackyard_nowMsgs, "f").push(result);
                            return;
                        }
                        var o = JSON.parse(dl.slice(6));
                        if (Object.keys(o.choices[0].delta).length == 0)
                            return;
                        result.content += o.choices[0].delta.content;
                        if (result.content.length > 0)
                            __classPrivateFieldGet(this, _apiVersionBackyard_nowEvent, "f").emit("update", result.content);
                    });
                    tmp = '';
                }
            });
            res.on("error", (e) => {
                __classPrivateFieldGet(this, _apiVersionBackyard_nowEvent, "f").emit("error", e);
            });
            res.on("close", () => {
                if (tmp.length != 0 && !done) {
                    __classPrivateFieldGet(this, _apiVersionBackyard_nowEvent, "f").emit("error", tmp);
                }
            });
        });
        request.on("error", (e) => {
            __classPrivateFieldGet(this, _apiVersionBackyard_nowEvent, "f").emit("error", e);
        });
        request.write(JSON.stringify(rmsg));
        request.end();
        return __classPrivateFieldGet(this, _apiVersionBackyard_nowEvent, "f");
    }
    retry() {
        return this.request('');
    }
}
_apiVersionBackyard_nowCid = new WeakMap(), _apiVersionBackyard_nowEvent = new WeakMap(), _apiVersionBackyard_nowMsgs = new WeakMap();
