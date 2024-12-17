import {
  getCore,
  getPlayer,
  UIManager,
  type IsoPlayer,
} from '@asledgehammer/pipewrench'
import { ISPanel, ISButton } from '@asledgehammer/pipewrench/client'
import {
  everyTenMinutes,
  onGameStart,
  onResetLua,
} from '@asledgehammer/pipewrench-events'
import type { UIKey } from '../../../shared/types'
import { TSUITaskSchedulingDebugPanel } from './TSUITaskSchedulingDebugPanel'

export class TSUITaskSchedulingDebugEntry extends ISPanel {
  static instance?: TSUITaskSchedulingDebugEntry

  static mount() {
    const maxX = getCore().getScreenWidth()
    // const maxY = getCore().getScreenHeight()
    const uiX = maxX - 350
    const uiY = 10
    const ui = new TSUITaskSchedulingDebugEntry(uiX, uiY, 100, 100, getPlayer())
    ui.initialise()
    ui.addToUIManager()
    TSUITaskSchedulingDebugEntry.instance = ui
  }

  character: IsoPlayer
  btnOpen?: ISButton & UIKey
  debugPanel?: TSUITaskSchedulingDebugPanel
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
      a: 0.5,
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
      40,
      24,
      'btn',
      this,
      this.onClick,
      void 0,
      void 0,
    )
    btnOpen.internal = 'test'
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

  onClick(button: ISButton & UIKey) {
    if (button.internal === 'test') {
      TSUITaskSchedulingDebugPanel.mount()
      return
    }
  }

  destroy() {
    UIManager.setShowPausedMessage(true)
    this.setVisible(false)
    this.removeFromUIManager()
  }
}

const CheckDebuggerEntryUI = () => {
  if (TSUITaskSchedulingDebugEntry.instance) {
    return
  }
  TSUITaskSchedulingDebugEntry.mount()
}

// 不确定好使不
const debuggerEntryUIOnResetLua = () => {
  if (!TSUITaskSchedulingDebugEntry.instance) {
    return
  }
  print('freshing DebuggerEntryUI')
  TSUITaskSchedulingDebugEntry.instance.destroy()
  TSUITaskSchedulingDebugEntry.instance = void 0
  TSUITaskSchedulingDebugEntry.mount()
}

onGameStart.addListener(() => {
  everyTenMinutes.addListener(CheckDebuggerEntryUI)
  onResetLua.addListener(debuggerEntryUIOnResetLua)
})
