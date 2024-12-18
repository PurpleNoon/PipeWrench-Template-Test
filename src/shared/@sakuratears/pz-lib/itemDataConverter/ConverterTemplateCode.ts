// import { BaseConverter } from './BaseConverter'
// import {
//   baseDataToItem,
//   baseItemToData,
//   type BaseItemData,
// } from '../InventoryItem'
// import type { DataToItemResult, ItemToDataResult } from '../types'
// import type { Food } from '@asledgehammer/pipewrench'

// export interface FoodData extends BaseItemData {}

// export class FoodConverter extends BaseConverter {
//   itemType = 'Food'

//   selfItemToData(item: Food): ItemToDataResult<FoodData> {
//     const result = baseItemToData(item)
//     if (result.reason) {
//       return result
//     }
//     const data = result.data as FoodData

//     return {
//       data,
//     }
//   }

//   selfDataToItem(data: FoodData): DataToItemResult<Food> {
//     const result = baseDataToItem(data) as DataToItemResult<Food>
//     if (result.reason) {
//       return result
//     }
//     const item = result.item!

//     return {
//       item,
//     }
//   }
// }
