import { BaseConverter } from './BaseConverter'
import {
  baseDataToItem,
  baseItemToData,
  type BaseItemData,
} from '../InventoryItem'
import type { DataToItemResult, ItemToDataResult } from '../types'
import type { AlarmClock } from '@asledgehammer/pipewrench'

export interface AlarmClockData extends BaseItemData {
  alarmHour: number
  alarmMinutes: number
  alarmSet: boolean
}

export class AlarmClockConverter extends BaseConverter {
  itemType = 'AlarmClock'

  selfItemToData(item: AlarmClock): ItemToDataResult<AlarmClockData> {
    const result = baseItemToData(item)
    if (result.reason) {
      return result
    }
    const data = result.data as AlarmClockData

    const alarmHour = item.getHour();
    data.alarmHour = alarmHour;
    const alarmMinutes = item.getMinute();
    data.alarmMinutes = alarmMinutes;
    const alarmSet = item.isAlarmSet();
    data.alarmSet = alarmSet;

    return {
      data,
    }
  }

  selfDataToItem(data: AlarmClockData): DataToItemResult<AlarmClock> {
    const result = baseDataToItem(data) as DataToItemResult<AlarmClock>
    if (result.reason) {
      return result
    }
    const item = result.item!

    item.setHour(data.alarmHour);
    item.setMinute(data.alarmMinutes);
    item.setAlarmSet(data.alarmSet);

    return {
      item,
    }
  }
}
