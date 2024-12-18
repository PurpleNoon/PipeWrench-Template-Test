import { BaseConverter } from './BaseConverter'
import {
  baseDataToItem,
  baseItemToData,
  type BaseItemData,
} from '../InventoryItem'
import type { DataToItemResult, ItemToDataResult } from '../types'
import type { Key } from '@asledgehammer/pipewrench'

export interface KeyData extends BaseItemData {
  keyId: number
  numberOfKey: number
}

export class KeyConverter extends BaseConverter {
  itemType = 'Key'

  selfItemToData(item: Key): ItemToDataResult<KeyData> {
    const result = baseItemToData(item)
    if (result.reason) {
      return result
    }
    const data = result.data as KeyData

    const keyId = item.getKeyId();
    data.keyId = keyId;
    const numberOfKey = item.getNumberOfKey();
    data.numberOfKey = numberOfKey;

    return {
      data,
    }
  }

  selfDataToItem(data: KeyData): DataToItemResult<Key> {
    const result = baseDataToItem(data) as DataToItemResult<Key>
    if (result.reason) {
      return result
    }
    const item = result.item!

    item.setKeyId(data.keyId);
    item.setNumberOfKey(data.numberOfKey);

    return {
      item,
    }
  }
}
