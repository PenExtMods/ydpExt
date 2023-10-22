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
var _application_bash, _application_stdOut, _application_bashDied;
import { extType } from "../../extType.js";
import * as child from "node:child_process";
export function constructor() {
    return new application();
}
export class application extends extType.application.base {
    constructor() {
        super();
        this.applicationName = "Terminal";
        _application_bash.set(this, void 0);
        _application_stdOut.set(this, '');
        _application_bashDied.set(this, false);
        this.handle = {
            input: (session, um, updateCb, doneCb, alive, hold) => {
                if (__classPrivateFieldGet(this, _application_bashDied, "f")) {
                    updateCb("Terminal process died.", 0, 0, ['#exit']);
                    doneCb();
                    return;
                }
                var stdo = '';
                __classPrivateFieldGet(this, _application_bash, "f").stdout.removeAllListeners('data');
                __classPrivateFieldGet(this, _application_bash, "f").stderr.removeAllListeners('data');
                stdo = __classPrivateFieldGet(this, _application_stdOut, "f");
                __classPrivateFieldSet(this, _application_stdOut, '');
                var ff = async (d)=>{
                    if (await alive()){
                        stdo += String(d).replaceAll('\n','  \n');
                        updateCb(stdo, 0, 1, []);
                    }else{
                        __classPrivateFieldSet(this, _application_stdOut, String(d).replaceAll('\n','  \n').replaceAll('\`','\\\`').replaceAll('#','  \\#'), "f");
                        //__classPrivateFieldGet(this, _application_bash, "f").stdout.off("data",ff);
                        //__classPrivateFieldGet(this, _application_bash, "f").stderr.off("data", ff);
                        __classPrivateFieldGet(this, _application_bash, "f").stdout.removeAllListeners('data');
                        __classPrivateFieldGet(this, _application_bash, "f").stderr.removeAllListeners('data');
                        __classPrivateFieldGet(this, _application_bash, "f").stdout.on("data", (d) => {
                            __classPrivateFieldSet(this, _application_stdOut, __classPrivateFieldGet(this, _application_stdOut, "f") + String(d).replaceAll('\n','  \n'));
                        });
                        __classPrivateFieldGet(this, _application_bash, "f").stderr.on("data", (d) => {
                            __classPrivateFieldSet(this, _application_stdOut, __classPrivateFieldGet(this, _application_stdOut, "f") + String(d).replaceAll('\n','  \n'));
                        });
                    }
                };
                updateCb(__classPrivateFieldGet(this, _application_stdOut, "f"), 0, 1, []);
                __classPrivateFieldGet(this, _application_bash, "f").stdin.write(`${um.text}\necho \`whoami\`@\`hostname\`:\`pwd\`#\n`);
                __classPrivateFieldGet(this, _application_bash, "f").stdout.on("data",ff);
                __classPrivateFieldGet(this, _application_bash, "f").stderr.on("data", ff);
                /*
                var t = setInterval(async () => {
                    if (await alive()) {
                        updateCb(__classPrivateFieldGet(this, _application_stdOut, "f"), 0, 1, []);
                    }
                    else {
                        clearInterval(t);
                    }
                }, 500);
                */
                hold();
            },
            exit: (session, cb) => {
                //cb(`Receive exit msg from ${session.cid} ${session.createAt.tone}`, [], 0, 2048);
            },
            switchIn: (session, cb) => {
                //cb(`Receive switchIn msg from ${session.cid} ${session.createAt.tone}`, [], 0, 2048);
            },
            switchOut: (session) => {
            },
            init: (session, cb) => {
                __classPrivateFieldSet(this, _application_bash, child.spawn('bash'), "f");
                __classPrivateFieldGet(this, _application_bash, "f").once("error", (e) => {
                    cb(`Init fail.  \n\`\`\`\n${e}\n\`\`\``, ['#exit'], 0, 0);
                });
                __classPrivateFieldGet(this, _application_bash, "f").on("exit", (code) => {
                    __classPrivateFieldSet(this, _application_bashDied, true, "f");
                });
                __classPrivateFieldGet(this, _application_bash, "f").stdout.on("data", (d) => {
                    __classPrivateFieldSet(this, _application_stdOut, __classPrivateFieldGet(this, _application_stdOut, "f") + String(d).replaceAll('\n','  \n'), "f");
                });
                __classPrivateFieldGet(this, _application_bash, "f").stderr.on("data", (d) => {
                    __classPrivateFieldSet(this, _application_stdOut, __classPrivateFieldGet(this, _application_stdOut, "f") + String(d).replaceAll('\n','  \n'), "f");
                });
                __classPrivateFieldGet(this, _application_bash, "f").stdout.once("data", (d) => {
                    cb(String(d), ['whoami', 'neofetch'], 0, 1);
                });
                cb('## Terminal\nv1.0.0',['whoami', 'neofetch'], 0, 1);
            }
        };
    }
}
_application_bash = new WeakMap(), _application_stdOut = new WeakMap(), _application_bashDied = new WeakMap();
