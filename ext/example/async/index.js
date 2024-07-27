export const applicationName = 'asyncSample';

const recommendRes = ['test','a','b','114514','2233','overflow'];

const helpInfo = `
### asyncSample
This sample extension will show you how to use async in event handle in two different ways.

- using \`hold()\` in event \`input\`
- using \`Promise\` in event \`switchIn\`

Let's start.
`;

const fadeTime = 40;

async function fadeIn(txt,t,update,nowNum,maxNum,suggestedResponse){
    var i = 0;
    return new Promise((resolve,reject)=>{
        const f = ()=>{
            update(txt.substring(0,i+1),nowNum,maxNum,[]);
            i++;
            if (i<=txt.length){
                setTimeout(f,t);
            }else{
                update(txt,nowNum,maxNum,suggestedResponse);
                resolve();
            }
        };
        f();
    });
}

async function fadeOut(txt,t,update,nowNum,maxNum,suggestedResponse){
    var i = txt.length - 1;
    return new Promise((resolve,reject)=>{
        const f = ()=>{
            update(txt.substring(0,i+1),nowNum,maxNum,[]);
            i--;
            if (i>=0){
                setTimeout(f,t);
            }else{
                update('',nowNum,maxNum,suggestedResponse);
                resolve();
            }
        };
        f();
    });
}

export function init(session,cb){
    cb(helpInfo,recommendRes,0,2048);
}

export async function input(session,msg,update,done,isAlive,hold){
    hold();
    await fadeIn(`this input event used \`hold()\`.`,fadeTime,update,0,2048,[]);
    setTimeout(async ()=>{
        await fadeOut(`this input event used \`hold()\`.`,fadeTime,update,0,2048,[]);
        await fadeIn(helpInfo,fadeTime,update,0,2048,recommendRes);
        done();
    },3000);
}

export async function switchIn(session,cb){
    const f = (txt,nowNum,maxNum,suggestedResponse)=>{
        cb(txt,suggestedResponse,nowNum,maxNum);
    };
    return new Promise(async (resolve,reject)=>{
        await fadeIn(`this input event used \`Promise\`.`,fadeTime,f,0,2048,[]);
        setTimeout(async ()=>{
            await fadeOut(`this input event used \`Promise\`.`,fadeTime,f,0,2048,[]);
            await fadeIn(helpInfo,fadeTime,f,0,2048,recommendRes);
            resolve();
        },3000);
    });
}