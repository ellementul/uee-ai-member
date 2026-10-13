import readline from 'readline'
import { aiResponseEvent, taskRequestEvent, adminTaskRequestEvent, adminResponseEvent  } from './events.js'
import { MemberFactory } from '@ellementul/uee-core'

export class ChatMember extends MemberFactory {
  constructor(name = "ChatMember") {
    super(name)

    this.systemPrompt = " "
    this.mode = 'menu'

    this.onJoinRoom = () => {
      this.subscribe(aiResponseEvent, (msg) => {
        console.log(`\n[AI]: ${msg.message}`)
        this._prompt()
      }, false)

      this.subscribe(adminResponseEvent, (msg) => {
        console.log(`\n[Администратор]: ${msg.message}`)
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
      
      if (this.mode === 'menu') {
        if (input === '1') {
          this.mode = 'prompt'
          this._prompt()
        } else if (input === '2') {
          this.mode = 'admin_prompt'
          this._prompt()
        } else if (input === '0') {
          console.log('\n[Канал] Завершение работы...')
          process.exit(0)
        } else if (input !== '') {
          console.log('\n[Канал] Неизвестная команда. Введите "1", "2" или "0" для выхода.')
          this._prompt()
        } else {
          this._prompt()
        }
        return
      }
      
      if (this.mode === 'prompt') {
        if (input) {
          const taskPayload = {
            system: "AI",
            action: "TaskRequest",
            taskId: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            sourceUid: this.uid(),
            systemPrompt: this.systemPrompt,
            content: input,
            timestamp: Date.now().toString(),
            role: "User"
          }
          
          this.send(taskRequestEvent, taskPayload)
          console.log('\n[Канал] Задача отправлена в Инференс.')
        } else {
          console.log('\n[Канал] Ввод отменен.')
        }
        
        this.mode = 'menu'
        this._prompt()
        return
      }

      if (this.mode === 'admin_prompt') {
        if (input) {
          const adminPayload = {
            system: "Admin",
            action: "AdminTaskRequest",
            taskId: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            sourceUid: this.uid(),
            question: input,
            timestamp: Date.now().toString()
          }
          
          this.send(adminTaskRequestEvent, adminPayload)
          console.log('\n[Канал] Запрос отправлен Администратору.')
        } else {
          console.log('\n[Канал] Ввод отменен.')
        }
        
        this.mode = 'menu'
        this._prompt()
        return
      }
    })
    
    rl.on('close', () => {
      console.log('\n[Канал] Закрыт.')
      process.exit(0)
    })
    
    this._prompt()
  }
  
  _prompt() {
    if (this.mode === 'menu') {
      process.stdout.write('\n> [Меню] "1" - ИИ, "2" - Админ, "0" - выход: ')
    } else if (this.mode === 'prompt') {
      process.stdout.write('\n> [Задача] Введите текст (Enter для отправки): ')
    } else if (this.mode === 'admin_prompt') {
      process.stdout.write('\n> [Администратор] Введите вопрос (Enter для отправки): ')
    }
  }
}