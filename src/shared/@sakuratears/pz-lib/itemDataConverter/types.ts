export type ItemToDataResult<T = unknown> =
  | {
      /** 生成的物品数据 */
      data: T
      /** 生成成功时无失败原因 */
      reason?: undefined
      reasonI18n?: undefined
    }
  | {
      /** 生成失败时无数据 */
      data?: undefined
      /** 生成失败的原因 */
      reason: string
      /** 失败原因的 i18n 键名 */
      reasonI18n: string
    }

export type DataToItemResult<T = unknown> =
  | {
      /** 生成的物品 */
      item: T
      /** 生成成功时无失败原因 */
      reason?: undefined
      reasonI18n?: undefined
    }
  | {
      /** 生成失败时无数据 */
      item?: undefined
      /** 生成失败的原因 */
      reason: string
      /** 失败原因的 i18n 键名 */
      reasonI18n: string
    }
export interface ItemData {
  __ITEM_DATA_TYPE: string
}
