/**
 * Module-level singletons for the Classroom surface.
 *
 * One CoachLog per browser tab, created lazily so importing this module never
 * touches localStorage during a test or a server render. The Classroom is the
 * only writer; nothing outside src/classroom/ imports this.
 */
import { CoachLog } from '../coach/log'

let log: CoachLog | null = null

export function coachLog(): CoachLog {
  if (!log) log = new CoachLog()
  return log
}
