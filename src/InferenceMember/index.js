import { MemberFactory } from '@ellementul/uee-core'
import { taskRequestEvent, inferenceResponseEvent, inferenceErrorEvent, inferenceReadyEvent } from './events.js'
import { LlmTool } from '../Tools/lmstudio/index.js'

export class InferenceMember extends MemberFactory {
   constructor(name = "InferenceMember", options = {}) {
    super(name)
    
    const { LlmTool: customLlmTool } = options
    this.addTool(customLlmTool || LlmTool)
    
    this.tools.Llm.setConfig({
      apiUrl: 'http://localhost:1234/v1/chat/completions',
      model: 'omnicoder-qwen3.5-9b-claude-4.6-opus-uncensored-v2'
    })
    
    this.onJoinRoom = () => {
      this.subscribe(taskRequestEvent, this.handleTask.bind(this), false)
      this.send(inferenceReadyEvent, {
        sourceUid: this.uid(),
        timestamp: Date.now().toString()
      })
    }
  }
  
  async handleTask(msg) {
    try {
      const result = await this.tools.Llm.query([
        { role: 'system', content: msg.systemPrompt },
        { role: 'user', content: msg.content }
      ])
      
      if (result && result.message) {
        const format = this._detectFormat(result.message)
        
        this.send(inferenceResponseEvent, {
          sourceUid: this.uid(),
          taskId: msg.taskId,
          message: result.message,
          format: format,
          timestamp: Date.now().toString()
        })
      }
    } catch (error) {
      this.send(inferenceErrorEvent, {
        sourceUid: this.uid(),
        taskId: msg.taskId,
        error: {
          message: error.message
        },
        timestamp: Date.now().toString()
      })
    } finally {
      // Сигнализируем о готовности после завершения (успех или ошибка)
      this.send(inferenceReadyEvent, {
        sourceUid: this.uid(),
        timestamp: Date.now().toString()
      })
    }
  }

  _detectFormat(message) {
    try {
      JSON.parse(message)
      return "json"
    } catch {
      return "text"
    }
  }
}