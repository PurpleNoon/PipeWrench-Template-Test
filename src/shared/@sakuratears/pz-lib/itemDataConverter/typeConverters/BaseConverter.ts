import { _instanceof_, type InventoryItem } from '@asledgehammer/pipewrench'
import { createFailResult } from '../utils'
import type { DataToItemResult, ItemData, ItemToDataResult } from '../types'

export abstract class BaseConverter {
  itemType = `UnimplementedItemType`

  /** 检测物品是否能被该 transfer 转换 */
  canTransferItem(item: InventoryItem) {
    return !!item && _instanceof_(item, this.itemType)
  }

  /** 物品转换为物品数据的具体实现 */
  selfItemToData(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    item: InventoryItem,
  ): ItemToDataResult {
    return createFailResult('Unimplemented')
  }

  /** 将物品转换为物品数据 */
  itemToData(item: InventoryItem): ItemToDataResult {
    if (!this.canTransferItem(item)) {
      return createFailResult('WrongItem')
    }
    const result = this.selfItemToData(item)
    if (result.data) {
      (result.data as ItemData).__ITEM_DATA_TYPE = this.itemType
    }
    return result
  }

  /** 检测物品数据是否能被该 converter 转换 */
  canTransferData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ) {
    return !!data && data.__ITEM_DATA_TYPE === this.itemType
  }

  /** 物品数据转换为物品的具体实现 */
  selfDataToItem(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    data: any,
  ): DataToItemResult {
    return createFailResult('Unimplemented')
  }

  /** 物品数据转换为物品 */
  dataToItem(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): DataToItemResult {
    if (!this.canTransferData(data)) {
      return createFailResult('WrongItemDataType')
    }
    return this.selfDataToItem(data)
  }
}
