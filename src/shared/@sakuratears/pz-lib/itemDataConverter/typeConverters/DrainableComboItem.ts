import { BaseConverter } from './BaseConverter'
import {
  baseDataToItem,
  baseItemToData,
  type BaseItemData,
} from '../InventoryItem'
import type { DataToItemResult, ItemToDataResult } from '../types'
import type { DrainableComboItem } from '@asledgehammer/pipewrench'

export type DrainableComboItemData = BaseItemData

export class DrainableComboItemConverter extends BaseConverter {
  itemType = 'DrainableComboItem'

  selfItemToData(
    item: DrainableComboItem,
  ): ItemToDataResult<DrainableComboItemData> {
    return baseItemToData(item)
  }

  selfDataToItem(
    data: DrainableComboItemData,
  ): DataToItemResult<DrainableComboItem> {
    return baseDataToItem(data) as DataToItemResult<DrainableComboItem>
  }
}
