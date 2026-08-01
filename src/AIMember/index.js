import { MemberFactory } from '@ellementul/uee-core'
import { userMessageEvent, aiResponseEvent } from './events.js'
import { LlmTool } from '../Tools/llm/index.js'

export class AIMember extends MemberFactory {
  constructor(name = "AIMember") {
    super(name)
    
    this.addTool(LlmTool)
    this.tools.Llm.setConfig({
      apiUrl: 'http://localhost:1234/v1/chat/completions',
      model: 'omnicoder-qwen3.5-9b-claude-4.6-opus-uncensored-v2'
    })
    
    this.onJoinRoom = () => {
      console.log(`[AIMember] Присоединился к общей комнате. UID: ${this.uid()}`)
      this.subscribe(userMessageEvent, this.handleUserMessage.bind(this))
    }
  }
  
  async handleUserMessage(msg) {
    if (msg.sourceUid === this.uid()) return
    
    console.log(`[AI] Получено: "${msg.message}" от ${msg.sourceUid}`)
    
    const messages = [
      { role: 'system', content: 'Ты полезный ассистент.' },
      { role: 'user', content: msg.message }
    ]
    
    const aiText = await this.tools.Llm.query(messages)
    
    if (aiText) {
      this.send(aiResponseEvent, {
        sourceUid: this.uid(),
        message: aiText,
        timestamp: Date.now().toString()
      })
      console.log(`[AI] Отправлено: "${aiText}"`)
    }
  }
}