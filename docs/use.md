# 使用文档
## 使用模式
开始之前请先将你原先在penmods中设置的newbing地址按以下格式写入文件`/userdisk/Music/bing-url.json`。（记得先删掉`bing-url.json`中的旧内容）  
```json
{
  "signature":"signature创建地址",
  "chathub":"chathub地址"
}
```
日后如需更换bing的相关地址，在`bing-url.json`文件中修改即可。  
  
为兼容`penmods`原有的newbing功能，`ydpExt`提供两种使用模式。

- 扩展程序模式: 该模式下可以使用扩展程序。
- newbing模式: 该模式下可以像没装`ydpExt`之前那样使用newbing。

在两种使用模式间切换，只需在penmods中修改以下地址。

|名称|扩展程序模式|newbing模式|
|---|---|---|
|signature创建地址|`http://127.0.0.2:9988`|`http://127.0.0.2:8988`|
|chathub地址|`ws://127.0.0.2:9989`|`ws://127.0.0.2:8989`|

## 扩展程序管理
- 安装或更新一个扩展程序只需要将 包含它本体的文件夹(文件夹内应有`index.js`文件) 放入`/userdisk/youdaoExt/ext`或`/userdisk/chroot/youdaoExt/ext`下即可。  
- 卸载一个扩展程序只需要将包含它本体的文件夹从`/userdisk/youdaoExt/ext`或`/userdisk/chroot/youdaoExt/ext`下删除即可。
## 当前扩展程序
扩展程序主机支持**多任务**(对扩展程序而言)，其操作逻辑与手机类似。  
你可以在`bing聊天界面`点击左边的设置图标查看`服务版本`，其内容即是当前处于前台的扩展程序的名称。
### 前台
扩展程序主机会将 你的输入(你在`bing聊天界面`输入的内容) 送至**处于前台**的扩展程序，同时会将 扩展程序的输出(扩展程序对你的输入做出的回复，就是最后要显示在消息框的内容) 送回`penmods`显示在消息框内。  
### 后台
**处于后台**的扩展程序并不会 挂起(暂停运行) 或关闭，而会保持继续运行。你的输入不会被送至处于后台的扩展程序，处于后台的扩展程序的输出不会被送回`penmods`，且它在处于后台的时间内产生的输出将永远不会被送回。
### 前后台切换及退出扩展程序
参照下文`超级命令`。
### 扩展程序选择页
在扩展程序选择页，你可以选择要启动的或要切换到前台的扩展程序。扩展程序选择页显示在`服务版本`处的名称是`youdaoExt`。在退出一个扩展程序或要切换扩展程序时你会来到此页。
## 超级命令
只有在有扩展程序处于前台时，你可以在`bing聊天界面`输入超级命令。  
超级命令会被**扩展程序主机**接收，而其他输入则会被**扩展程序**接收。  
超级命令是只以一个`#`开头的不含空格的字符串(满足正则表达式`/^(#)([a-zA-Z]+)$/g`)。  
以下是超级命令列表。

- `#exit`: 关闭当前处于前台的扩展程序。
- `#switch`: 启动扩展程序或将后台扩展程序切到前台。
- `#memClean`: 清理运行内存。（不推荐此种方式，即将弃用）

若要向扩展程序输入以`#`开头的内容，请重复首字符`#`，例如: 你想输入`###test`，则输入`####test`，最后扩展程序将收到`###test`。
## 扩展程序错误
当扩展程序中出现 未处理的异常(uncaughtException) 和 在Promise中未处理异常(unhandledRejection) 时，扩展程序会自动关闭。在扩展程序事件处理和响应函数中的错误可以立即看到错误提示；但其他的不会有任何立即提示，需要再次向扩展程序输入内容时才可看到提示。为帮助解决问题，你可以在 词典笔的shell(注意不是容器的shell，除非你的容器内安装了`telnet`) 上telnet到 日志服务器(地址`127.0.0.1`，端口`12345`) 后复现错误收集实时日志并反馈至其作者，涉及到的命令如下。
```bash
telnet 127.0.0.1 12345
```
## 自定义配置
打开位于文件夹`youdaoExt`下的`config.json`，参照下表按需要以`json`格式写入内容。  

|名称|解释|默认值|
|---|---|---|
|`logServerAddr`|日志服务器地址|`127.0.0.1`|
|`logServerPort`|日志服务器端口|`12345`|
|`serverAddr`|扩展程序主机的服务器地址|`127.0.0.2`|
|`signatureServerPort`|使用 **扩展程序模式** 时的signature创建地址的端口|`9988`|
|`chathubServerPort`|使用 **扩展程序模式** 时的chathub地址的端口|`9989`|
|`fallbackSignatureServerPort`|使用 **newbing模式** 时的signature创建地址的端口|`8988`|
|`fallbackChathubServerPort`|使用 **newbing模式** 时的chathub地址的端口|`8989`|

以下是一个例子。  
```json
{
  "logServerAddr": "0.0.0.0",
  "logServerPort": 3344
}
```
此例子会将日志服务器公开到局域网并修改其端口。最后日志服务器地址为词典笔的局域网ip，端口为`3344`。
## 内置扩展程序的使用
### gpt
目前只支持`API`版本的gpt，配置方法参考[此处](./install.md#gpt)。  
  
具体使用方法同`penmods`的`bing`，不多赘述。  
  
特有的命令如下。

- `##save`: 导出当前对话到`/userdisk/Music/gpt`。
- `##retry`: 重新发送你的最后一次输入。
- `##new`: 开始新对话。

如需输入以`#`开头的消息，请参考一下转义示例。

|想输入的|实际要输入的|
|---|---|
|`# Title`|`### Title`|
|`## Title`|`#### Title`|

### terminal
注意: 

1) 此终端不是一个`tty`终端。
2) 终端用户是`root`，请注意防护。
3) 假如你输入`YourInput`，此终端实现`prompt`的原理是向`bash`的`stdin`写入```YourInput\necho \`whoami\`@\`hostname\`:\`pwd\`#\n```，所以例如使用`apt install`时，请带上`-y`参数。

### textweb
#### 配置
配置textweb，请参考[此处](./install.md#textweb)
#### tabs
消息框右下角的数字含义: 当前Tab的id/最大的`Tab's id`。  
一些特殊Tab（tabId<0）:

|id|名称|使用方法|
|---|---|---|
|`-1`|初始页，或者叫主页|直接输入url查看对应网站（注意，url需要带协议名称）。|
|`-2`|Tab切换页|直接在`参考候选`选择Tab。|

在正常tab（tabId>=0）上，你只能 输入对应指令进行相关操作 或 输入以`>`开头的内容传入由类型为`handle`的textweb扩展程序处理的网站（比如内置的百度和萌娘百科搜索）。
#### 自定义主页
主页的`参考候选`中的链接可自定义。  
配置文件位于`/userdisk/Music/textweb/sites.json`（若文件不存在请自行创建），其格式如下: 
```json
{
    "sites": ["链接1", "链接2", "链接3"]
}
```
#### 链接
在网页上的链接通常会被标为蓝色且有这种格式: `链接名称[链接id]`。  
直接输入链接id会在新tab打开对应链接。
#### 命令
以下是命令列表: 

- `info`: 查看当前tab的标题和链接。
- `show`: 重新展示当前tab。
- `save`: 离线页面至`/userdisk/Music/textweb/offline`。
- `refresh`: 重新加载当前tab。
- `close`: 关闭当前tab。
- `open 链接`: 在新tab中打开链接（你输入的`链接`）。
- `switch`: 进入`Tab切换页`。

#### cookie
为特定网站加载cookie（常用于对抗反爬虫机制）。  
cookie文件请放在`/userdisk/Music/textweb/cookie`下，参考以下格式: 
```json
{
    "cookie": "你提取的cookie",
    "banSite": []
}
```
关于cookie文件的命名，参考以下例子:  
当为网站`www.github.com`加载cookie时，会依次读取以下cookie文件并合成最终cookie:

- `www.github.com.json`
- `github.com.json`
- `com.json`

现在你应该知道如何命名cookie文件了。  
假如现在你不想让`docs.github.com`加载cookie文件`github.com.json`，则在`github.com.json`中的`banSite`添加元素`docs.github.com`，现在你应该知道`banSite`的作用了。
#### 支持的网页参数

|名称|支持的|
|---|---|
|协议|`http`,`https`|
|`content-encoding`|`br`,`gzip`,`deflate`,不压缩|
|网页编码格式|`utf-8`|
|请求方法|`GET`|
|http版本|`1.1`|
|`connection`|`closed`,`keep-alive`|
|重定向`statusCode`|`301`,`302`,`307`,`308`|

#### 扩展程序
分为`config`、`hook`和`handle`三种。