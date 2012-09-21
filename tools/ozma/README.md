# Ozma.js 

Autobuild tool for OzJS based WebApp

## Install:
    npm install -g ozma

## Usage: 
    ozma [build script] --config [configuration file]

## Supported options:
* `-c` or `--config` — 指定配置文件，可省略，默认读取输入文件(`build script`)同级目录下的`ozconfig.json`作为配置文件
* `-s` or `--silent` — 不打印任何提示信息
* `--jam` — 基于Jam的package目录自动生成配置和发布文件
* `--enable-modulelog` — 允许js文件中的console信息打印在终端里

## Examples (with docs):
* [demo1: for production or development](http://dexteryy.github.com/OzJS/examples/buildtool/demo1.html)
* [demo2: for development](http://dexteryy.github.com/OzJS/examples/buildtool/demo2.html)
* [demo3: for production](http://dexteryy.github.com/OzJS/examples/buildtool/demo3.html)
* [demo4: for third party package manager](http://dexteryy.github.com/OzJS/examples/buildtool/demo4.html)

## Source code:
* [View on Github](https://github.com/dexteryy/OzJS/tree/master/tools/ozma/)
