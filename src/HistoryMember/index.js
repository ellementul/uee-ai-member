import fs from 'fs'
import { EventFactory, MemberFactory, Types } from '@ellementul/uee-core'

export class HistoryMember extends MemberFactory {
  constructor(name = "HistoryMember") {
    super(name)
    
    const logFileName = `history_log_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    this.logStream = fs.createWriteStream(logFileName, { flags: 'a' })
    console.log(`[History] Логирование начато в файл: ${logFileName}`)

    this.onJoinRoom = () => {
      console.log(`[History] Присоединился к комнате. UID: ${this.uid()}`)
      
      // Подписка на все события без фильтрации
      const AllTypeEvent = EventFactory(Types.Object.Def({}, true))
      this.subscribe(AllTypeEvent, (msg) => {
        this._logEvent('ALL', msg)
      })
    }
  }

  _logEvent(direction, payload) {
    const timestamp = new Date().toISOString()
    // Определяем имя события из payload, если оно есть, или пишем Unknown
    const eventName = `${payload.system || 'Unknown'}:${payload.action || 'Unknown'}`
    const logLine = `\n[${timestamp}] [${direction}] ${eventName}\n${JSON.stringify(payload, null, 2)}\n`
    
    this.logStream.write(logLine)
  }

  destroy() {
    if (this.logStream) {
      this.logStream.end()
    }
    super.destroy()
  }
}