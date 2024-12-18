import type { ComboItem } from '@asledgehammer/pipewrench'
import { BaseConverter } from './BaseConverter'
import {
  baseDataToItem,
  baseItemToData,
  type BaseItemData,
} from '../InventoryItem'
import type { DataToItemResult, ItemToDataResult } from '../types'

export type ComboItemData = BaseItemData

export class ComboItemConverter extends BaseConverter {
  itemType = 'ComboItem'

  selfItemToData(item: ComboItem): ItemToDataResult<ComboItemData> {
    return baseItemToData(item)
  }

  selfDataToItem(data: ComboItemData): DataToItemResult<ComboItem> {
    return baseDataToItem(data)
  }
}
