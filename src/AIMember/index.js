import { MemberFactory } from '@ellementul/uee-core'
import { taskRequestEvent, aiResponseEvent, inferenceErrorEvent } from './events.js'

export class AIMember extends MemberFactory {
  constructor(name = "AIMember") {
    super(name)
    
    this.apiUrl = 'http://localhost:1234/v1/chat/completions'
    this.model = 'omnicoder-qwen3.5-9b-claude-4.6-opus-uncensored-v2'
    
    this.onJoinRoom = () => {
      console.log(`[AIMember] Присоединился. UID: ${this.uid()}`)
      this.subscribe(taskRequestEvent, this.handleTask.bind(this), false)
    }
  }
  
  async handleTask(msg) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: msg.systemPrompt },
            { role: 'user', content: msg.content }
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
    } catch (error) {
      this.send(inferenceErrorEvent, {
        sourceUid: this.uid(),
        taskId: msg.taskId,
        error: {
          message: error.message
        },
        timestamp: Date.now().toString()
      })
    }
  }
}