import {
  getTimeInMillis,
  isClient,
  isGamePaused,
  isServer
} from '@asledgehammer/pipewrench'
import { onGameStart, onTickEvenPaused } from '@asledgehammer/pipewrench-events'
import { nextRenderTick, nextTick } from '.'

/**
 * 获取当前运行在哪端？
 * @returns sp 单人，client 多人客户端，server 多人服务端
 */
const getRunMode = () => {
  if (isClient()) {
    return 'client'
  }
  if (isServer()) {
    return 'server'
  }
  return 'sp'
}

export type TaskPriority = 1 | 2 | 3 | 4 | 5
export type TaskExceptTpsLevel = 1 | 2 | 2 | 4 | 5 | 6

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Task<T = any> {
  /** 任务标识，重复标识的任务不会插入到任务队列中 */
  name: string
  /**
   * 期望运行时的 tps 级别，默认为 1，即期望运行时 tps 保持在 60 左右
   * client
   *    - 1 => 60tps
   *    - 2 => 45tps
   *    - 3 => 30tps
   *    - 4 => 15tps
   *    - 5 => 10tps
   *    - 6 => 5tps
   * server
   *    - 1 => 20tps
   *    - 2 => 15tps
   *    - 3 => 10tps
   *    - 4 => 5tps
   *    - 5 => 3tps
   *    - 6 => 1tps
   */
  exceptTpsLevel?: TaskExceptTpsLevel
  /** 1-5, 5是最优先，默认值为 3，step 函数执行时间过长时，会根据超出的时间来降低该任务优先级 */
  priority?: TaskPriority
  /** 任务结束时，finish 是否在 renderTick 执行，默认不在 renderTick 中执行 */
  finishInRenderTick?: boolean
  /** 任务执行时存储数据的地方 */
  data: T
  /**
   * 任务第一次执行前会调用 start 函数
   *
   * 尽可能保证该函数执行时间不超过任务最小执行时间(4ms)
   */
  start?: (data: T) => void
  /**
   * 返回值表示任务是否已完成，返回 true 时会中止任务执行并移除任务
   *
   * 尽可能保证该函数执行时间不超过任务最小执行时间(4ms)
   */
  step: (data: T) => boolean
  /**
   * 在该次任务调度之后，执行该函数获取任务进度，返回进度百分比
   *
   * 需要该函数执行时间尽可能的小(不超过 1ms)
   */
  progress: (data: T) => number
  /**
   * 任务完成时会调用 finish 函数
   *
   * 尽可能保证该函数执行时间不超过任务最小执行时间(4ms)
   */
  finish?: (data: T) => void
  /**
   * 任务执行报错时会执行该函数
   *
   * 尽可能保证该函数执行时间不超过任务最小执行时间(4ms)
   * @param err 抛出的错误
   */
  error?: (err: unknown, data: T) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TaskWrapper<T = any> {
  task: Task<T>
  exceptTpsLevel: TaskExceptTpsLevel
  exceptTps: number
  priority: TaskPriority
  progress: number
  started: boolean
  executed: boolean
  finished: boolean
}

const defaultTaskExceptTpsLevel = 1
const defaultTaskPriority = 3

/** 客户端期望 tps 级别与期望 tps 对照表 */
const clientExceptTpsMap = {
  1: 60,
  2: 45,
  3: 30,
  4: 15,
  5: 10,
  6: 5
}

/** 服务端期望 tps 级别与期望 tps 对照表 */
const serverExceptTpsMap = {
  1: 20,
  2: 15,
  3: 10,
  4: 5,
  5: 3,
  6: 1
}

/** 根据期望 tps 级别获取期望 tps */
const getExceptTps = (task: Task) => {
  // 客户端和单人
  if (getRunMode() !== 'server') {
    const exceptTps =
      clientExceptTpsMap[task.exceptTpsLevel || defaultTaskExceptTpsLevel]
    if (!exceptTps) {
      throw new Error(`Task has Wrong exceptTpsLevel: ${task.exceptTpsLevel}`)
    }
    return exceptTps
  }
  const exceptTps =
    serverExceptTpsMap[task.exceptTpsLevel || defaultTaskExceptTpsLevel]
  if (!exceptTps) {
    throw new Error(`Task has Wrong exceptTpsLevel: ${task.exceptTpsLevel}`)
  }
  return exceptTps
}

/** 创建任务在队列中的包装 */
const createTaskWrapper = (task: Task): TaskWrapper => {
  return {
    task,
    exceptTpsLevel: 1,
    exceptTps: 60,
    priority: 1,
    progress: 0,
    started: false,
    executed: false,
    finished: false
  }
}

/** 从队列中移除任务 */
const removeTaskWrap = (
  taskQueue: TaskWrapper<unknown>[],
  taskName: string
) => {
  const wrapperIndex = taskQueue.findIndex(
    (wrapper) => wrapper.task.name === taskName
  )
  if (wrapperIndex > -1) {
    taskQueue.splice(wrapperIndex, 1)
  }
}

/** 获取 tps 对照表 */
const getTpsComparisonTable = (minExecTime: number) => {
  const list: [number, number][] = [60, 45, 30, 20, 15, 10, 5, 3, 1].map(
    (exceptTps) => {
      const neededRuntimeTps = 1000 / (1000 / exceptTps - minExecTime)
      return [exceptTps, neededRuntimeTps]
    }
  )
  return list
}

/** 获取优先级最高的任务 */
const getMaxPriorityTaskWrapper = (taskQueue: TaskWrapper<unknown>[]) => {
  return taskQueue.reduce(
    (nowTaskWrapper, taskWrapper) => {
      if (!nowTaskWrapper) {
        return taskWrapper
      }
      return taskWrapper.priority > nowTaskWrapper.priority
        ? taskWrapper
        : nowTaskWrapper
    },
    void 0 as TaskWrapper | undefined
  )!
}

/** 处理任务报错 */
const runWithTaskErrorHappened = (
  error: unknown,
  taskWrapper: TaskWrapper,
  taskQueue: TaskWrapper<unknown>[]
) => {
  const { task } = taskWrapper
  // 移除报错的任务，打断当前 tick 的执行，抛出错误
  removeTaskWrap(taskQueue, task.name)
  if (typeof task.error === 'function') {
    task.error(error, task.data)
  }
  throw error
}

/**
 * 创建任务调度
 * 执行的任务不太关心什么时候完成
 * @returns
 */
export const createLongTaskSchedulingManager = () => {
  /** 当前 tick 执行的时间 */
  let latestTime = 0
  /** 当前 tps */
  let tps = 0
  /** 当前 tick 的任务执行时间 */
  let currentTickRemainingExecTime = 0
  /** 剩余执行时间 */
  let remainingExecTime = 0
  /** 游戏是否暂停 */
  let gamePaused = true
  /** 当前在执行的任务 */
  let currentRunningTaskWrapper: TaskWrapper | undefined = void 0
  const taskQueue: TaskWrapper[] = []

  /** 任务最小执行时间，单位：ms */
  const minExecTime = 4

  /**
   * tps 对照表，在每一项中，
   *
   * 第一个值为期望任务运行时的 tps，
   *
   * 第二个值为达到期望 tps 所需要的实际 tps
   */
  const tpsComparisonTable = getTpsComparisonTable(minExecTime)

  /**
   * 选取合适的用来执行任务的期望 tps
   * 当前 tps 大于期望 tps 时，使用大于当前 tps 且最接近当前 tps 级别的 tps
   * TODO: 问题：
   * 当前的判断方式会导致 tps 一路降低而非稳定在指定的 tps 附近，
   * 需要有补偿机制，需要考虑任务超时降级导致任务切换的情况
   * @param exceptTps 期望的 tps
   * @param tps 当前 tps
   * @returns
   */
  const getFinalExceptTps = (exceptTps: number, tps: number) => {
    const tpsComparison = tpsComparisonTable.find((comparison) => {
      const [, neededRuntimeTps] = comparison
      return tps > neededRuntimeTps
    })
    // 先判断当前 tps 下，能够正常运行任务的期望 tps
    const actualExceptTps = tpsComparison ? tpsComparison[0] : 1
    // 如果正常运行任务的期望 tps 大于任务期望的 tps，则使用任务期望的 tps，以便于更快的运行任务
    return actualExceptTps > exceptTps ? exceptTps : actualExceptTps
  }

  const tickListener = () => {
    // numberTicks: number
    const prevGamePaused = gamePaused
    gamePaused = isGamePaused()
    // 暂停时清空 tps 计时
    if (gamePaused !== prevGamePaused && gamePaused) {
      latestTime = 0
    }
    if (gamePaused) {
      return
    }

    const now = getTimeInMillis()
    // 运行的第一个 tick 不执行任务，因为无法计算 tps
    if (latestTime === 0) {
      latestTime = now
      return
    }
    tps = Math.floor(1000 / (latestTime - now))
    // 任务的执行策略
    // 权重，串行（期望尽可能快的减少任务）
    const runNextTask = () => {
      if (taskQueue.length === 0 || remainingExecTime <= 0) {
        return
      }
      // 获取权重最高的 task
      const currentTaskWrapper = getMaxPriorityTaskWrapper(taskQueue)
      currentRunningTaskWrapper = currentTaskWrapper

      /**
       * 计算剩余的任务执行时间
       * @param taskWrapper
       * @returns {boolean} isUnexpired
       */
      const calcRemainingExecTime = (taskWrapper: TaskWrapper) => {
        remainingExecTime =
          currentTickRemainingExecTime - (getTimeInMillis() - latestTime)
        if (remainingExecTime <= 1) {
          // 计算超时情况，超时情况严重时降低权重(最低权重时无法降低)
          if (remainingExecTime < 0 && taskWrapper.priority > 1) {
            const timeoutLevel = Math.floor(
              Math.abs(remainingExecTime) / minExecTime
            )
            if (timeoutLevel > 0) {
              // 每超一倍的 minExecTime，降低一级优先级
              taskWrapper.priority = Math.max(
                taskWrapper.priority - timeoutLevel,
                1
              ) as TaskPriority
            }
          }
          return false
        }
        return true
      }

      const runTask = (taskWrapper: TaskWrapper) => {
        const task = taskWrapper.task

        // task start stage
        if (!taskWrapper.started) {
          taskWrapper.progress = 0
          taskWrapper.priority = task.priority || defaultTaskPriority
          taskWrapper.exceptTpsLevel =
            task.exceptTpsLevel || defaultTaskExceptTpsLevel
          taskWrapper.exceptTps = getExceptTps(task)
          const finalExceptTps = getFinalExceptTps(taskWrapper.exceptTps, tps)
          // 期望 tps 小于等于 1tps 时，固定执行 100ms
          currentTickRemainingExecTime =
            finalExceptTps > 1 ? 1000 / finalExceptTps - 1000 / tps : 100
          remainingExecTime = currentTickRemainingExecTime

          if (typeof task.start === 'function') {
            try {
              task.start(task.data)
              taskWrapper.started = true
            } catch (error) {
              currentRunningTaskWrapper = void 0
              runWithTaskErrorHappened(error, taskWrapper, taskQueue)
              return
            }
            const isStartUnexpired = calcRemainingExecTime(taskWrapper)
            if (!isStartUnexpired) {
              return
            }
          }
        }

        // task step stage
        if (!taskWrapper.executed) {
          let isFinished = false
          while (!isFinished) {
            try {
              isFinished = task.step(task.data)
              if (!isFinished) {
                taskWrapper.progress = task.progress(task.data) || 0
              } else {
                taskWrapper.progress = 100
                taskWrapper.executed = true
              }
            } catch (error) {
              currentRunningTaskWrapper = void 0
              runWithTaskErrorHappened(error, taskWrapper, taskQueue)
              return
            }
            const isStepUnexpired = calcRemainingExecTime(taskWrapper)
            if (!isStepUnexpired) {
              return
            }
          }
        }

        // task finish stage
        if (typeof task.finish === 'function') {
          try {
            if (task.finishInRenderTick) {
              nextRenderTick(() => {
                task.finish && task.finish(task.data)
                taskWrapper.finished = true
              })
            } else {
              nextTick(() => {
                task.finish && task.finish(task.data)
                taskWrapper.finished = true
              })
            }
            removeTaskWrap(taskQueue, task.name)
            currentRunningTaskWrapper = void 0
          } catch (error) {
            currentRunningTaskWrapper = void 0
            runWithTaskErrorHappened(error, taskWrapper, taskQueue)
            return
          }
          const isEndUnexpired = calcRemainingExecTime(taskWrapper)
          if (!isEndUnexpired) {
            return
          }
        }
        currentRunningTaskWrapper = void 0

        runNextTask()
      }

      runTask(currentTaskWrapper)
    }
    runNextTask()
  }

  const remove = (task: Task | string) => {
    if (typeof task === 'string') {
      removeTaskWrap(taskQueue, task)
      return
    }
    removeTaskWrap(taskQueue, task.name)
  }

  return {
    /** 插入任务，重复标识的任务不会插入到任务队列中 */
    add<T>(task: Task<T>) {
      if (taskQueue.some((taskWrap) => taskWrap.task.name === task.name)) {
        return
      }
      taskQueue.push(createTaskWrapper(task))
    },
    remove,
    start() {
      onTickEvenPaused.addListener(tickListener)
    },
    stop() {
      latestTime = 0
      onTickEvenPaused.removeListener(tickListener)
    },
    /** 获取任务的对外暴露的包装 */
    getPacking(taskName: string) {
      const taskWrap = taskQueue.find(
        (wrapper) => wrapper.task.name === taskName
      )
      if (!taskWrap) {
        return
      }
      return {
        task: taskWrap.task,
        /** 是否在执行当前任务 */
        isRunning() {
          return (
            currentRunningTaskWrapper &&
            currentRunningTaskWrapper.task.name === taskWrap.task.name
          )
        },
        /** 移除任务 */
        remove() {
          remove(taskWrap.task)
        },
        /** 获取任务执行进度 */
        progress() {
          return taskWrap.progress
        }
      }
    }
  }
}



// =================== 分割线 ====================

const task: Task<{
  count: number
}> = {
  name: 'test',
  exceptTpsLevel: 1,
  priority: 3,
  data: {
    count: 0
  },
  start() {
    print('start')
    this.data.count = 0
  },
  step() {
    print('step')
    this.data.count++
    if (this.data.count >= 10) {
      return true
    }
    return false
  },
  progress(): number {
    print('progress')
    return this.data.count / 10
  },
  finish() {
    print('finish')
  }
  // error(err) {},
}

const longTaskSchedulingManager = createLongTaskSchedulingManager()

// 使用
onGameStart.addListener(() => {
  longTaskSchedulingManager.start()
})

longTaskSchedulingManager.add(task)
