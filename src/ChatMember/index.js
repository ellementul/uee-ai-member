
import readline from 'readline'
import { userMessageEvent, aiResponseEvent } from './events.js'
import { MemberFactory } from '@ellementul/uee-core'

export class ChatMember extends MemberFactory {
  constructor(name = "ChatMember") {
    super(name)
    
    this.onJoinRoom = () => {
        console.log(`[ChatMember] Присоединился к общей комнате. UID: ${this.uid()}`)
        
        this.subscribe(aiResponseEvent, (msg) => {
            if (msg.sourceUid === this.uid()) return
            console.log(`\n[AI]: ${msg.message}`)
            this._prompt()
        })
        
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
      const message = line.trim()
      if (!message) {
        this._prompt()
        return
      }
      
      // Отправляем событие в систему
      this.send(userMessageEvent, {
        sourceUid: this.uid(),
        message: message,
        timestamp: Date.now().toString()
      })
      
      this._prompt()
    })
    
    rl.on('close', () => {
      console.log('\nBye!')
      process.exit(0)
    })
    
    this._prompt()
  }
  
  _prompt() {
    process.stdout.write('> ')
  }
}