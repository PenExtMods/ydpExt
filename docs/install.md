# 安装文档
## How to install
### Step0
安装`Penmods`。  
确保你所使用的`Penmods`的版本>=`1.2.0`。
### Step1
从`release`处下载最新的发行版。    
解压所得的所有内容复制到词典笔`/userdisk/`处。  
### Step2
现在有两种安装模式：  
1) 装入chroot容器中：使用高版本的nodejs（目前是v18.13.0，后续可升级），更多特性，支持所有扩展程序，但是容器可能占用一部分存储空间。  
2) 直接安装：节省空间，使用固定版本的nodejs单文件版（v17.3.0），支持绝大多数扩展程序，但不能运行使用高版本nodejs特性的扩展程序。
#### chroot容器
开始之前，请确保你的chroot容器安装在`/userdisk/chroot`。  
执行如下命令。
```
cd /userdisk/
chmod +x ./install.chroot.sh
./install.chroot.sh
```
#### 直接安装
执行如下命令。
```
cd /userdisk/
chmod +x ./install.native.sh
./install.native.sh
```
### Step3
现在来测试安装是否成功。  
在shell中执行`youdaoExt`命令，等待20秒左右（因为启动脚本中有20秒延时防止随系统启动时抢占系统资源影响`penmods`注入），看到类似如下输出视为成功。   
```
[version] youdaoExtBingServer version 1.0.0 .
[copyright] this project is developed by Wxp, MIT License Copyright (c) 2023 Wxp
[repo] you can find this project at "https://github.com/DSFdsfWxp/ydpExt".
[platform] running on "arm64","linux".
[nodejs] current nodejs version is "v18.13.0".
[path] current working path is "/youdaoExt".
[env] current ydpSysRootPath is "/proc/1/root".
[env] current mtpPath is "/proc/1/root/userdisk/Music".
[config] loading config...
[config] loaded config.
[fallback] current fallback bing signatue create url is "https://www.bing.com/turing/conversation/create".
[fallback] current fallback bing chathub url is "wss://sydney.bing.com/sydney/ChatHub".
[info] starting...
[info]
[info] signature create server listened at "http://127.0.0.2:9988" .
[info] chathub server listened at "ws://127.0.0.2:9989" .
[info] fallback signature create server listened at "http://127.0.0.2:8988" .
[info] fallback chathub server listened at "ws://127.0.0.2:8989" .
[info] log server listened at 127.0.0.1:12345 .
[info] started.
[info]
```
### Step4
在penmods中配置。  
先将你原来的bing的signature创建地址和chathub地址按照下面的格式写到文件`/userdisk/Music/bing-url.json`中（记得先删掉`bing-url.json`中的旧内容）。  
```
{
  "signature":"signature创建地址",
  "chathub":"chathub地址"
}
```  
然后现在介绍两种使用模式。  
#### 使用扩展程序
通过此模式使用本项目。  
penmods中的signature创建地址改成`http://127.0.0.2:9988`，chathub地址改成`ws://127.0.0.2:9989`。  
#### 使用bing
通过此模式使用newbing。  
penmods中的signature创建地址改成`http://127.0.0.2:8988`，chathub地址改成`ws://127.0.0.2:8989`。  
日后如需更换bing的相关地址，在`bing-url.json`文件中修改即可。
### Step5
配置扩展程序。  
#### gpt
打开文件`/userdisk/youdaoExt/ext/gpt/config.json`，将`https://api.openai.com/v1/chat/completions`换成你自己搭建的对应代理地址，将`sk-ThisIsAnExampleKeyPleaseReplaceItWithYourKey`换成你自己的apiKey。  
#### textweb
打开文件`/userdisk/youdaoExt/ext/textweb/ext/www.baidu.com/cookie.txt`，填入你自己提取的百度的`cookie`（登没登百度账号无所谓）。（此处的`cookie`可以用入坑penmods的newbing时提到的`Cookie-Editor`提取得到(请先升级`Cookie-Editor`到最新版本)，不过步骤略有不同，提取时先点`Export`，再点`Header String`，随后即可粘贴到指定地方。）  
### Step6
重启词典笔。ydpExt会随系统自启。
## How to uninstall
注意: 卸载程序会移除以下文件（夹），如需要请先自行备份。

- /userdisk/Music/gpt
- /userdisk/Music/textweb
- /userdisk/Music/bing-url.json

注意: 请一定在**指定的工作目录**执行脚本（因为脚本使用了相对位置），否则后果自负。
### 直装版
在`/userdisk`下运行`uninstall.native.sh`。
### 容器版
在`/userdisk`下运行`uninstall.chroot.sh`。
## How to update
**0x0** 下载最新发行版的用于升级的压缩包，解压。  
**0x1** 复制`youdaoExt`至ydp覆盖同名文件夹。