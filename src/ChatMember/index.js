import readline from 'readline'
import fs from 'fs'
import { aiResponseEvent, taskRequestEvent } from './events.js' // Убедись, что taskRequestEvent экспортирован здесь
import { EventFactory, MemberFactory, Types } from '@ellementul/uee-core'

export class ChatMember extends MemberFactory {
  constructor(name = "ChatMember") {
    super(name)

    this.systemPrompt = " "
    
    // Уникальное имя файла для каждого запуска
    const logFileName = `chat_log_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    this.logStream = fs.createWriteStream(logFileName, { flags: 'a' })
    console.log(`[Канал] Логирование начато в файл: ${logFileName}`)

    this.onJoinRoom = () => {
      console.log(`[Канал] Присоединился к комнате. UID: ${this.uid()}`)
      
      const AllTypeEvent = EventFactory(Types.Object.Def({}, true))

      this.subscribe(AllTypeEvent, (msg) => {
        this._logEvent('ALL', 'RECEIVE', msg)
      })
      
      this.subscribe(aiResponseEvent, (msg) => {
        if (msg.sourceUid === this.uid()) return
        this._prompt()
      })
      
      this._startInput()
    }
  }

  _logEvent(direction, eventName, payload) {
    const timestamp = new Date().toISOString()
    const logLine = `\n[${timestamp}] [${direction}] ${eventName}\n${JSON.stringify(payload, null, 2)}\n`
    
    // Вывод в консоль
    console.log(logLine.trim())
    // Запись в файл
    this.logStream.write(logLine)
  }
  
  _startInput() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    })
    
    rl.on('line', (line) => {
      const input = line.trim()
      if (!input) {
        this._prompt()
        return
      }
      
      // Обработка единственной команды
      if (input.startsWith('/task ')) {
        const content = input.slice(6).trim()
        if (content) {
          const taskPayload = {
            taskId: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            sourceUid: this.uid(),
            systemPrompt: this.systemPrompt,
            content: content,
            timestamp: Date.now().toString(),
            role: "User"
          }
          
          this.send(taskRequestEvent, taskPayload)
        } else {
          console.log('\n[Канал] Ошибка: укажите текст задачи. Пример: /task проанализируй данные')
        }
      } else {
        console.log('\n[Канал] Неизвестная команда. Доступна только: /task <текст>')
      }
      
      this._prompt()
    })
    
    rl.on('close', () => {
      console.log('\n[Канал] Закрыт.')
      this.logStream.end()
      process.exit(0)
    })
    
    this._prompt()
  }
  
  _prompt() {
    process.stdout.write('> ')
  }
}