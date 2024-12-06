import {
  getSprite,
  InventoryItemFactory,
  type Texture,
  type zombie
} from '@asledgehammer/pipewrench'
import { onRenderTick, onTick } from '@asledgehammer/pipewrench-events'

// @ts-expect-error 暂时添加缺失声明的全局函数
const _getSpriteTexture = _G.getSpriteTexture as (
  sprite: zombie.iso.sprite.IsoSprite
) => Texture

/** 通过贴图名称获取贴图信息 */
export const getTileInfoByName = (tileName: string) => {
  const sprite = getSprite(tileName)
  const texture = _getSpriteTexture(sprite)
  const props = sprite.getProperties()
  const IsMoveAble = props.Is('IsMoveAble')
  const PickUpWeight = props.Val('PickUpWeight') || ''
  const ContainerCapacity = props.Val('ContainerCapacity')
  const FreezerCapacity = props.Val('FreezerCapacity')
  const customItem = props.Val('CustomItem')
  const item = InventoryItemFactory.CreateItem(
    customItem || `Moveables.${tileName}`
  )
  const displayName = item?.getDisplayName() || ''
  const Capacity = ContainerCapacity || FreezerCapacity || ''
  return {
    name: tileName,
    texture: texture,
    displayName,
    IsMoveAble,
    CanBreak: props.Is('CanBreak'),
    PickUpWeight,
    Capacity
  }
}

/** 在下一个 tick 执行任务 */
export const nextTick = (cb: () => void) => {
  const cbWrapper = () => {
    cb()
    onTick.removeListener(cbWrapper)
  }
  onTick.addListener(cbWrapper)
}

/** 在下一个 renderTick 执行任务 */
export const nextRenderTick = (cb: () => void) => {
  const cbWrapper = () => {
    cb()
    onRenderTick.removeListener(cbWrapper)
  }
  onRenderTick.addListener(cbWrapper)
}

/** 执行除法，将除以 0 的结果返回为 0 */
export const divide = (n1: number, n2: number) => {
  if (n2 === 0) {
    return 0
  }
  return n1 / n2
}
