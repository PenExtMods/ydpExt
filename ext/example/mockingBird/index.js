export const applicationName = 'mockingBird';

var lastCid = '';
var nowNum = 0;
const recommendRes = ['test','a','b','114514','2233','overflow'];

export function init(session,cb){
    lastCid = session.cid;
    cb(`### mockingBird\nHello, ${lastCid}.`,recommendRes,0,114514);
}

export function input(session,msg,update,done,isAlive,hold){
    var out = '';

    nowNum++;
    if (nowNum>114514) nowNum = 0;

    if (session.cid!=lastCid){
        lastCid = session.cid;
        out += `You created a new conversation, ${lastCid}!  \n`;
    }

    out += `${msg.text}  \n`;

    update(out,nowNum,114514,recommendRes);
    done();
}

export function switchIn(session,cb){
    lastCid = session.cid;
    cb(`### mockingBird\nWelcome back, ${lastCid}.`,recommendRes,nowNum,114514);
}