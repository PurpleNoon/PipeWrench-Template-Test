1. mod 命名空间 声明
2. @namespace 文件夹的内容会被放在命名空间文件夹下(先待定)
3. lua_modules 放在 mod 命名空间下(先待定)
4. ~~注解，@clientOnly，@serverOnly~~
5. create-pipewrench
6. 模仿 isaacScript 文档
7. [x] pipewrench 修复 __PW__ClassExtends

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
- 空闲时间时调度执行耗时长的任务&loading
    - 调度档 60fps 45fps 30fps 15fps 10fps 5fps(server)
    - task:step() :init() :finish()
    - System.currentTimeMillis()


## pipewrench
1. 把 PipeWrench-Compiler 的下面逻辑补回来
```lua
_G.PIPEWRENCH_READY = false
triggerEvent('OnPipeWrenchBoot', false)
triggerEvent('OnPipeWrenchClassCreate', false)
Events.OnGameBoot.Add(function()
end)
```
2. pipewrench 新开一个仓库/分支，版本号 41001.78001.16001？
趁此机会，设计 compile 区分版本的 pipewrench
外加类似于 create-react-app 的设计？
可能需要一个 ci，当版本号 >= 990 时，报错以避免错误的影响 pz 版本号
3. [x] PipeWrench.lua 是在 shared 中执行的
但 ISPanel 是在 client 端加载的
之后抽空得验证一下这个的加载情况：modA 依赖 modB
原生 shared, client, server
modA shared, client, server
modB shared, client, server
local ISPanel = ____pipewrench.ISPanel
4. [x] 验证一下 shared, client, server 下同名文件的执行情况，看看是否都会被执行
5. [x] 现在有个问题是三端代码，shared 端还好，client 端会出现继承 ui 组件时，父类为 nil 的情况
问题出在应该在 client 端执行的代码在 shared 端执行的，进而导致未能成功，
需要 pipewrench 拆分三端代码分别执行，这会造成破坏性变更，
并且 pipewrench 现在版本号的设计导致版本号不能变=-=

需要改造的仓库
- asledgehammer/pipewrench-modeler

[x] 增加以下文件
lua.shared.interface.partial.lua
lua.shared.api.partial.d.ts

lua.server.interface.partial.lua
lua.server.api.partial.d.ts

lua.client.interface.partial.lua
lua.client.api.partial.d.ts


- asledgehammer/pipewrench

scripts/stitch.ts
[x] 增加以下文件
server.d.ts
server.lua

client.d.ts
client.lua

[x] 调整 client 和 server 的 import shared


- asledgehammer/pipewrench-compiler
[x] 从依赖中分离 client 和 server 的导入并移动到指定位置

@asledgehammer/pipewrench/client
=>
media/lua/client/lua_modules/@asledgehammer/pipewrench

先收集所有依赖，
- . 和 / 开头的依赖不要，说明不是 node_modules 里的依赖
解析所有依赖对应的 package，获取对应的配置
在 beforeEmit 中分析 lua_modules 中路径为 client 和 server 的文件和文件夹，
移动指定的文件和文件夹到指定位置

package.json
"pzpw": {
  "client": "client",
  "server": "server"
}

@asledgehammer/pipewrench/client.lua
@asledgehammer/pipewrench/client/


6. [x] 模组依赖三端声明拆分设计？
7. monorepo? Nx/Turborepo? 但是这可能将花费不短的时间（pnpm 可能不太合适，因为当前仓库生态不行）
8. mod publish
9. lua 5.1 to lua jit? 就像饥荒那个改造一样？工程量可能会非常大，因为不是引用的 dll
10. eslint 规则改造（但目前没有时间去做）
11. 在能够正常运行 mod 后，参照 issacscript 文档构建专属文档
12. [x] 构建 library 的教程
13. pipewrench compiler 性能优化，现在似乎挺慢的
14. [x] class.name 改一下，改成 Type？现在的情况下，占用 name 会导致出问题
14. [x] 测试一下 instanceof 等和原型链相关的东西
15. [x] PipeWrenchModTemplate monorepo
16. 整理一下 PipeWrenchModTemplate？
17. lualib_bundle v x.x.x，即文件的版本冲突问题
18. 补充构建 library 的教程文档
tsconfig 设置
    luaLibImport require
    luaBundle 和 lUABundleEntry 不能同时使用
work with other mods?
  - 这里可能需要按命名空间存放生成后代码及 lua_modules
  - 或者弄一个通用的 mod
  - 亦或者是弄成 bundle v x.x.x
  - 总会存在旧的 library
全局变量声明
19. top class 换成 ISBaseObject？ISBaseObject 新增的内容怎么分享到 ts class
20. [x] 原生 pz 类的 ____constructor 没处理
21. 关于 pipeWrench 的版本号，提个 issues


## 加载顺序测试

若 mod 要覆盖 vanilla 的文件， require 就是必须的


this.width 不存在，但却显示 any
