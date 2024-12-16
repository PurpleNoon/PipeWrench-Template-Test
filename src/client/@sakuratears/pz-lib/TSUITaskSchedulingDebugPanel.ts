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
import type {
  LongTaskSchedulingManager,
  TaskWrapper,
} from '../../../shared/@sakuratears/pz-lib/longTaskScheduling'
import {
  createCollectTexturesTask,
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

function screenCenterOf(w: number, h: number) {
  const screenWidth = getCore().getScreenWidth()
  const screenHeight = getCore().getScreenHeight()
  // return [(screenWidth - w) / 2, (screenHeight - h) / 2]
  return $multi((screenWidth - w) / 2, (screenHeight - h) / 2)
}

export class TSUITaskSchedulingDebugPanel extends ISPanel {
  static instance?: TSUITaskSchedulingDebugPanel

  static mount() {
    if (TSUITaskSchedulingDebugPanel.instance) {
      return
    }
    const debugPanelWidth = 1000
    const debugPanelHeight = 750
    const [debugPanelX, debugPanelY] = screenCenterOf(
      debugPanelWidth,
      debugPanelHeight,
    )
    const debugPanel = new TSUITaskSchedulingDebugPanel(
      debugPanelX,
      debugPanelY,
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
  currentHeight: number = 0
  labelRgba: [number, number, number, number] = [1, 1, 1, 1]

  insertTaskBtn?: ISButton & UIKey
  closeBtn?: ISButton & UIKey
  taskCountLabel?: ISLabel
  currentTaskNameLabel?: ISLabel
  currentTaskStageLabel?: ISLabel
  currentTaskProgressLabel?: ISLabel
  currentTaskDurationLabel?: ISLabel
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
      a: 0,
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
    this.currentHeight = 0
  }

  addLineSimple(comp: ISUIElement) {
    // this.uis.push(comp)
    this.currentHeight += comp.getHeight()
  }

  createLabelSimple(
    name: string,
    rgba: [number, number, number, number] = this.labelRgba,
    bLeft: boolean = true,
  ) {
    return new ISLabel(
      0,
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

    const taskCountLabel = this.createLabelSimple(`task count: 0`)
    taskCountLabel.instantiate()
    this.addLineSimple(taskCountLabel)
    this.taskCountLabel = taskCountLabel

    const insertTaskBtn = this.createInsertTaskBtn()
    insertTaskBtn.instantiate()
    this.addLineSimple(insertTaskBtn)
    this.insertTaskBtn = insertTaskBtn

    // 当前任务

    // name
    const currentTaskNameLabel = this.createLabelSimple(`name: 0`)
    currentTaskNameLabel.instantiate()
    this.addLineSimple(currentTaskNameLabel)
    this.currentTaskNameLabel = currentTaskNameLabel

    // 阶段
    const currentTaskStageLabel = this.createLabelSimple(`stage: 0`)
    currentTaskStageLabel.instantiate()
    this.addLineSimple(currentTaskStageLabel)
    this.currentTaskStageLabel = currentTaskStageLabel

    // 进度
    const currentTaskProgressLabel = this.createLabelSimple(`progress: 0`)
    currentTaskProgressLabel.instantiate()
    this.addLineSimple(currentTaskProgressLabel)
    this.currentTaskProgressLabel = currentTaskProgressLabel

    // 已持续时间
    const currentTaskDurationLabel = this.createLabelSimple(`duration: 0`)
    currentTaskDurationLabel.instantiate()
    this.addLineSimple(currentTaskDurationLabel)
    this.currentTaskDurationLabel = currentTaskDurationLabel

    // 期望 tps
    const currentTaskExceptTpsLabel = this.createLabelSimple(`exceptTps: 0`)
    currentTaskExceptTpsLabel.instantiate()
    this.addLineSimple(currentTaskExceptTpsLabel)
    this.currentTaskExceptTpsLabel = currentTaskExceptTpsLabel

    // 优先级
    const currentTaskPriorityLabel = this.createLabelSimple(`priority: 0`)
    currentTaskPriorityLabel.instantiate()
    this.addLineSimple(currentTaskPriorityLabel)
    this.currentTaskPriorityLabel = currentTaskPriorityLabel

    // 其他

    // 关闭按钮
    const closeBtn = this.createCloseBtn()
    closeBtn.instantiate()
    this.addLineSimple(closeBtn)
    this.closeBtn = closeBtn
  }

  getStage(taskWrap?: TaskWrapper) {
    if (!taskWrap) {
      return 'Not Running'
    }
    if (taskWrap.finished) {
      return 'Finished'
    }
    if (taskWrap.executed) {
      return 'Executed'
    }
    if (taskWrap.started) {
      return 'Started'
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

  update() {
    const taskQueue = this.taskManager.getTaskQueue()
    this.taskCountLabel?.setName(`task count: ${taskQueue.length}`)

    const taskWrap = this.taskManager.getCurrentRunningTaskWrapper()
    const task = taskWrap?.task
    this.currentTaskNameLabel?.setName(`name: ${task?.name || '-'}`)
    this.currentTaskStageLabel?.setName(`stage: ${this.getStage(taskWrap)}`)
    this.currentTaskProgressLabel?.setName(
      `progress: ${taskWrap?.progress || '-'}`,
    )
    this.currentTaskDurationLabel?.setName(
      `duration: ${this.getDuration(taskWrap)}`,
    )
    this.currentTaskExceptTpsLabel?.setName(
      `exceptTps: ${taskWrap?.exceptTps || '-'}`,
    )
    this.currentTaskPriorityLabel?.setName(
      `priority: ${taskWrap?.priority || '-'}`,
    )
  }

  createCloseBtn() {
    const closeBtn: ISButton & UIKey = new ISButton(
      3,
      3,
      40,
      24,
      'close',
      this,
      this.onClose,
      void 0,
      void 0,
    )
    closeBtn.internal = 'close'
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

  onClose() {
    TSUITaskSchedulingDebugPanel.close()
  }

  createInsertTaskBtn() {
    const closeBtn: ISButton & UIKey = new ISButton(
      3,
      3,
      40,
      24,
      'insert task',
      this,
      this.onInsetTask,
      void 0,
      void 0,
    )
    closeBtn.internal = 'insertTask'
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
