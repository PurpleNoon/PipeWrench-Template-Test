import {
  getSprite,
  getTexture,
  instanceItem,
  isClient,
  IsoDirections,
  isServer,
  type IsoSprite,
} from '@asledgehammer/pipewrench'
import { onRenderTick, onTick } from '@asledgehammer/pipewrench-events'

/**
 * 获取当前运行在哪端？
 * @returns sp 单人，client 多人客户端，server 多人服务端
 */
export const getRunMode = () => {
  if (isClient()) {
    return 'client'
  }
  if (isServer()) {
    return 'server'
  }
  return 'sp'
}

export const getSpriteTexture = (sprite: IsoSprite) => {
  const spriteName = sprite.getName()
  if (!spriteName || spriteName === '') {
    return
  }
  return (
    sprite.LoadFrameExplicit(spriteName) ||
    getTexture(`media/texturepacks/${spriteName}`) ||
    sprite.getTextureForCurrentFrame(IsoDirections.N)
  )
}

/** 通过贴图名称获取贴图信息 */
export const getTileInfoByName = (tileName: string) => {
  const sprite = getSprite(tileName)
  const texture = getSpriteTexture(sprite)
  const props = sprite.getProperties()
  const IsMoveAble = props.Is('IsMoveAble')
  const PickUpWeight = props.Val('PickUpWeight') || ''
  const ContainerCapacity = props.Val('ContainerCapacity')
  const FreezerCapacity = props.Val('FreezerCapacity')
  const customItem = props.Val('CustomItem')
  const itemId = customItem || `Moveables.${tileName}`
  const item = instanceItem(itemId, 1)
  const displayName = item?.getDisplayName() || ''
  const Capacity = ContainerCapacity || FreezerCapacity || ''
  return {
    name: tileName,
    texture: texture,
    displayName,
    IsMoveAble,
    CanBreak: props.Is('CanBreak'),
    PickUpWeight,
    Capacity,
  }
}

/** 在下一个 tick 执行任务 */
export const nextTick = (cb: () => void) => {
  const cbWrapper = () => {
    onTick.removeListener(cbWrapper)
    // print('[FILTER_TAG]remove tick')
    cb()
  }
  onTick.addListener(cbWrapper)
}

/** 在下一个 renderTick 执行任务 */
export const nextRenderTick = (cb: () => void) => {
  const cbWrapper = () => {
    onRenderTick.removeListener(cbWrapper)
    // print('[FILTER_TAG]remove render tick')
    cb()
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

/**
 * 返回移除了相应属性的新对象
 */
export const omit = <T extends object, TKeys extends keyof T>(
  obj: T,
  keys: TKeys[],
): Omit<T, TKeys> => {
  const nowObj = { ...obj }
  keys.forEach((key) => {
    delete nowObj[key]
  })
  return nowObj
}
