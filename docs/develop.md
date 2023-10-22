# 扩展程序开发手册
## 注意
- 要开发扩展程序，你需要有一定的`javascript`基础；要能较好地阅读本文档，你需要对`typescript`的语法略知一二。
- 扩展程序请使用`ECMAScript module`的javascript写法。
- 扩展程序主机最后只接受`javascript`脚本，使用`typescript`编写的扩展程序需要通过编译才能运行。
- 建议在响应`init`事件时输出扩展程序的当前版本号以便用户日后手动检查更新。
## 目录结构
一个最小的扩展程序应该有如下的目录结构。
```
┌[rawName]
├--index.js
```
即在一个以扩展程序原始名称(上面的`[rawName]`)命名文件夹内需有文件`index.js`。  
安装该扩展程序即只需将上述文件夹放入`/userdisk/youdaoExt/ext`中即可。
## 扩展程序名称
扩展程序有两个名称: 原始名称(rawName)和显示名称(applicationName)。  
- 请用原始名称来命名用来装扩展程序脚本的文件夹，详见上文`目录结构`。  
- 请在`index.js`中导出常量`applicationName`作为扩展程序的显示名称。如未导出，扩展程序主机将取原始名称作为显示名称。
## 扩展程序工作目录
请注意，由于`nodejs`中对`worker_thread`的限制(毕竟是一个线程，而不是一个独立的进程)，扩展程序的工作目录并非上述以原始名称命名的文件夹，而是装有扩展程序主机代码的文件夹。  
如果你使用安装脚本安装的: 如果你直接安装，该目录应该为`/userdisk/youdaoExt`；如果你在chroot容器中安装，该目录应该为`/youdaoExt`。  
如要使用与扩展程序处于同一目录下的文件，请参考以下例子。  
```js
import * as fs from "node:fs";
const basePath = process.env['basePath'];

// 导入模块

import * as test from "./test.js"; // 正确
import * as test from `${basePath}/test.js`; // 错误

var test = await import("./test.js"); // 错误
var test = await import(`${basePath}/test.js`); // 正确

// 访问文件

var buff = fs.readFileSync("./1.txt"); // 错误
var buff = fs.readFildSync(`${basePath}/1.txt`); // 正确

```
## 事件
该项目采用的事件处理方式是**事件驱动型**而非~~事件循环型~~。  
要处理和响应某个事件，只需在上文目录结构中所述的`index.js`文件中导出以事件命名的函数(同步和异步均接受)作为事件处理和响应函数即可。  
下列为扩展程序的事件列表。  
- 事件`init`: 在初始化并切换扩展程序到前台时触发。
- 事件`switchOut`: 在扩展程序被切入后台时触发。
- 事件`switchIn`: 在扩展程序被切入前台时触发。
- 事件`exit`: 在用户下达退出扩展程序的命令时触发。
- 事件`input`: 在用户输入内容且该扩展程序在前台时触发，用于响应用户输入。
事件详细细节(传入参数，声明等)见下文`代码参考`。  
## 代码参考
### 类型: session
以下为其typescript声明。  
```ts
interface session{
    cid: string,
    createAt:{
        timestamp: string,
        path: string,
        tone: 'moderate' | 'creative' | 'precise'
    },
    path: string,
    timestamp: string,
    maxNum: number,
    nowNum: number
}
```
解释如下。  
- `cid`: 创建`signature`时返回的`conversationId`。
- `createAt.timestamp`: 创建`signature`的时间。
- `createAt.path`: 创建`signature`时的http请求路径。
- `createAt.tone`: 创建`signature`时选择的对话风格。
- `path`: 连接`chathub`时的http请求路径。
- `timestamp`: 连接`chathub`的时间。
- `maxNum`: 消息框右下角的最大对话次数。
- `nowNum`: 消息框右下角的当前对话次数。
### 类型: msg
以下为其typescript声明。  
```ts
interface msg{
    text: string,
    timestamp: string
}
```
解释如下。  
- `text`: 用户输入内容。
- `timestamp`: 消息由`penmods`发出的时间。
### 事件: input
以下为其导出函数的typescript声明。  
```ts
function input(
    session:session,
    msg:msg,
    update:(
        text:string,
        nowNum:number,
        maxNum:number,
        suggestedResponse:string[]
    )=>void,
    done:()=>void,
    isAlive:()=>Promise<boolean>,
    hold:()=>void
):void
```
以下为解释。  
- `session`: 此时的会话对象。
- `msg`: 用户输入数据。
- `update`: 更新消息框中的内容。
  - `text`: 要更新到消息框的内容，请使用`markdown`语法。
  - `suggestedResponse`: 要更新到参考候选的内容。
  - `maxNum`: 要更新到消息框右下角的最大对话次数。
  - `nowNum`: 要更新到消息框右下角的当前对话次数。
- `done`: 结束响应消息，此后调用`update`无效。
- `isAlive`: 返回`chathub`连接状态，`true`为保持连接，`false`为已断开。
- `hold`: 调用后，在事件处理和响应函数返回后不自动结束响应消息。
### 事件: switchOut
以下为其导出函数的typescript声明。 
```ts
function switchOut(
    session:session
):void
```
解释如下。  
- `session`: 此时的会话对象。
### 事件: init
以下为其导出函数的typescript声明。 
```ts
function init(
    session:session,
    cb:(
        text:string,
        suggestedResponse:string[],
        nowNum:number,
        maxNum:number
    )=>void
):void
```
以下是解释。  
- `session`: 此时的会话对象。
- `cb`: 更新消息框中的内容。
  - `text`: 要更新到消息框的内容，请使用`markdown`语法。
  - `suggestedResponse`: 要更新到参考候选的内容。
  - `maxNum`: 要更新到消息框右下角的最大对话次数。
  - `nowNum`: 要更新到消息框右下角的当前对话次数。
### 事件: switchIn
以下为其导出函数的typescript声明。 
```ts
function switchIn(
    session:session,
    cb:(
        text:string,
        suggestedResponse:string[],
        nowNum:number,
        maxNum:number
    )=>void
):void
```
以下是解释。  
- `session`: 此时的会话对象。
- `cb`: 更新消息框中的内容。
  - `text`: 要更新到消息框的内容，请使用`markdown`语法。
  - `suggestedResponse`: 要更新到参考候选的内容。
  - `maxNum`: 要更新到消息框右下角的最大对话次数。
  - `nowNum`: 要更新到消息框右下角的当前对话次数。
### 事件: exit
以下为其导出函数的typescript声明。 
```ts
function exit(
    session:session,
    cb:(
        text:string,
        suggestedResponse:string[],
        nowNum:number,
        maxNum:number
    )=>void
):void
```
以下是解释。  
- `session`: 此时的会话对象。
- `cb`: 更新消息框中的内容。
  - `text`: 要更新到消息框的内容，请使用`markdown`语法。
  - `suggestedResponse`: 要更新到参考候选的内容。
  - `maxNum`: 要更新到消息框右下角的最大对话次数。
  - `nowNum`: 要更新到消息框右下角的当前对话次数。
## 环境变量
在扩展程序中可以使用`process.env`来访问环境变量。  
比如。  
```js
// 打印词典笔mtp服务器下Music文件夹的绝对位置
console.log(process.env['mtpPath']);
```
### mtpPath
如果你需要使用词典笔的`/userdisk/Music`文件夹，请使用此环境变量来代替该路径，因为扩展程序主机可能运行在`chroot容器`中。  
例如。  
```js
import * as fs from "node:fs";

export init(session,cb){
    // 读取词典笔看来的 /userdisk/Music/1.txt
    var buff = fs.readFileSync(`${process.env['mtpPath']}/1.txt`);
    cb(`Readed file \`1.txt\` from ydp.
    \`\`\`
    ${buff.toString()}
    \`\`\`
    `,[],0,1);

}
```
### ydpSysRootPath
如果你需要使用词典笔的`/`目录访问`system_a`或`system_b`中的内容，请使用此环境变量来代替`/`，因为扩展程序主机可能运行在`chroot容器`中。  
例如。  
```js
import * as fs from "node:fs";

export init(session,cb){
    // 读取词典笔看来的 /1.txt
    const ydpSysRootPath = process.env['ydpSysRootPath'];
    var buff = fs.readFileSync(`${ydpSysRootPath}/1.txt`);
    cb(`Readed file \`1.txt\` from ydp.
    \`\`\`
    ${buff.toString()}
    \`\`\`
    `,[],0,1);

}
```
### basePath
如果你需要使用与扩展程序同目录的文件，请使用此环境变量代替`./`，并参考上文`扩展程序工作目录`。