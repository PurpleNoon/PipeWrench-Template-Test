## todo list

- b42 build
<!-- "@asledgehammer/tstl-pipewrench": "^41.78.19", -->

1. 长任务调度
   暂停功能
   处理游戏暂停的情况

任务结束后，结束任务在不断的被调用
nextRenderTick 有问题，回调未被清除(pipewrench 的 java 部分有问题，removeListener 是 Add)
Warning: Moveable not valid.
写 task 的简化写法
预计剩余时间
持续时间和实际执行时间
tps 显示/计算可能有点问题，有时候会闪过几百
历史执行的任务展示
对外暴露的函数整理一下
性能监测

2. 物品数据转换
3. tstl compiler，luaBundle 版本隔离
4. java types 和 lua types 变量命名、变量类型、api 和变量描述的提取与合并(另外，strict types version)
5. pipewrench 在线文档网站
6. pipewrench types i18n description

- pipewrench monorepo
- pipewrench cli & create-pipewrench-app
- type docs，严格模式（比如 ui 组件，不用 [x: string]: any）
- 请求和全局数据相关的工具函数
- 实现 ui 布局管理，新的 ui 组件，ui 组件问题修复（long task）
- b42 types

## other todo

- proxy
- request wrapper
- ui plus
  - ui element listener
  - layout manager
  - virtual list
  - input can edit large text
- item data convertor
- global data wrapper
- ts to lua mod
  - 代码与其他项目隔离
  - 与指定项目共享代码
- generate lua types from web docs
  - 将有命名的 lua 文档和混淆的文档合并
  - 现存的问题：java types 缺少参数名称，lua types 缺少变量类型
- 空闲时间时调度执行耗时长的任务&loading
  - 调度档 60fps 45fps 30fps 15fps 10fps 5fps(server)
  - task:step() :init() :finish()

## pipewrench

1. pipewrench 新开一个仓库/分支，版本号 41001.78001.16001？
   趁此机会，设计 compile 区分版本的 pipewrench
   外加类似于 create-react-app 的设计？
   可能需要一个 ci，当版本号 >= 990 时，报错以避免错误的影响 pz 版本号

2. mod publish using ts
3. lua 5.1 to lua jit? 就像饥荒那个改造一样？工程量可能会非常大，因为不是引用的 dll
4. eslint 规则改造（但目前没有时间去做）
5. pipewrench compiler 性能优化，现在似乎挺慢的
6. 补充构建 library 的教程文档
   tsconfig 设置
   luaLibImport require
   luaBundle 和 lUABundleEntry 不能同时使用
   work with other mods?

- 这里可能需要按命名空间存放生成后代码及 lua_modules
- 或者弄一个通用的 mod
- 亦或者是弄成 bundle v x.x.x
- 总会存在旧的 library
  全局变量声明
  mod 加载顺序，推荐 client 和 server 不要互相引用，都从 shared 中引用
  自定义 eventEmit 例子
  mod namespace

8. this.width 不存在，但却显示 any(strict types version)
9. 项目依赖分析，按需编译文件和 mod 文件自动刷新
10. pipewrench 缺少部分类型或者部分类型错误，比如
11. 发布时保存提交的文件列表，并校验当次提交文件列表和之前提交的文件列表，若缺少文件，报错（或根据配置报 warning）

java

- Float class
- itemVisual m_Hue、m_Decal、getBaseTexture
- ArrayList 泛型不太行
- getWorld().getAllTiles() 的返回类型可能不对

11. ZedScript vscode 扩展改改那个换行问题

## 已完成

- [x] PipeWrench.lua 是在 shared 中执行的，但 ISPanel 是在 client 端加载的
- [x] 验证一下 shared, client, server 下同名文件的执行情况，看看是否都会被执行
- [x] 模组依赖三端声明拆分设计？现在有个问题是三端代码，shared 端还好，client 端会出现继承 ui 组件时，父类为 nil 的情况
      问题出在应该在 client 端执行的代码在 shared 端执行的，进而导致未能成功，
      需要 pipewrench 拆分三端代码分别执行，这会造成破坏性变更，
- [x] 构建 library 的教程（在 tstl 仓库里）
- [x] class.name 改一下，改成 Type？现在的情况下，占用 name 会导致出问题
- [x] 测试一下 instanceof 等和原型链相关的东西
- [x] PipeWrenchModTemplate monorepo(本地实现了)
- [x] 原生 pz 类的 \_\_\_\_constructor 没处理
- [x] 若 mod 要覆盖 vanilla 的文件， require 就是必须的
- [x] pipewrench 修复 **PW**ClassExtends

## 已删除

- ~~mod 命名空间 声明~~（手动可能更灵活些）
- ~~@namespace 文件夹的内容会被放在命名空间文件夹下(先待定)~~
- lua_modules 放在 mod 命名空间下(先待定)
- ~~注解，@clientOnly，@serverOnly~~
- ~~把 PipeWrench-Compiler 的下面逻辑补回来~~(不再需要)

```lua
_G.PIPEWRENCH_READY = false
triggerEvent('OnPipeWrenchBoot', false)
triggerEvent('OnPipeWrenchClassCreate', false)
Events.OnGameBoot.Add(function()
end)
```

- ~~top class 换成 ISBaseObject？ISBaseObject 新增的内容怎么分享到 ts class~~（尝试实现的时候出了点问题，暂不实现）

## others
### 流程/想法
[x] 先去构建b42的类型
mallet 抽离 json to lua/ts 的部分
java contents to json
lua contents to json
json to lua
json to ts
mallet-web
