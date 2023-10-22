var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _application_backyard, _application_nowEvent, _application_requesting, _application_responsePool;
import { extType } from "../../extType.js";
import * as gpt from './gpt.js';
import * as event from "node:events";
import * as fs from "node:fs";
const exportPath = `${process.env['mtpPath']}/gpt`;
export function constructor() {
    return new application();
}
const cmds = ['##retry', '##save', '##new', '#exit'];
export class application extends extType.application.base {
    constructor() {
        super();
        this.applicationName = "Gpt";
        _application_backyard.set(this, void 0);
        _application_nowEvent.set(this, void 0);
        _application_requesting.set(this, void 0);
        _application_responsePool.set(this, void 0);
        this.handle = {
            input: async (session, um, updateCb, doneCb, alive, hold) => {
                if (um.text[0] == '#' && um.text != '#retry') {
                    switch (um.text) {
                        case '#new': {
                            __classPrivateFieldGet(this, _application_backyard, "f").create();
                            updateCb("Create a new conversation successfully.", 0, 200, ['用10个字以内的话描述樱花', '#exit']);
                            doneCb();
                            break;
                        }
                        case '#save': {
                            var o = '';
                            var lst = __classPrivateFieldGet(this, _application_backyard, "f").dumpMsgRecord();
                            lst.forEach(c => {
                                o += `### ${c.role}\n${c.content}\n`;
                            });
                            var d = new Date();
                            try {
                                fs.writeFileSync(`${exportPath}/${d.toISOString()}.md`, o);
                                fs.writeFileSync(`${exportPath}/${d.toISOString()}.json`, JSON.stringify(lst));
                                updateCb(`Exported at \`${exportPath}/${d.toISOString()}\`.`, 0, 200, cmds);
                                doneCb();
                            }
                            catch (e) {
                                updateCb(`Error happened while exporting.\n\`\`\`\n${e}\n\`\`\``, 0, 200, cmds);
                                doneCb();
                            }
                            break;
                        }
                        case '#last': {
                            if (!__classPrivateFieldGet(this, _application_requesting, "f")) {
                                if (__classPrivateFieldGet(this, _application_responsePool, "f").length != 0) {
                                    updateCb(__classPrivateFieldGet(this, _application_responsePool, "f"), 0, 200, cmds);
                                    doneCb();
                                    return;
                                }
                                updateCb("There is not any requests left.", 0, 200, cmds);
                                doneCb();
                                return;
                            }
                            hold();
                            var nAlive = true;
                            __classPrivateFieldGet(this, _application_nowEvent, "f").on("error", (e) => {
                                __classPrivateFieldSet(this, _application_responsePool, __classPrivateFieldGet(this, _application_responsePool, "f") + `  \n===  \nError happened  \n\`\`\`\n${e}\n\`\`\`\n===  \n  \n`, "f");
                                if (nAlive) {
                                    updateCb(__classPrivateFieldGet(this, _application_responsePool, "f"), 0, 200, ['##retry']);
                                    doneCb();
                                    __classPrivateFieldGet(this, _application_nowEvent, "f").removeAllListeners();
                                }
                            });
                            __classPrivateFieldGet(this, _application_nowEvent, "f").on("update", async (t) => {
                                if (nAlive) {
                                    nAlive = await alive();
                                    if (nAlive)
                                        updateCb(t, 0, 200, []);
                                }
                            });
                            __classPrivateFieldGet(this, _application_nowEvent, "f").on("done", (t) => {
                                if (nAlive) {
                                    updateCb(t, 0, 200, cmds);
                                    doneCb();
                                    __classPrivateFieldGet(this, _application_nowEvent, "f").removeAllListeners();
                                }
                            });
                            break;
                        }
                        default: {
                            updateCb(`Unregnaised command "${um.text}".`, 0, 200, cmds);
                            doneCb();
                            break;
                        }
                    }
                }
                else {
                    if (__classPrivateFieldGet(this, _application_requesting, "f")) {
                        updateCb("A request is going. Wait for it and try later.", 0, 200, [um.text, '##last']);
                        doneCb();
                        return;
                    }
                    updateCb("Sending request...", 0, 200, []);
                    __classPrivateFieldSet(this, _application_nowEvent, __classPrivateFieldGet(this, _application_backyard, "f").request((um.text == '#retry') ? '' : um.text), "f");
                    updateCb("Gpt is thinking...", 0, 200, []);
                    hold();
                    var nAlive = true;
                    __classPrivateFieldSet(this, _application_requesting, true, "f");
                    __classPrivateFieldGet(this, _application_nowEvent, "f").on("error", (e) => {
                        __classPrivateFieldSet(this, _application_responsePool, __classPrivateFieldGet(this, _application_responsePool, "f") + `  \n===  \nError happened  \n\`\`\`\n${e}\n\`\`\`\n===  \n  \n`, "f");
                        if (nAlive) {
                            updateCb(__classPrivateFieldGet(this, _application_responsePool, "f"), 0, 200, ['##retry']);
                            doneCb();
                            __classPrivateFieldGet(this, _application_nowEvent, "f").removeAllListeners();
                            __classPrivateFieldSet(this, _application_requesting, false, "f");
                        }
                    });
                    __classPrivateFieldGet(this, _application_nowEvent, "f").on("update", async (t) => {
                        __classPrivateFieldSet(this, _application_responsePool, t, "f");
                        if (nAlive) {
                            nAlive = await alive();
                            if (nAlive)
                                updateCb(t, 0, 200, []);
                        }
                    });
                    __classPrivateFieldGet(this, _application_nowEvent, "f").on("done", (t) => {
                        __classPrivateFieldSet(this, _application_requesting, false, "f");
                        if (nAlive) {
                            updateCb(t, 0, 200, cmds);
                            doneCb();
                            __classPrivateFieldGet(this, _application_nowEvent, "f").removeAllListeners();
                        }
                    });
                }
            },
            exit: (session, cb) => {
            },
            switchIn: (session, cb) => {
                if (__classPrivateFieldGet(this, _application_requesting, "f") || __classPrivateFieldGet(this, _application_responsePool, "f").length != 0) {
                    cb("There is a request left.", ['##last'], 0, 200);
                }
            },
            switchOut: (session) => {
            },
            init: (session, cb) => {
                cb(`# Gpt\nv1.0.0  \nNow backyard: "${__classPrivateFieldGet(this, _application_backyard, "f").name}".`, ['用10个字以内的话描述樱花', '#exit'], 0, 200);
            }
        };
        __classPrivateFieldSet(this, _application_backyard, new gpt.apiVersionBackyard(), "f");
        __classPrivateFieldSet(this, _application_nowEvent, new event.EventEmitter(), "f");
        __classPrivateFieldSet(this, _application_requesting, false, "f");
        __classPrivateFieldSet(this, _application_responsePool, '', "f");
        __classPrivateFieldGet(this, _application_backyard, "f").create();
    }
}
_application_backyard = new WeakMap(), _application_nowEvent = new WeakMap(), _application_requesting = new WeakMap(), _application_responsePool = new WeakMap();
