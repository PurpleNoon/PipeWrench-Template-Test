import { getWorld, type java, type Texture } from '@asledgehammer/pipewrench'
import { type Task } from './@sakuratears/pz-lib/longTaskScheduling'
import { divide, getTileInfoByName } from './@sakuratears/pz-lib'

export { divide, nextTick, nextRenderTick } from './@sakuratears/pz-lib'

enum Stage {
  tileGroupNamesIterating = 'tileGroupNamesIterating',
  tileGroupIterating = 'tileGroupIterating',
  tileGroupIteratingCheck = 'tileGroupIteratingCheck',
}

export interface TileItem {
  name: string
  item: {
    groupName: string
    name: string
    texture: Texture
    displayName: string
    IsMoveAble: boolean
    CanBreak: boolean
    PickUpWeight: string
    Capacity: string
  }
  tooltip: string
}

export interface TaskFinishData {
  allTiles: TileItem[]
  allTileGroupMap: Record<string, TileItem[]>
}

export const createCollectTexturesTask = (
  cb: (data: {
    allTiles: TileItem[]
    allTileGroupMap: Record<string, TileItem[]>
  }) => void,
) => {
  const data = {
    allTiles: [] as TileItem[],
    allTileGroupMap: {} as Record<string, TileItem[]>,

    stage: Stage.tileGroupNamesIterating as Stage,
    tileGroupNames: void 0 as unknown as java.util.ArrayList<string>,
    tileGroupNamesTotal: 0,
    tileGroupNamesIndex: 0,

    tileGroup: void 0 as unknown as java.util.ArrayList<string>,
    tileGroupTotal: 0,
    tileGroupIndex: 0,
  }
  const task: Task<typeof data> = {
    name: 'collectTexturesTask',
    finishInRenderTick: true,
    data,
    start(data) {
      data.tileGroupNames = getWorld().getAllTilesName()
      data.tileGroupNamesTotal = data.tileGroupNames.size()
      data.tileGroupNamesIndex = 0
    },
    step(data) {
      if (data.stage === Stage.tileGroupNamesIterating) {
        const groupName = data.tileGroupNames.get(
          data.tileGroupNamesIndex,
        ) as string
        data.tileGroup = getWorld().getAllTiles(
          groupName,
        ) as java.util.ArrayList<string>
        data.allTileGroupMap[groupName] = []
        data.tileGroupTotal = data.tileGroup.size()
        data.tileGroupIndex = 0
        data.stage = Stage.tileGroupIterating
        return false
      }

      if (data.stage === Stage.tileGroupIterating) {
        const tileName = data.tileGroup.get(data.tileGroupIndex)
        const groupName = data.tileGroupNames.get(
          data.tileGroupNamesIndex,
        ) as string
        const tile = {
          ...getTileInfoByName(tileName),
          groupName,
        }
        if (tile.IsMoveAble && tile.texture && !tile.CanBreak) {
          let tooltip = tile.displayName
          if (tile.CanBreak) {
            tooltip += `\nCanBreak: ${String(tile.CanBreak)}`
          }
          if (tile.PickUpWeight && tile.PickUpWeight !== '') {
            tooltip += `\nWeight: ${String(tile.PickUpWeight)}`
          }
          if (tile.Capacity && tile.Capacity !== '') {
            tooltip += `\nCapacity: ${String(tile.Capacity)}`
          }
          const it = {
            name: tile.name,
            item: tile,
            tooltip,
          }
          data.allTiles.push(it)
          data.allTileGroupMap[groupName].push(it)
        }
        data.tileGroupIndex++
        if (data.tileGroupIndex >= data.tileGroupTotal) {
          data.stage = Stage.tileGroupIteratingCheck
          // 不 return，接着执行
        }
      }

      if (data.stage === Stage.tileGroupIteratingCheck) {
        data.tileGroupNamesIndex++
        if (data.tileGroupNamesIndex >= data.tileGroupNamesTotal) {
          // 删除没有有效贴图的分组
          Object.keys(data.allTileGroupMap).forEach((groupName) => {
            if (data.allTileGroupMap[groupName].length === 0) {
              delete data.allTileGroupMap[groupName]
            }
          })
          // task 执行完成
          return true
        }
      }

      return false
    },
    progress({
      tileGroupNamesIndex,
      tileGroupNamesTotal,
      tileGroupIndex,
      tileGroupTotal,
    }) {
      // 使用 divide 避免除 0 导致出问题
      const baseProgress = divide(tileGroupNamesIndex, tileGroupNamesTotal)
      const innerProgress = divide(tileGroupIndex, tileGroupTotal)
      return baseProgress + innerProgress * divide(1, tileGroupNamesTotal)
    },
    finish(data) {
      cb({
        allTiles: data.allTiles,
        allTileGroupMap: data.allTileGroupMap,
      })
    },
    // error(err, data) {}
  }
  return task
}

// 原执行逻辑（在 ui 上执行的）

// function Sakura_DMFurnitureGenerateUI.collectValidTextures()
//     if #Sakura_DMFurnitureGenerateUI.allTiles > 0 then
//         return
//     end

//     local allTiles = {}
//     local allTileGroupMap = {}

//     local tileGroupNames = getWorld():getAllTilesName()
//     for i = 0, tileGroupNames:size() - 1, 1 do
//         local groupName = tileGroupNames:get(i)
//         local tileGroup = getWorld():getAllTiles(tileGroupNames:get(i))
//         allTileGroupMap[groupName] = {}
//         for i = 0, tileGroup:size() - 1, 1 do
//             local tileName = tileGroup:get(i)
//             local tile = SakuraBaseLib.getTileInfoByName(tileName)
//             tile.groupName = groupName

//             if tile.IsMoveAble and tile.texture and not tile.CanBreak then
//                 local tooltip = tile.displayName
//                 -- 多语言
//                 if tile.CanBreak then
//                     tooltip = tooltip .. '\n' .. 'CanBreak: ' .. tostring(tile.CanBreak)
//                 end
//                 if tile.PickUpWeight and tile.PickUpWeight ~= '' then
//                     tooltip = tooltip .. '\n' .. 'Weight: ' .. tostring(tile.PickUpWeight)
//                 end
//                 if tile.Capacity and tile.Capacity ~= '' then
//                     tooltip = tooltip .. '\n' .. 'Capacity: ' .. tostring(tile.Capacity)
//                 end
//                 local it = {
//                     name = tile.name,
//                     item = tile,
//                     tooltip = tooltip,
//                 }
//                 table.insert(allTiles, it)
//                 table.insert(allTileGroupMap[groupName], it)
//             end
//         end
//     end

//     for key, value in pairs(allTileGroupMap) do
//         if #allTileGroupMap[key] == 0 then
//             allTileGroupMap[key] = nil
//         end
//     end

//     Sakura_DMFurnitureGenerateUI.allTiles = allTiles
//     Sakura_DMFurnitureGenerateUI.allTileGroupMap = allTileGroupMap
// end

// Sakura_DMFurnitureGenerateUI.allTiles = {}
// Sakura_DMFurnitureGenerateUI.allTileGroupMap = {}
