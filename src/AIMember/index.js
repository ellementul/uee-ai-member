import { MemberFactory } from '@ellementul/uee-core'
import { userMessageEvent, aiResponseEvent } from './events.js'

export class AIMember extends MemberFactory {
  constructor(name = "AIMember") {
    super(name)
    
    this.apiUrl = 'http://localhost:1234/v1/chat/completions'
    this.model = 'omnicoder-qwen3.5-9b-claude-4.6-opus-uncensored-v2'
    
    this.onJoinRoom = () => {
      console.log(`[AIMember] Присоединился к общей комнате. UID: ${this.uid()}`)
      this.subscribe(userMessageEvent, this.handleUserMessage.bind(this))
    }
  }
  
   async handleUserMessage(msg) {
    // Игнорируем свои же сообщения
    if (msg.sourceUid === this.uid()) return
    
    console.log(`[AI] Получено: "${msg.message}" от ${msg.sourceUid}`)
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'Ты полезный ассистент.' },
            { role: 'user', content: msg.message }
          ]
        })
      })
      
      if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`)
      
      const data = await response.json()
      const aiText = data.choices?.[0]?.message?.content || 'Извини, я не смог сгенерировать ответ.'
      
      this.send(aiResponseEvent, {
        sourceUid: this.uid(),
        message: aiText,
        timestamp: Date.now().toString()
      })
      
      console.log(`[AI] Отправлено: "${aiText}"`)
    } catch (error) {
      console.error(`[AI] Ошибка вызова LM Studio:`, error.message)
    }
  }
}