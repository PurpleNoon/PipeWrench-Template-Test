import {
  getCore,
  getPlayer,
  ISButton,
  ISPanel,
  UIManager,
  type IsoPlayer,
} from '@asledgehammer/pipewrench'
import { everyTenMinutes, onResetLua } from '@asledgehammer/pipewrench-events'
import type { UIKey } from '../../../shared/types'

export class TaskSchedulingDebugEntry extends ISPanel {
  static instance: TaskSchedulingDebugEntry | undefined

  static mount() {
    const maxX = getCore().getScreenWidth()
    // const maxY = getCore().getScreenHeight()
    const uiX = maxX - 350
    const uiY = 10
    const ui = new TaskSchedulingDebugEntry(uiX, uiY, 100, 100, getPlayer())
    ui.initialise()
    ui.addToUIManager()
    TaskSchedulingDebugEntry.instance = ui
  }

  character: IsoPlayer
  btnOpen?: ISButton & UIKey
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    player: IsoPlayer,
  ) {
    super(x, y, width, height)
    this.character = player
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
  }

  initialise() {
    super.initialise()
    this.create()
  }

  create() {
    const btnOpen = this.createBtnOpen()
    this.btnOpen = btnOpen
    this.addChild(btnOpen)
  }

  createBtnOpen() {
    const btnOpen: ISButton & UIKey = new ISButton(
      3,
      3,
      this.width - 6,
      this.height - 6,
      void 0,
      this,
      this.onClick,
      void 0,
      void 0,
    )
    btnOpen.internal = ''
    btnOpen.anchorRight = true
    btnOpen.anchorBottom = true
    btnOpen.anchorTop = false
    btnOpen.anchorLeft = false
    btnOpen.initialise()
    btnOpen.instantiate()
    btnOpen.borderColor = {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }
    return btnOpen
  }

  onClick() // button: ISButton & UIKey
  {
    // button.internal
  }

  destroy() {
    UIManager.setShowPausedMessage(true)
    this.setVisible(false)
    this.removeFromUIManager()
  }
}

const CheckDebuggerEntryUI = () => {
  if (TaskSchedulingDebugEntry.instance) {
    return
  }
  TaskSchedulingDebugEntry.mount()
}

// 不确定好使不
const debuggerEntryUIOnResetLua = () => {
  if (!TaskSchedulingDebugEntry.instance) {
    return
  }
  TaskSchedulingDebugEntry.instance.destroy()
  TaskSchedulingDebugEntry.instance = void 0
  TaskSchedulingDebugEntry.mount()
}

everyTenMinutes.addListener(CheckDebuggerEntryUI)
onResetLua.addListener(debuggerEntryUIOnResetLua)
