import { MemberFactory } from '@ellementul/uee-core'
import { taskRequestEvent, aiResponseEvent, inferenceErrorEvent } from './events.js'
import { LlmTool } from '../Tools/lmstudio/index.js'

export class InferenceMember extends MemberFactory { // <-- Переименован класс
  constructor(name = "InferenceMember") {
    super(name)
    
    // 1. Подключаем только инструмент LLM
    this.addTool(LlmTool)
    
    this.tools.Llm.setConfig({
      apiUrl: 'http://localhost:1234/v1/chat/completions',
      model: 'omnicoder-qwen3.5-9b-claude-4.6-opus-uncensored-v2'
    })
    
    this.onJoinRoom = () => {
      this.subscribe(taskRequestEvent, this.handleTask.bind(this), false)
    }
  }
  
  async handleTask(msg) {
    try {
      // 2. Используем абстракцию инструмента
      const result = await this.tools.Llm.query([
        { role: 'system', content: msg.systemPrompt },
        { role: 'user', content: msg.content }
      ])
      
      // 3. Генерируем событие ответа (без console.log)
      if (result && result.message) {
        this.send(aiResponseEvent, {
          sourceUid: this.uid(),
          message: result.message,
          timestamp: Date.now().toString()
        })
      }
    } catch (error) {
      // 4. Генерируем событие ошибки (без console.error)
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