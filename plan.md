1. mod 命名空间 声明
2. @namespace 文件夹的内容会被放在命名空间文件夹下(先待定)
3. lua_modules 放在 mod 命名空间下(先待定)
4. 注解，@clientOnly，@serverOnly
5. create-pipewrench
6. 模仿 isaacScript 文档

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
