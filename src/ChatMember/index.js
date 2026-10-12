import readline from 'readline'
import { aiResponseEvent, taskRequestEvent } from './events.js'
import { MemberFactory } from '@ellementul/uee-core'

export class ChatMember extends MemberFactory {
  constructor(name = "ChatMember") {
    super(name)

    this.systemPrompt = " "

    this.onJoinRoom = () => {
      console.log(`[Канал] Присоединился к комнате. UID: ${this.uid()}`)
      
      this.subscribe(aiResponseEvent, (msg) => {
        console.log(`\n[AI]: ${msg.message}`)
        this._prompt()
      }, false)
      
      this._startInput()
    }
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
      process.exit(0)
    })
    
    this._prompt()
  }
  
  _prompt() {
    process.stdout.write('> ')
  }
}