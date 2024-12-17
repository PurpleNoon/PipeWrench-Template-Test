import type { InventoryItem } from '@asledgehammer/pipewrench'
import { createFailResult } from './utils'
import type { ItemToDataResult } from './types'
import type { BaseConverter } from './typeConverters/BaseConverter'

export class ItemConverter {
  // 物品子类放在最前面，防止判断时被父类覆盖导致判断不到
  static typeConverters: BaseConverter[] = []

  /** 将物品转换为物品数据 */
  itemToData(item: InventoryItem): ItemToDataResult {
    if (!item) {
      return createFailResult('EmptyItem')
    }
    const typeConverter = ItemConverter.typeConverters.find((typeConverter) => {
      return typeConverter.canTransferItem(item)
    })
    if (!typeConverter) {
      return createFailResult('UnknownItem')
    }
    return {
      data: typeConverter.itemToData(item),
    }
  }

  /** 物品数据转换为物品 */
  dataToItem(data: object): ItemToDataResult {
    if (typeof data !== 'object') {
      return createFailResult('EmptyItemData')
    }
    const typeConverter = ItemConverter.typeConverters.find((typeConverter) => {
      return typeConverter.canTransferData(data)
    })
    if (!typeConverter) {
      return createFailResult('UnknownItemData')
    }
    return {
      data: typeConverter.dataToItem(data),
    }
  }
}
