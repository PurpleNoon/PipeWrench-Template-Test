import { BaseConverter } from './BaseConverter'
import {
  baseDataToItem,
  baseItemToData,
  type BaseItemData,
} from '../InventoryItem'
import type { DataToItemResult, ItemToDataResult } from '../types'
import { ArrayList, Food } from '@asledgehammer/pipewrench'

export interface FoodData extends BaseItemData {
  Age: number
  LastAged: number
  calories?: number
  proteins?: number
  lipids?: number
  carbohydrates?: number
  hungChange?: number
  baseHunger?: number
  unhappyChange?: number
  boredomChange?: number
  thirstChange?: number
  Heat?: number
  LastCookMinute?: number
  CookingTime?: number
  Cooked?: boolean
  Burnt?: boolean
  IsCookable?: boolean
  bDangerousUncooked?: boolean
  poisonDetectionLevel?: number
  spices?: string[]
  PoisonPower?: number
  Chef?: string
  OffAge?: number
  OffAgeMax?: number
  painReduction?: number
  fluReduction?: number
  ReduceFoodSickness?: number
  UseForPoison?: number
  freezingTime?: number
  frozen?: boolean
  rottenTime?: number
  compostTime?: number
  cookedInMicrowave?: boolean
  fatigueChange?: number
  endChange?: number
}
// <Item = Food, Data = ItemData>
export class FoodConverter extends BaseConverter<Food, FoodData> {
  itemType = 'Food'

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // declare canTransferItem: (item: any) => item is Food
  // declare itemToData: (item: Food) => ItemToDataResult<FoodData & ItemData>

  selfItemToData(item: Food): ItemToDataResult<FoodData> {
    const result = baseItemToData(item)
    if (result.reason) {
      return result
    }
    const data = result.data as FoodData

    data.Age = item.getAge()
    data.LastAged = item.getLastAged()
    const calories = item.getCalories()
    const proteins = item.getProteins()
    const lipids = item.getLipids()
    const carbohydrates = item.getCarbohydrates()
    if (
      calories !== 0 ||
      proteins !== 0 ||
      lipids !== 0 ||
      carbohydrates !== 0
    ) {
      data.calories = calories
      data.proteins = proteins
      data.lipids = lipids
      data.carbohydrates = carbohydrates
    }
    const hungChange = item.getHungChange()
    if (hungChange !== 0) {
      data.hungChange = hungChange
    }
    const baseHunger = item.getBaseHunger()
    if (baseHunger !== 0) {
      data.baseHunger = baseHunger
    }
    const unhappyChange = item.getUnhappyChangeUnmodified()
    if (unhappyChange !== 0) {
      data.unhappyChange = unhappyChange
    }
    const boredomChange = item.getBoredomChangeUnmodified()
    if (boredomChange !== 0) {
      data.boredomChange = boredomChange
    }
    const thirstChange = item.getThirstChangeUnmodified()
    if (thirstChange !== 0) {
      data.thirstChange = thirstChange
    }
    const Heat = item.getHeat()
    if (Heat !== 1) {
      data.Heat = Heat
    }
    const LastCookMinute = item.getLastCookMinute()
    if (LastCookMinute !== 0) {
      data.LastCookMinute = LastCookMinute
    }
    const CookingTime = item.getCookingTime()
    if (CookingTime !== 0) {
      data.CookingTime = CookingTime
    }
    const Cooked = item.isCooked()
    if (Cooked) {
      data.Cooked = Cooked
    }
    const Burnt = item.isBurnt()
    if (Burnt) {
      data.Burnt = Burnt
    }
    const IsCookable = item.isIsCookable()
    if (IsCookable) {
      data.IsCookable = IsCookable
    }
    const bDangerousUncooked = item.isbDangerousUncooked()
    if (bDangerousUncooked) {
      data.bDangerousUncooked = bDangerousUncooked
    }
    const poisonDetectionLevel = item.getPoisonDetectionLevel()
    if (poisonDetectionLevel !== -1) {
      data.poisonDetectionLevel = poisonDetectionLevel
    }
    const spices = item.getSpices()
    if (spices) {
      data.spices = []
      for (let i = 0; i <= spices.size() - 1; i++) {
        data.spices.push(spices.get(i))
      }
    }
    const PoisonPower = item.getPoisonPower()
    if (PoisonPower !== 0) {
      data.PoisonPower = PoisonPower
    }
    const Chef = item.getChef()
    if (Chef) {
      data.Chef = Chef
    }
    const OffAge = item.getOffAge()
    if (OffAge !== 1000000000) {
      data.OffAge = OffAge
    }
    const OffAgeMax = item.getOffAgeMax()
    if (OffAgeMax !== 1000000000) {
      data.OffAgeMax = OffAgeMax
    }
    const painReduction = item.getPainReduction()
    if (painReduction !== 0) {
      data.painReduction = painReduction
    }
    const fluReduction = item.getFluReduction()
    if (fluReduction !== 0) {
      data.fluReduction = fluReduction
    }
    const ReduceFoodSickness = item.getReduceFoodSickness()
    if (ReduceFoodSickness !== 0) {
      data.ReduceFoodSickness = ReduceFoodSickness
    }
    const UseForPoison = item.getUseForPoison()
    if (UseForPoison !== 0) {
      data.UseForPoison = UseForPoison
    }
    const freezingTime = item.getFreezingTime()
    if (freezingTime !== 0) {
      data.freezingTime = freezingTime
    }
    const frozen = item.isFrozen()
    if (frozen) {
      data.frozen = frozen
    }
    const rottenTime = item.getRottenTime()
    if (rottenTime !== 0) {
      data.rottenTime = rottenTime
    }
    const compostTime = item.getCompostTime()
    if (compostTime !== 0) {
      data.compostTime = compostTime
    }
    const cookedInMicrowave = item.isCookedInMicrowave()
    if (cookedInMicrowave) {
      data.cookedInMicrowave = cookedInMicrowave
    }
    const fatigueChange = item.getFatigueChange()
    if (fatigueChange !== 0) {
      data.fatigueChange = fatigueChange
    }
    const endChange = item.getEndChange()
    if (endChange !== 0) {
      data.endChange = endChange
    }

    return {
      data,
    }
  }

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // declare canTransferData: (data: any) => data is FoodData
  // declare dataToItem: (data: FoodData & ItemData) => DataToItemResult<Food>

  selfDataToItem(data: FoodData): DataToItemResult<Food> {
    const result = baseDataToItem(data) as DataToItemResult<Food>
    if (result.reason) {
      return result
    }
    const item = result.item!

    item.setAge(data.Age)
    item.setLastAged(data.LastAged)
    if (data.calories || data.proteins || data.lipids || data.carbohydrates) {
      data.calories && item.setCalories(data.calories)
      data.proteins && item.setProteins(data.proteins)
      data.lipids && item.setLipids(data.lipids)
      data.carbohydrates && item.setCarbohydrates(data.carbohydrates)
    }
    if (data.hungChange) {
      item.setHungChange(data.hungChange)
    }
    if (data.baseHunger) {
      item.setBaseHunger(data.baseHunger)
    }
    if (data.unhappyChange) {
      item.setUnhappyChange(data.unhappyChange)
    }
    if (data.boredomChange) {
      item.setBoredomChange(data.boredomChange)
    }
    if (data.thirstChange) {
      item.setThirstChange(data.thirstChange)
    }
    if (data.Heat) {
      item.setHeat(data.Heat)
    }
    if (data.LastCookMinute) {
      item.setLastCookMinute(data.LastCookMinute)
    }
    if (data.CookingTime) {
      item.setCookingTime(data.CookingTime)
    }
    if (data.Cooked) {
      item.setCooked(data.Cooked)
    }
    if (data.Burnt) {
      item.setBurnt(data.Burnt)
    }
    if (data.IsCookable) {
      item.setIsCookable(data.IsCookable)
    }
    if (data.bDangerousUncooked) {
      item.setbDangerousUncooked(data.bDangerousUncooked)
    }
    if (data.poisonDetectionLevel) {
      item.setPoisonDetectionLevel(data.poisonDetectionLevel)
    }
    if (data.spices) {
      const itemSpices = new ArrayList()
      data.spices.forEach((spice) => {
        itemSpices.add(spice)
      })
      item.setSpices(itemSpices)
    }
    if (data.PoisonPower) {
      item.setPoisonPower(data.PoisonPower)
    }
    if (data.Chef) {
      item.setChef(data.Chef)
    }
    if (data.OffAge) {
      item.setOffAge(data.OffAge)
    }
    if (data.OffAgeMax) {
      item.setOffAgeMax(data.OffAgeMax)
    }
    if (data.painReduction) {
      item.setPainReduction(data.painReduction)
    }
    if (data.fluReduction) {
      item.setFluReduction(data.fluReduction)
    }
    if (data.ReduceFoodSickness) {
      item.setReduceFoodSickness(data.ReduceFoodSickness)
    }
    if (data.UseForPoison) {
      item.setUseForPoison(data.UseForPoison)
    }
    if (data.freezingTime) {
      item.setFreezingTime(data.freezingTime)
    }
    if (data.frozen) {
      item.setFrozen(data.frozen)
    }
    if (data.rottenTime) {
      item.setRottenTime(data.rottenTime)
    }
    if (data.compostTime) {
      item.setCompostTime(data.compostTime)
    }
    if (data.cookedInMicrowave) {
      item.setCookedInMicrowave(data.cookedInMicrowave)
    }
    if (data.fatigueChange) {
      item.setFatigueChange(data.fatigueChange)
    }
    if (data.endChange) {
      item.setEndChange(data.endChange)
    }

    return {
      item,
    }
  }
}

// const fc = new FoodConverter()
// const fd = fc.itemToData(new Food('', '', '', ''))
