import { _instanceof_, type InventoryItem } from '@asledgehammer/pipewrench'
import { createFailResult } from '../utils'
import type { DataToItemResult, ItemData, ItemToDataResult } from '../types'
import type { BaseItemData } from '../InventoryItem'

export abstract class BaseConverter<Item = InventoryItem, Data = BaseItemData> {
  itemType = `UnimplementedItemType`

  /** 检测物品是否能被该 transfer 转换 */

  canTransferItem(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any,
  ): item is Item {
    return !!item && _instanceof_(item, this.itemType)
  }

  /** 物品转换为物品数据的具体实现 */
  selfItemToData(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    item: Item,
  ): ItemToDataResult<Data> {
    return createFailResult('Unimplemented')
  }

  /** 将物品转换为物品数据 */
  itemToData(item: Item): ItemToDataResult<Data & ItemData> {
    if (!this.canTransferItem(item)) {
      return createFailResult('WrongItem')
    }
    const result = this.selfItemToData(item) as ItemToDataResult<
      Data & ItemData
    >
    if (result.data) {
      result.data.__ITEM_DATA_TYPE = this.itemType
      return result
    }
    return result
  }

  /** 检测物品数据是否能被该 converter 转换 */
  canTransferData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): data is Data {
    return !!data && data.__ITEM_DATA_TYPE === this.itemType
  }

  /** 物品数据转换为物品的具体实现 */
  selfDataToItem(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    data: Data,
  ): DataToItemResult<Item> {
    return createFailResult('Unimplemented')
  }

  /** 物品数据转换为物品 */
  dataToItem(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): DataToItemResult<Item> {
    if (!this.canTransferData(data)) {
      return createFailResult('WrongItemDataType')
    }
    return this.selfDataToItem(data)
  }
}
