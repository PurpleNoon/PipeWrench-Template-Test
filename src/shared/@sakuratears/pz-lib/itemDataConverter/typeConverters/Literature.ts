import type { Literature } from '@asledgehammer/pipewrench'
import { BaseConverter } from './BaseConverter'
import {
  baseDataToItem,
  baseItemToData,
  type BaseItemData,
} from '../InventoryItem'
import type { DataToItemResult, ItemToDataResult } from '../types'

export interface LiteratureData extends BaseItemData {
  numberOfPages?: number
  alreadyReadPages?: number
  canBeWrite?: boolean
  customPages?: string[]
  lockedBy?: string
}

export class LiteratureConverter extends BaseConverter {
  itemType = 'Literature'

  selfItemToData(item: Literature): ItemToDataResult<LiteratureData> {
    const result = baseItemToData(item)
    if (result.reason) {
      return result
    }
    const data = result.data as LiteratureData
    const numberOfPages = item.getNumberOfPages()
    if (numberOfPages !== -1) {
      data.numberOfPages = numberOfPages
    }
    const alreadyReadPages = item.getAlreadyReadPages()
    if (alreadyReadPages !== 0) {
      data.alreadyReadPages = alreadyReadPages
    }
    const canBeWrite = item.canBeWrite()
    if (canBeWrite) {
      data.canBeWrite = canBeWrite
    }
    const customPages = item.getCustomPages()
    if (customPages) {
      data.customPages = []
      let index = 1
      let content = item.seePage(index)
      while (content) {
        data.customPages.push(content)
        index = index + 1
        content = item.seePage(index)
      }
    }
    const lockedBy = item.getLockedBy()
    if (lockedBy) {
      data.lockedBy = lockedBy
    }
    return {
      data,
    }
  }

  selfDataToItem(data: LiteratureData): DataToItemResult<Literature> {
    const result = baseDataToItem(data) as DataToItemResult<Literature>
    if (result.reason) {
      return result
    }
    const item = result.item!

    if (data.numberOfPages) {
      item.setNumberOfPages(data.numberOfPages)
    }
    if (data.alreadyReadPages) {
      item.setAlreadyReadPages(data.alreadyReadPages)
    }
    if (data.canBeWrite) {
      item.setCanBeWrite(data.canBeWrite)
    }
    if (data.customPages) {
      data.customPages.forEach((content, index) => {
        item.addPage(index, content)
      })
    }
    if (data.lockedBy) {
      item.setLockedBy(data.lockedBy)
    }

    return {
      item,
    }
  }
}
