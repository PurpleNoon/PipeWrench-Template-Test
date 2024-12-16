import type { LongTaskSchedulingManager } from "../@sakuratears/pz-lib/longTaskScheduling"

export interface UIKey {
  internal?: string
}

declare global {
  let longTaskSchedulingManager: LongTaskSchedulingManager
}
