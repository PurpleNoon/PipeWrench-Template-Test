
## Need Test
- Literature
- Food
- AlarmClock
- Key
- KeyRing
- MapItem
- WeaponPart
- Moveable
- 测试一下生成的尸体物品有没有 byteData
- HandWeapon

## Next Todo
<!-- 简单 -->
如果 reason 存在，return data, reason 或 return item, reason 应改为 return nil, reason

<!-- 中等 -->
Radio
pz，为继承生成类型提示缺少：
    - 有参数的new，没有覆盖到（OK）
    - 缺少 pz 额外添加的内置函数

<!-- 困难 -->
根据 java doc 生成 lua types
Clothing
AlarmClockClothing
InventoryContainer

## Other Problem
尸体 byteData 转化问题，通过 IsoDeadBody 的 save 和 load 逻辑，或许能做到取值和赋值，但是很麻烦=-=
测一下 stashMap 有没有用
看一下 recordedMediaIndex 是做什么的
衣服的补丁存取问题，或许可以通过创建一个缝纫等级满级的 IsoGameCharacter 和相应材料来实现
想办法把 __ITEM_DATA_TYPE 干掉

## 已完成
ComboItem
DrainableComboItem


## 已知问题
返回 data 和 reason 的接口，类型提示不够准确，看看能不能更准确些


## Other
transformIntoKahluaTable

