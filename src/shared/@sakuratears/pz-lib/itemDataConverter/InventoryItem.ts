import {
  BloodBodyPartType,
  Color,
  ImmutableColor,
  InventoryItemFactory,
  type DrainableComboItem,
  type InventoryItem,
  type ItemVisual,
} from '@asledgehammer/pipewrench'
import { createFailResult, isNullOrWhitespace } from './utils'
import type { DataToItemResult, ItemToDataResult } from './types'

export interface MTint {
  r: number
  g: number
  b: number
}

export interface ItemVisualData {
  m_fullType: string
  m_alternateModelName: string
  m_clothingItemName: string
  m_Tint?: MTint
  m_BaseTexture?: number
  m_TextureChoice?: number
  m_Hue?: number
  m_Decal?: string
  blood: number[]
  dirt: number[]
  holes: number[]
  basicPatches: number[]
  denimPatches: number[]
  leatherPatches: number[]
}

export interface ColorRgba {
  r: number
  g: number
  b: number
  a: number
}

export interface BaseItemData {
  fullType: string
  registry_id: number
  saveType: number
  id: number
  isDrainable?: boolean
  usedDelta?: number
  condition?: number
  visual?: ItemVisualData
  isCustomColor?: boolean
  color?: ColorRgba
  itemCapacity?: number
  table?: object
  isActivated?: boolean
  haveBeenRepaired?: number
  name?: string
  extraItems?: string[]
  isCustomName?: boolean
  isCustomWeight?: boolean
  actualWeight?: number
  keyId?: number
  isTaintedWater?: boolean
  remoteControlID?: number
  remoteRange?: number
  colorRed?: number
  colorGreen?: number
  colorBlue?: number
  worker?: string
  wetCooldown?: number
  isFavorite?: boolean
  isInfected?: boolean
  currentAmmoCount?: number
  attachedSlot?: number
  attachedSlotType?: string
  attachedToModel?: string
  maxCapacity?: number
  recordedMediaIndex?: boolean
  isInitialised?: boolean
}

export const bloodBodyPartTypeList = [
  BloodBodyPartType.Hand_L,
  BloodBodyPartType.Hand_R,
  BloodBodyPartType.ForeArm_L,
  BloodBodyPartType.ForeArm_R,
  BloodBodyPartType.UpperArm_L,
  BloodBodyPartType.UpperArm_R,
  BloodBodyPartType.Torso_Upper,
  BloodBodyPartType.Torso_Lower,
  BloodBodyPartType.Head,
  BloodBodyPartType.Neck,
  BloodBodyPartType.Groin,
  BloodBodyPartType.UpperLeg_L,
  BloodBodyPartType.UpperLeg_R,
  BloodBodyPartType.LowerLeg_L,
  BloodBodyPartType.LowerLeg_R,
  BloodBodyPartType.Foot_L,
  BloodBodyPartType.Foot_R,
  BloodBodyPartType.Back,
  BloodBodyPartType.MAX,
]

export const itemVisualToData = (itemVisual: ItemVisual) => {
  const data = {} as ItemVisualData
  data.m_fullType = itemVisual.getItemType()
  data.m_alternateModelName = itemVisual.getAlternateModelName()
  data.m_clothingItemName = itemVisual.getClothingItemName()
  const m_Tint = itemVisual.getTint()
  if (m_Tint) {
    data.m_Tint = {
      r: m_Tint.getRedByte(),
      g: m_Tint.getGreenByte(),
      b: m_Tint.getBlueByte(),
    }
  }
  const m_BaseTexture = itemVisual.getBaseTexture() as number
  if (m_BaseTexture !== -1) {
    data.m_BaseTexture = m_BaseTexture
  }
  const m_TextureChoice = itemVisual.getTextureChoice() as number
  if (m_TextureChoice !== -1) {
    data.m_TextureChoice = m_TextureChoice
  }
  const m_Hue = (itemVisual as ItemVisual & { m_Hue: number }).m_Hue
  if (m_Hue !== Float.POSITIVE_INFINITY) {
    data.m_Hue = m_Hue
  }
  const m_Decal = (itemVisual as ItemVisual & { m_Decal: string }).m_Decal
  if (!isNullOrWhitespace(m_Decal)) {
    data.m_Decal = m_Decal
  }
  data.blood = bloodBodyPartTypeList.map((bloodBodyPartType) =>
    itemVisual.getBlood(bloodBodyPartType),
  )
  data.dirt = bloodBodyPartTypeList.map((bloodBodyPartType) =>
    itemVisual.getDirt(bloodBodyPartType),
  )
  data.holes = bloodBodyPartTypeList.map((bloodBodyPartType) =>
    itemVisual.getHole(bloodBodyPartType),
  )
  data.basicPatches = bloodBodyPartTypeList.map((bloodBodyPartType) =>
    itemVisual.getBasicPatch(bloodBodyPartType),
  )
  data.denimPatches = bloodBodyPartTypeList.map((bloodBodyPartType) =>
    itemVisual.getDenimPatch(bloodBodyPartType),
  )
  data.leatherPatches = bloodBodyPartTypeList.map((bloodBodyPartType) =>
    itemVisual.getLeatherPatch(bloodBodyPartType),
  )
  return data
}

export const baseItemToData = (
  item: InventoryItem,
): ItemToDataResult<BaseItemData> => {
  const data = {} as BaseItemData
  data.fullType = item.getFullType()
  data.registry_id = item.getRegistry_id()
  data.saveType = item.getSaveType()
  data.id = item.getID()
  const isDrainableItem = (item: InventoryItem): item is DrainableComboItem =>
    item.IsDrainable()
  // print('isDrainable: ' + tostring(isDrainableItem(item)))
  if (isDrainableItem(item)) {
    const usedDelta = item.getUsedDelta()
    // print('usedDelta: ' + tostring(usedDelta))
    if (usedDelta < 1) {
      data.isDrainable = true
      data.usedDelta = usedDelta
    }
  }
  const condition = item.getCondition()
  const conditionMax = item.getConditionMax()
  if (condition !== conditionMax) {
    data.condition = condition
  }
  const visual = item.getVisual()
  if (visual) {
    data.visual = itemVisualToData(visual)
  }
  const isCustomColor = item.isCustomColor()
  const colorObject = item.getColor()
  const color = {
    r: colorObject.getR(),
    g: colorObject.getG(),
    b: colorObject.getB(),
    a: colorObject.getAlphaFloat(),
  }
  if (
    isCustomColor &&
    (color.r !== 1 || color.g !== 1 || color.b !== 1 || color.a !== 1)
  ) {
    data.isCustomColor = isCustomColor
    data.color = color
  }
  const itemCapacity = item.getItemCapacity()
  if (itemCapacity !== -1) {
    data.itemCapacity = itemCapacity
  }
  if (item.hasModData()) {
    data.table = item.getModData()
  }
  const isActivated = item.isActivated()
  if (isActivated) {
    data.isActivated = isActivated
  }
  const haveBeenRepaired = item.getHaveBeenRepaired()
  if (haveBeenRepaired !== 1) {
    data.haveBeenRepaired = haveBeenRepaired
  }
  const name = item.getDisplayName()
  if (name) {
    data.name = name
  }
  // TODO: 目前含有物品的尸体无法转换为物品数据
  if (item.getByteData()) {
    return createFailResult('CorpseHasItem')
  }
  const extraItems = item.getExtraItems()
  if (extraItems && extraItems.size() > 0) {
    data.extraItems = []
    for (let i = 0; i <= extraItems.size() - 1; i += 1) {
      data.extraItems.push(extraItems.get(i))
    }
  }
  const isCustomName = item.isCustomName()
  if (isCustomName) {
    data.isCustomName = isCustomName
  }
  const isCustomWeight = item.isCustomWeight()
  if (isCustomWeight) {
    data.isCustomWeight = isCustomWeight
    data.actualWeight = item.getActualWeight()
  }
  const keyId = item.getKeyId()
  if (keyId !== -1) {
    data.keyId = keyId
  }
  const isTaintedWater = item.isTaintedWater()
  if (isTaintedWater) {
    data.isTaintedWater = isTaintedWater
  }
  const remoteControlID = item.getRemoteControlID()
  const remoteRange = item.getRemoteRange()
  if (remoteControlID !== -1 || remoteRange !== 0) {
    data.remoteControlID = remoteControlID
    data.remoteRange = remoteRange
  }
  const colorRed = item.getColorRed()
  const colorGreen = item.getColorGreen()
  const colorBlue = item.getColorBlue()
  if (colorRed !== 1 || colorGreen !== 1 || colorBlue !== 1) {
    data.colorRed = colorRed
    data.colorGreen = colorGreen
    data.colorBlue = colorBlue
  }
  const worker = item.getWorker()
  if (worker) {
    data.worker = worker
  }
  const wetCooldown = item.getWetCooldown()
  if (wetCooldown !== -1) {
    data.wetCooldown = wetCooldown
  }
  const isFavorite = item.isFavorite()
  if (isFavorite) {
    data.isFavorite = isFavorite
  }
  const isInfected = item.isInfected()
  if (isInfected) {
    data.isInfected = isInfected
  }
  const currentAmmoCount = item.getCurrentAmmoCount()
  if (currentAmmoCount !== 0) {
    data.currentAmmoCount = currentAmmoCount
  }
  const attachedSlot = item.getAttachedSlot()
  if (attachedSlot !== -1) {
    data.attachedSlot = attachedSlot
  }
  const attachedSlotType = item.getAttachedSlotType()
  if (attachedSlotType) {
    data.attachedSlotType = attachedSlotType
  }
  const attachedToModel = item.getAttachedToModel()
  if (attachedToModel) {
    data.attachedToModel = attachedToModel
  }
  const maxCapacity = item.getMaxCapacity()
  if (maxCapacity !== -1) {
    data.maxCapacity = maxCapacity
  }
  // const isRecordedMedia = item.isRecordedMedia()
  // // TODO: ??? 似乎有点问题
  // if (isRecordedMedia) {
  //   data.recordedMediaIndex = isRecordedMedia
  // }
  const isInitialised = item.isInitialised()
  if (isInitialised) {
    data.isInitialised = isInitialised
  }
  return {
    data,
  }
}

export const assignItemVisualData = (
  visual: ItemVisual,
  data: ItemVisualData,
) => {
  visual.setItemType(data.m_fullType)
  visual.setAlternateModelName(data.m_alternateModelName)
  visual.setClothingItemName(data.m_clothingItemName)
  if (data.m_Tint) {
    visual.setTint(
      new ImmutableColor(data.m_Tint.r, data.m_Tint.g, data.m_Tint.b),
    )
  }
  if (data.m_BaseTexture) {
    visual.setBaseTexture(data.m_BaseTexture)
  }
  if (data.m_TextureChoice) {
    visual.setTextureChoice(data.m_TextureChoice)
  }
  if (data.m_Hue) {
    (visual as ItemVisual & { m_Hue: number }).m_Hue = data.m_Hue
  }
  if (data.m_Decal) {
    visual.setDecal(data.m_Decal)
  }
  bloodBodyPartTypeList.forEach((bloodBodyPartType, index) => {
    if (data.blood[index] !== 0) {
      visual.setBlood(bloodBodyPartType, data.blood[index])
    }
  })
  bloodBodyPartTypeList.forEach((bloodBodyPartType, index) => {
    if (data.dirt[index] !== 0) {
      visual.setDirt(bloodBodyPartType, data.dirt[index])
    }
  })
  bloodBodyPartTypeList.forEach((bloodBodyPartType, index) => {
    if (data.holes[index] !== 0) {
      visual.setHole(bloodBodyPartType)
    }
  })
  bloodBodyPartTypeList.forEach((bloodBodyPartType, index) => {
    if (data.basicPatches[index] !== 0) {
      visual.setBasicPatch(bloodBodyPartType)
    }
  })
  bloodBodyPartTypeList.forEach((bloodBodyPartType, index) => {
    if (data.denimPatches[index] !== 0) {
      visual.setDenimPatch(bloodBodyPartType)
    }
  })
  bloodBodyPartTypeList.forEach((bloodBodyPartType, index) => {
    if (data.leatherPatches[index] !== 0) {
      visual.setLeatherPatch(bloodBodyPartType)
    }
  })
}

export const baseDataToItem = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: BaseItemData,
): DataToItemResult<InventoryItem> => {
  const item = InventoryItemFactory.CreateItem(data.fullType, 1, false)
  item.setID(data.id)
  if (data.isDrainable && data.usedDelta) {
    const drainableComboItem = item as DrainableComboItem
    drainableComboItem.setUsedDelta(data.usedDelta)
  }
  if (data.condition) {
    item.setCondition(data.condition, false)
  }
  if (data.visual) {
    const itemVisual = item.getVisual()
    if (itemVisual) {
      assignItemVisualData(itemVisual, data.visual)
    }
  }
  if (data.isCustomColor && data.color) {
    item.setColor(
      new Color(data.color.r, data.color.g, data.color.b, data.color.a),
    )
  }
  if (data.itemCapacity) {
    item.setItemCapacity(data.itemCapacity)
  }
  if (data.table) {
    item.copyModData(data.table)
  }
  if (data.isActivated) {
    item.setActivated(data.isActivated)
  }
  if (data.haveBeenRepaired) {
    item.setHaveBeenRepaired(data.haveBeenRepaired)
  }
  if (data.name) {
    item.setName(data.name)
  }
  if (data.extraItems) {
    data.extraItems.forEach((extraItem) => {
      item.addExtraItem(extraItem)
    })
  }
  if (data.isCustomName) {
    item.setCustomName(data.isCustomName)
  }
  if (data.isCustomWeight && data.actualWeight) {
    item.setCustomWeight(data.isCustomWeight)
    item.setActualWeight(data.actualWeight)
  }
  if (data.keyId) {
    item.setKeyId(data.keyId)
  }
  if (data.isTaintedWater) {
    item.setTaintedWater(data.isTaintedWater)
  }
  if (data.remoteControlID && data.remoteRange) {
    item.setRemoteControlID(data.remoteControlID)
    item.setRemoteRange(data.remoteRange)
  }
  if (data.colorRed || data.colorGreen || data.colorBlue) {
    data.colorRed && item.setColorRed(data.colorRed)
    data.colorGreen && item.setColorGreen(data.colorGreen)
    data.colorBlue && item.setColorBlue(data.colorBlue)
    item.setColor(new Color(data.colorRed, data.colorGreen, data.colorBlue))
  }
  if (data.worker) {
    item.setWorker(data.worker)
  }
  if (data.wetCooldown) {
    item.setWetCooldown(data.wetCooldown)
  }
  if (data.isFavorite) {
    item.setFavorite(data.isFavorite)
  }
  if (data.isInfected) {
    item.setInfected(data.isInfected)
  }
  if (data.currentAmmoCount) {
    item.setCurrentAmmoCount(data.currentAmmoCount)
  }
  if (data.attachedSlot) {
    item.setAttachedSlot(data.attachedSlot)
  }
  if (data.attachedSlotType) {
    item.setAttachedSlotType(data.attachedSlotType)
  }
  if (data.attachedToModel) {
    item.setAttachedToModel(data.attachedToModel)
  }
  if (data.maxCapacity) {
    item.setMaxCapacity(data.maxCapacity)
  }
  // // TODO: ??? 可能有问题
  // if (data.recordedMediaIndex) {
  //   item.setRecordedMediaIndex(data.recordedMediaIndex)
  // }
  if (data.isInitialised) {
    item.setInitialised(data.isInitialised)
  }
  return {
    item,
  }
}
