import { getTimeInMillis, isGamePaused } from '@asledgehammer/pipewrench'
import {
  onGameStart,
  onResetLua,
  onTickEvenPaused,
} from '@asledgehammer/pipewrench-events'
import { getRunMode, nextRenderTick, nextTick, omit } from '.'

export type TaskPriority = 1 | 2 | 3 | 4 | 5
export type TaskExceptTpsLevel = 1 | 2 | 2 | 4 | 5 | 6

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Task<T = any> {
  /** 任务标识，重复标识的任务不会插入到任务队列中 */
  name: string
  /**
   * 期望运行时的 tps 级别，默认为 1，即期望运行时 tps 保持在 60 左右
   *
   * client
   *
   *    - 1 => 60tps
   *    - 2 => 45tps
   *    - 3 => 30tps
   *    - 4 => 15tps
   *    - 5 => 10tps
   *    - 6 => 5tps
   *
   * server
   *
   *    - 1 => 20tps
   *    - 2 => 15tps
   *    - 3 => 10tps
   *    - 4 => 5tps
   *    - 5 => 3tps
   *    - 6 => 1tps
   */
  exceptTpsLevel?: TaskExceptTpsLevel
  /** 1-5, 5是最优先，默认值为 3，函数执行时间过长时，会根据超出的时间来降低该任务优先级 */
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
   * 尽可能保证该函数单次执行时间不超过任务最小执行时间(4ms)
   *
   * 执行时间超出的越多，tps 波动越大
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
   * 尽可能保证该函数执行时间尽可能的小(不超过 1ms)
   * @param err 抛出的错误
   */
  error?: (err: unknown, data: T) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TaskWrapper<T = any> {
  task: Task<T>
  exceptTpsLevel: TaskExceptTpsLevel
  exceptTps: number
  priority: TaskPriority
  /** 任务开始执行的时间 */
  startTime: number
  /** 任务执行完成的时间 */
  endTime: number
  /** 实际执行时间(ms) */
  actualExecTime: number
  progress: number
  started: boolean
  executed: boolean
  finished: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrevTask<T = any> = Omit<
  Task<T>,
  'data' | 'start' | 'step' | 'progress' | 'finish' | 'error'
>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PrevTaskWrapper<T = any> extends Omit<TaskWrapper<T>, 'task'> {
  prevTask: PrevTask<T>
}

export interface LongTaskSchedulingContext {
  /** 前一个任务 tick 结束的时间 */
  prevTaskTickEndTime: number
  /** 前一个任务 tick 开始的时间 */
  prevTaskTickStartTime: number
  /** 当前任务 tick 开始的时间 */
  currentTaskTickStartTime: number
  /** 当前 tps */
  tps: number
  /** 当前 tick 的任务执行时间 */
  currentTickRemainingExecTime: number
  /** 剩余执行时间 */
  remainingExecTime: number
  /** 游戏是否暂停 */
  gamePaused: boolean
  /** 当前在执行的任务 */
  currentRunningTaskWrapper: TaskWrapper | undefined
  /** 上次执行的任务 */
  prevTaskWrapper?: PrevTaskWrapper
  /** 任务队列 */
  taskQueue: TaskWrapper[]
  /** 任务最小执行时间，单位：ms */
  minExecTime: number
  /** tps 补偿时间 */
  tpsCompensationTime: number
  /** 执行情况的队列，循环队列 */
  executionStatusQueue: ExecutionStatusQueue
}

export interface LongTaskSchedulingManager {
  add<T>(task: Task<T>): void
  remove(task: Task | string): void
  start(): void
  stop(): void
  stop(): void
  getPacking(taskName: string):
    | {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        task: Task<any>
        isRunning(): boolean | undefined
        remove(): void
        progress(): number
      }
    | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTaskQueue(): TaskWrapper<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCurrentRunningTaskWrapper(): TaskWrapper<any> | undefined
  getContext(): LongTaskSchedulingContext
}

const defaultTaskExceptTpsLevel = 1
const defaultTaskPriority = 3

/** 客户端期望 tps 级别与期望 tps 对照表 */
const clientExceptTpsMap = {
  1: 60 as const,
  2: 45 as const,
  3: 30 as const,
  4: 15 as const,
  5: 10 as const,
  6: 5 as const,
}

/** 服务端期望 tps 级别与期望 tps 对照表 */
const serverExceptTpsMap = {
  1: 20 as const,
  2: 15 as const,
  3: 10 as const,
  4: 5 as const,
  5: 3 as const,
  6: 1 as const,
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
    startTime: -1,
    endTime: -1,
    actualExecTime: 0,
    progress: 0,
    started: false,
    executed: false,
    finished: false,
  }
}

/** 从队列中移除任务 */
const removeTaskWrap = (
  taskQueue: TaskWrapper<unknown>[],
  taskName: string,
) => {
  const wrapperIndex = taskQueue.findIndex(
    (wrapper) => wrapper.task.name === taskName,
  )
  // print(`wrapperIndex: ${wrapperIndex}, taskName: ${taskName}`)
  if (wrapperIndex > -1) {
    // print(`task removed`)
    taskQueue.splice(wrapperIndex, 1)
  }
}

/** 获取 tps 对照表 */
const getTpsComparisonTable = (minExecTime: number) => {
  const list: [number, number][] = [60, 45, 30, 20, 15, 10, 5, 3, 1].map(
    (exceptTps) => {
      const neededRuntimeTps = 1000 / (1000 / exceptTps - minExecTime)
      return [exceptTps, neededRuntimeTps]
    },
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
    void 0 as TaskWrapper | undefined,
  )
}

/**
 * 计算剩余的任务执行时间
 * @param taskWrapper
 * @returns {boolean} isUnexpired
 */
const calcRemainingExecTime = (
  taskWrapper: TaskWrapper,
  context: LongTaskSchedulingContext,
) => {
  context.remainingExecTime =
    context.currentTickRemainingExecTime -
    (getTimeInMillis() - context.currentTaskTickStartTime)
  if (context.remainingExecTime <= 1) {
    // 存储 tps 补偿时间
    context.tpsCompensationTime = context.remainingExecTime
    // 计算超时情况，超时情况严重时降低权重(最低权重时无法降低)
    if (context.remainingExecTime < 0 && taskWrapper.priority > 1) {
      const timeoutLevel = Math.floor(
        Math.abs(context.remainingExecTime) / context.minExecTime,
      )
      if (timeoutLevel > 0) {
        // 每超一倍的 minExecTime，降低一级优先级
        taskWrapper.priority = Math.max(
          taskWrapper.priority - timeoutLevel,
          1,
        ) as TaskPriority
      }
    }
    return false
  }
  return true
}

/**
 * TODO: try catch 可能并不生效
 * 处理任务报错
 */
const runWithTaskErrorHappened = (
  error: unknown,
  taskWrapper: TaskWrapper,
  context: LongTaskSchedulingContext,
) => {
  const { taskQueue } = context
  const { task } = taskWrapper
  taskWrapper.endTime = getTimeInMillis()
  calcRemainingExecTime(taskWrapper, context)
  if (context.currentRunningTaskWrapper) {
    context.currentRunningTaskWrapper.actualExecTime +=
      context.currentTickRemainingExecTime - context.remainingExecTime
  }
  // 移除报错的任务，打断当前 tick 的执行，抛出错误
  removeTaskWrap(taskQueue, task.name)
  context.prevTaskWrapper = getPrevTaskWrapper(taskWrapper)
  context.currentRunningTaskWrapper = void 0
  context.prevTaskTickEndTime = getTimeInMillis()
  context.prevTaskTickStartTime = context.currentTaskTickStartTime
  if (typeof task.error === 'function') {
    task.error(error, task.data)
  }
  throw error
}

const getPrevTaskWrapper = (taskWrapper: TaskWrapper) => {
  return {
    ...taskWrapper,
    prevTask: omit(taskWrapper.task, [
      'data',
      'start',
      'step',
      'progress',
      'finish',
      'data',
    ]),
  }
}

/** 执行情况的队列，循环队列 */
class ExecutionStatusQueue {
  queue: number[]

  constructor() {
    const queueCount = 10
    this.queue = ([] as number[]).fill(0, 0, queueCount)
  }
}

/**
 * 创建任务调度
 * 执行的任务不太关心什么时候完成
 * @returns
 */
export const createLongTaskSchedulingManager = () => {
  const context: LongTaskSchedulingContext = {
    prevTaskTickEndTime: 0,
    prevTaskTickStartTime: 0,
    currentTaskTickStartTime: 0,
    tps: 0,
    currentTickRemainingExecTime: 0,
    remainingExecTime: 0,
    gamePaused: true,
    currentRunningTaskWrapper: void 0,
    taskQueue: [],
    minExecTime: 4,
    tpsCompensationTime: 0,
    executionStatusQueue: new ExecutionStatusQueue(),
  }

  /**
   * tps 对照表，在每一项中，
   *
   * 第一个值为期望任务运行时的 tps，
   *
   * 第二个值为达到期望 tps 所需要的实际 tps
   */
  const tpsComparisonTable = getTpsComparisonTable(context.minExecTime)

  // tps 补偿逻辑

  // 问题：
  // 当前的判断方式会导致 tps 一路降低而非稳定在指定的 tps 附近，
  // 需要有补偿机制，需要考虑任务超时降级导致任务切换的情况

  // 实现：
  // 假设期望 60tps, 且 tps 为 100
  // 记录该 tps，任务开始执行，tps 补偿偏移为 0
  // 下一次调度，执行 1000/60-1000/100 ms，记录 tps 补偿偏移，可能为正可能为负
  // 下一次调度，可用时间为 理论可用时间 + tps 补偿偏移，若可用时间为正，正常执行，若可用时间为负，跳过执行
  // （理论上，任务调度执行正常时，造成 tps 波动幅度较小）
  // 直至执行完成

  // TODO: 考虑 tps 持续低于 期望 tps 的一定时间的情况
  // 若连续一段时间（暂定为 10s）执行机会小于指定次数（暂定为 10 次），重新调整预期 tps
  // 使用循环队列优化计算

  /**
   * 选取合适的用来执行任务的期望 tps
   * 当前 tps 大于期望 tps 时，使用大于当前 tps 且最接近当前 tps 级别的 tps
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
    const prevGamePaused = context.gamePaused
    context.gamePaused = isGamePaused()
    // 暂停时清空 tps 计时
    if (context.gamePaused !== prevGamePaused && context.gamePaused) {
      context.prevTaskTickEndTime = 0
      context.prevTaskTickStartTime = 0
    }
    if (context.gamePaused) {
      return
    }

    const now = getTimeInMillis()
    context.currentTaskTickStartTime = now
    // 运行的第一个 tick 不执行任务，因为无法计算 tps
    if (context.prevTaskTickEndTime === 0) {
      context.prevTaskTickEndTime = now
      context.prevTaskTickStartTime = now
      return
    }
    // const tickDuration = now - context.prevTaskTickStartTime
    const tickDuration = now - context.prevTaskTickEndTime
    if (tickDuration <= 0) {
      return
    }
    context.tps = Math.floor(1000 / tickDuration)
    // 设置 tps 补偿时间
    context.currentTickRemainingExecTime = context.tpsCompensationTime
    context.tpsCompensationTime = 0

    // 任务的执行策略
    // 权重，串行（期望尽可能快的减少任务）
    const runNextTask = () => {
      if (context.taskQueue.length === 0) {
        return
      }
      // 获取权重最高的 task
      const currentTaskWrapper = getMaxPriorityTaskWrapper(context.taskQueue)
      // 当前无任务
      if (!currentTaskWrapper) {
        return
      }
      context.currentRunningTaskWrapper = currentTaskWrapper

      const runTask = (taskWrapper: TaskWrapper) => {
        const task = taskWrapper.task
        if (!taskWrapper.started) {
          taskWrapper.startTime = getTimeInMillis()
          taskWrapper.progress = 0
          taskWrapper.priority = task.priority || defaultTaskPriority
          taskWrapper.exceptTpsLevel =
            task.exceptTpsLevel || defaultTaskExceptTpsLevel
          taskWrapper.exceptTps = getExceptTps(task)
        }
        const finalExceptTps = getFinalExceptTps(
          taskWrapper.exceptTps,
          context.tps,
        )
        // 期望 tps 小于等于 1tps 时，固定执行 100ms
        // 加上 tps 补偿时间
        const taskExecTimeInATick =
          finalExceptTps > 1 ? 1000 / finalExceptTps - 1000 / context.tps : 100
        // 假设根据期望 tps，得出原本可用 10ms，
        // 任务执行用了 3ms，执行完成，还剩 7ms，然后执行下一个任务，
        // 根据新任务的期望 tps，得出可用 20ms，
        // 那当前剩余可用时间为 20ms - 3ms = 17ms
        const currentTickUsedTime =
          getTimeInMillis() - context.currentTaskTickStartTime
        context.currentTickRemainingExecTime +=
          taskExecTimeInATick - currentTickUsedTime
        context.remainingExecTime = context.currentTickRemainingExecTime
        // 任务改变后或被 tps 补偿时间抵消，导致剩余时间不足，跳过当前 tick
        if (context.remainingExecTime <= 0) {
          return
        }
        // 临时解决方案，当切屏或者暂停后，导致可执行时间过长时，跳过当前 tick
        if (context.remainingExecTime > 1000) {
          return
        }

        // task start stage
        if (!taskWrapper.started) {
          if (typeof task.start === 'function') {
            try {
              task.start(task.data)
            } catch (error) {
              runWithTaskErrorHappened(error, taskWrapper, context)
              return
            }
          }
          taskWrapper.started = true
          const isStartUnexpired = calcRemainingExecTime(taskWrapper, context)
          if (!isStartUnexpired) {
            return
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
              runWithTaskErrorHappened(error, taskWrapper, context)
              return
            }
            const isStepUnexpired = calcRemainingExecTime(taskWrapper, context)
            if (!isStepUnexpired) {
              return
            }
          }
        }

        // task finish stage
        if (!taskWrapper.finished && typeof task.finish === 'function') {
          try {
            // print('[FILTER_TAG]10')
            if (task.finishInRenderTick) {
              nextRenderTick(() => {
                task.finish && task.finish(task.data)
                // print('[FILTER_TAG]21')
              })
            } else {
              nextTick(() => {
                task.finish && task.finish(task.data)
                // print('[FILTER_TAG]22')
              })
            }
            taskWrapper.finished = true
            taskWrapper.endTime = getTimeInMillis()
            removeTaskWrap(context.taskQueue, task.name)
            // print('[FILTER_TAG]11')
          } catch (error) {
            runWithTaskErrorHappened(error, taskWrapper, context)
            return
          }
          const isEndUnexpired = calcRemainingExecTime(taskWrapper, context)
          if (!isEndUnexpired) {
            return
          }
        } else {
          taskWrapper.finished = true
          taskWrapper.endTime = getTimeInMillis()
        }
        if (context.currentRunningTaskWrapper) {
          context.currentRunningTaskWrapper.actualExecTime +=
            context.currentTickRemainingExecTime - context.remainingExecTime
        }
        context.prevTaskWrapper = getPrevTaskWrapper(taskWrapper)
        context.currentRunningTaskWrapper = void 0
        // print('[FILTER_TAG]12')
        runNextTask()
      }

      runTask(currentTaskWrapper)
    }
    runNextTask()
    context.prevTaskTickEndTime = getTimeInMillis()
    context.prevTaskTickStartTime = context.currentTaskTickStartTime
  }

  const remove = (task: Task | string) => {
    if (typeof task === 'string') {
      removeTaskWrap(context.taskQueue, task)
      return
    }
    removeTaskWrap(context.taskQueue, task.name)
  }

  return {
    /** 插入任务，重复标识的任务不会插入到任务队列中 */
    add<T>(task: Task<T>) {
      if (
        context.taskQueue.some((taskWrap) => taskWrap.task.name === task.name)
      ) {
        return
      }
      context.taskQueue.push(createTaskWrapper(task))
    },
    remove,
    start() {
      onTickEvenPaused.addListener(tickListener)
    },
    stop() {
      context.prevTaskTickEndTime = 0
      context.prevTaskTickStartTime = 0
      onTickEvenPaused.removeListener(tickListener)
    },
    /** 获取任务的对外暴露的包装 */
    getPacking(taskName: string) {
      const taskWrap = context.taskQueue.find(
        (wrapper) => wrapper.task.name === taskName,
      )
      if (!taskWrap) {
        return
      }
      return {
        task: taskWrap.task,
        /** 是否在执行当前任务 */
        isRunning() {
          return (
            context.currentRunningTaskWrapper &&
            context.currentRunningTaskWrapper.task.name === taskWrap.task.name
          )
        },
        /** 移除任务 */
        remove() {
          remove(taskWrap.task)
        },
        /** 获取任务执行进度 */
        progress() {
          return taskWrap.progress
        },
      }
    },
    getTaskQueue() {
      return context.taskQueue
    },
    getCurrentRunningTaskWrapper() {
      return context.currentRunningTaskWrapper
    },
    getContext() {
      return context
    },
  }
}

// =================== 分割线 ====================

export const exampleTask: Task<{
  count: number
  finalCount: number
}> = {
  name: 'test',
  exceptTpsLevel: 1,
  priority: 3,
  data: {
    count: 0,
    finalCount: 100000,
  },
  start() {
    print('start')
    this.data.count = 0
  },
  step() {
    // print('step')
    if (this.data.count >= this.data.finalCount) {
      return true
    }
    this.data.count++
    return false
  },
  progress() {
    // print('progress')
    return this.data.count / this.data.finalCount
  },
  finish() {
    print('finish')
  },
  // error(err) {},
}

export const longTaskSchedulingManager = createLongTaskSchedulingManager()

onGameStart.addListener(() => {
  longTaskSchedulingManager.start()
})

onResetLua.addListener(() => {
  longTaskSchedulingManager.stop()
})

// longTaskSchedulingManager.add(exampleTask)
