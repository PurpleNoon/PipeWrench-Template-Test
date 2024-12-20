import {
  getCore,
  getPlayer,
  getTextManager,
  getTimeInMillis,
  type IsoPlayer,
  UIFont,
  UIManager,
} from '@asledgehammer/pipewrench'
import {
  ISPanel,
  ISButton,
  ISLabel,
  type ISUIElement,
} from '@asledgehammer/pipewrench/client'
import type { UIKey } from '../../../shared/types'
import {
  // exampleTask,
  longTaskSchedulingManager,
  type LongTaskSchedulingManager,
  type TaskWrapper,
} from '../../../shared/@sakuratears/pz-lib/longTaskScheduling'
import {
  createCollectTexturesTask,
  // createCollectTexturesTask,
  type TaskFinishData,
} from '../../../shared/collectTexturesTask'

// 调度数据有
// 当前任务数量

// 当前任务信息
// name
// 阶段
// 进度
// 已持续时间
// 优先级
// 期望 tps
// 任务数据？

// 已完成任务信息
// name
// 状态：成功/失败
// 已持续时间
// 优先级
// 期望 tps

// function screenCenterOf(w: number, h: number) {
//   const screenWidth = getCore().getScreenWidth()
//   const screenHeight = getCore().getScreenHeight()
//   // return [(screenWidth - w) / 2, (screenHeight - h) / 2]
//   return $multi((screenWidth - w) / 2, (screenHeight - h) / 2)
// }

export class TSUITaskSchedulingDebugPanel extends ISPanel {
  static instance?: TSUITaskSchedulingDebugPanel

  static mount() {
    // if (TSUITaskSchedulingDebugPanel.instance) {
    //   return
    // }
    const screenWidth = getCore().getScreenWidth()
    const screenHeight = getCore().getScreenHeight()
    const debugPanelWidth = 300
    const debugPanelHeight = 500
    // const [debugPanelX, debugPanelY] = screenCenterOf(
    //   debugPanelWidth,
    //   debugPanelHeight,
    // )
    const debugPanel = new TSUITaskSchedulingDebugPanel(
      (screenWidth - debugPanelWidth) / 2,
      (screenHeight - debugPanelHeight) / 2,
      debugPanelWidth,
      debugPanelHeight,
      getPlayer(),
      longTaskSchedulingManager,
    )
    debugPanel.init()
    TSUITaskSchedulingDebugPanel.instance = debugPanel
  }

  static close() {
    if (!TSUITaskSchedulingDebugPanel.instance) {
      return
    }
    TSUITaskSchedulingDebugPanel.instance.destroy()
  }

  character: IsoPlayer
  taskManager: LongTaskSchedulingManager

  // uis: ISUIElement[] = []
  currentHeight: number = 6
  currentLeft: number = 6
  labelRgba: [number, number, number, number] = [1, 1, 1, 1]

  insertTaskBtn?: ISButton & UIKey
  closeBtn?: ISButton & UIKey
  taskCountLabel?: ISLabel
  taskTpsLabel?: ISLabel
  taskLatestTimeLabel?: ISLabel
  taskGamePausedLabel?: ISLabel

  currentTaskNameLabel?: ISLabel
  currentTaskStageLabel?: ISLabel
  currentTaskProgressLabel?: ISLabel
  currentTaskDurationLabel?: ISLabel
  currentTaskFinishOnLabel?: ISLabel
  currentTaskActualExecTimeLabel?: ISLabel
  currentTaskExceptTpsLabel?: ISLabel
  currentTaskPriorityLabel?: ISLabel
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    player: IsoPlayer,
    taskManager: LongTaskSchedulingManager,
  ) {
    super(x, y, width, height)
    this.anchorRight = true
    this.anchorBottom = true
    this.anchorTop = true
    this.anchorLeft = true
    this.moveWithMouse = true
    this.backgroundColor = {
      r: 0,
      g: 0,
      b: 0,
      a: 0.5,
    }
    this.borderColor = {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }
    this.font = UIFont.Small

    this.character = player
    this.taskManager = taskManager
  }

  get fontHeight() {
    return getTextManager().getFontHeight(this.font)
  }

  initialise() {
    super.initialise()
    this.create()
  }

  resetLineSimple() {
    // this.uis = []
    this.currentHeight = 6
  }

  addLineSimple(comp: ISUIElement) {
    // this.uis.push(comp)
    comp.initialise()
    comp.instantiate()
    this.addChild(comp)
    this.currentHeight += comp.getHeight() + 4
  }

  createLabelSimple(
    name: string,
    rgba: [number, number, number, number] = this.labelRgba,
    bLeft: boolean = true,
  ) {
    return new ISLabel(
      this.currentLeft,
      this.currentHeight,
      this.fontHeight,
      name,
      ...rgba,
      UIFont.Small,
      bLeft,
    )
  }

  create() {
    this.resetLineSimple()

    // 信息总览

    // 任务数
    const taskCountLabel = this.createLabelSimple(`task count: 0`)
    this.addLineSimple(taskCountLabel)
    this.taskCountLabel = taskCountLabel

    // 当前 tps
    const taskTpsLabel = this.createLabelSimple(`tps: 0`)
    this.addLineSimple(taskTpsLabel)
    this.taskTpsLabel = taskTpsLabel

    // 游戏是否暂停
    const taskGamePausedLabel = this.createLabelSimple(`gamePaused: false`)
    this.addLineSimple(taskGamePausedLabel)
    this.taskGamePausedLabel = taskGamePausedLabel

    const insertTaskBtn = this.createBtn(
      'insert task',
      this.onInsetTask,
      'insertTask',
    )
    this.addLineSimple(insertTaskBtn)
    this.insertTaskBtn = insertTaskBtn

    // 当前任务

    // name
    const currentTaskNameLabel = this.createLabelSimple(`name: 0`)
    this.addLineSimple(currentTaskNameLabel)
    this.currentTaskNameLabel = currentTaskNameLabel

    // 阶段
    const currentTaskStageLabel = this.createLabelSimple(`stage: 0`)
    this.addLineSimple(currentTaskStageLabel)
    this.currentTaskStageLabel = currentTaskStageLabel

    // 进度
    const currentTaskProgressLabel = this.createLabelSimple(`progress: 0%`)
    this.addLineSimple(currentTaskProgressLabel)
    this.currentTaskProgressLabel = currentTaskProgressLabel

    // 已持续时间
    const currentTaskDurationLabel = this.createLabelSimple(`duration: 0s`)
    this.addLineSimple(currentTaskDurationLabel)
    this.currentTaskDurationLabel = currentTaskDurationLabel

    // 预计完成时间
    const currentTaskFinishOnLabel = this.createLabelSimple(
      `expected to be completed on: -`,
    )
    this.addLineSimple(currentTaskFinishOnLabel)
    this.currentTaskFinishOnLabel = currentTaskFinishOnLabel

    // 实际执行时间
    const currentTaskActualExecTimeLabel =
      this.createLabelSimple(`duration: 0s`)
    this.addLineSimple(currentTaskActualExecTimeLabel)
    this.currentTaskActualExecTimeLabel = currentTaskActualExecTimeLabel

    // 期望 tps
    const currentTaskExceptTpsLabel = this.createLabelSimple(`exceptTps: 0`)
    this.addLineSimple(currentTaskExceptTpsLabel)
    this.currentTaskExceptTpsLabel = currentTaskExceptTpsLabel

    // 优先级
    const currentTaskPriorityLabel = this.createLabelSimple(`priority: 0`)
    this.addLineSimple(currentTaskPriorityLabel)
    this.currentTaskPriorityLabel = currentTaskPriorityLabel

    // 其他

    // 关闭按钮
    const closeBtn = this.createBtn('close', this.onClose, 'close')
    this.addLineSimple(closeBtn)
    this.closeBtn = closeBtn
  }

  getStage(taskWrap?: TaskWrapper) {
    if (!taskWrap) {
      return 'No taskWrap'
    }
    if (taskWrap.finished) {
      return 'Finished'
    }
    if (taskWrap.executed) {
      return 'Executed'
    }
    if (taskWrap.started) {
      return 'Running'
    }
    return 'Not Running'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDuration(taskWrap?: TaskWrapper<any>) {
    if (!taskWrap || taskWrap.startTime <= 0) {
      return 0
    }
    if (taskWrap.endTime <= 0) {
      return getTimeInMillis() - taskWrap.startTime
    }
    return taskWrap.endTime - taskWrap.startTime
  }

  getCurrentTaskFinishOn(
    currentTaskDuration: number,
    currentTaskProgress: number,
  ) {
    if (currentTaskDuration === 0 || currentTaskProgress === 0) {
      return 0
    }
    return (currentTaskDuration / currentTaskProgress) * 100 - currentTaskDuration
  }

  update() {
    const taskQueue = this.taskManager.getTaskQueue()
    const managerContext = this.taskManager.getContext()
    this.taskCountLabel?.setName(`task count: ${taskQueue.length}`)
    this.taskTpsLabel?.setName(`tps ${managerContext.tps}`)
    this.taskGamePausedLabel?.setName(
      `gamePaused: ${managerContext.gamePaused}`,
    )

    const taskWrap = this.taskManager.getCurrentRunningTaskWrapper()
    const task = taskWrap?.task
    this.currentTaskNameLabel?.setName(`name: ${task?.name || '-'}`)
    this.currentTaskStageLabel?.setName(`stage: ${this.getStage(taskWrap)}`)
    const currentTaskProgress = (taskWrap?.progress || 0) * 100
    this.currentTaskProgressLabel?.setName(
      `progress: ${currentTaskProgress.toFixed(2) || '-'}%`,
    )
    const currentTaskDuration = this.getDuration(taskWrap) / 1000
    this.currentTaskDurationLabel?.setName(
      `duration: ${currentTaskDuration.toFixed(2)}s`,
    )
    const currentTaskFinishOn = this.getCurrentTaskFinishOn(
      currentTaskDuration,
      currentTaskProgress,
    )
    this.currentTaskFinishOnLabel?.setName(
      `expected to be completed on: ${currentTaskFinishOn === 0 ? '-' : `${currentTaskFinishOn}s`}`,
    )
    this.currentTaskActualExecTimeLabel?.setName(
      `exceptTps: ${taskWrap?.actualExecTime ? `${(taskWrap?.actualExecTime / 1000).toFixed(2)}s` : '-'}`,
    )
    this.currentTaskExceptTpsLabel?.setName(
      `exceptTps: ${taskWrap?.exceptTps || '-'}`,
    )
    this.currentTaskPriorityLabel?.setName(
      `priority: ${taskWrap?.priority || '-'}`,
    )
  }

  onClose() {
    TSUITaskSchedulingDebugPanel.close()
  }

  createBtn(title: string, onClick: () => void, internal = title) {
    const closeBtn: ISButton & UIKey = new ISButton(
      this.currentLeft,
      this.currentHeight,
      40,
      24,
      title,
      this,
      onClick,
      void 0,
      void 0,
    )
    closeBtn.internal = internal
    closeBtn.anchorRight = true
    closeBtn.anchorBottom = true
    closeBtn.anchorTop = false
    closeBtn.anchorLeft = false
    closeBtn.initialise()
    closeBtn.instantiate()
    closeBtn.borderColor = {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }
    return closeBtn
  }

  onCollectFinish(data: TaskFinishData) {
    print(`collected tiles count: ${data.allTiles.length}`)
  }

  onInsetTask() {
    const collectTexturesTask = createCollectTexturesTask(this.onCollectFinish)
    longTaskSchedulingManager.add(collectTexturesTask)
    // ==========
    // longTaskSchedulingManager.add(exampleTask)
  }

  init() {
    this.initialise()
    this.setVisible(true)
    this.addToUIManager()
  }

  destroy() {
    UIManager.setShowPausedMessage(true)
    this.setVisible(false)
    this.removeFromUIManager()
  }
}
