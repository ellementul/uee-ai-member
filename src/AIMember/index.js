import { MemberFactory } from '@ellementul/uee-core'
import { userMessageEvent, aiResponseEvent } from './events.js'
import { LlmTool } from '../Tools/lmstudio/index.js'
import { EventQueueTool } from '../Tools/eventQueue/index.js'

export class AIMember extends MemberFactory {
  constructor(name = "AIMember") {
    super(name)
    
    this.addTool(LlmTool)
    this.addTool(EventQueueTool)

    this.analystHistory = new MessageHistory()
    this.assistantHistory = new MessageHistory()

    this.tools.Llm.setConfig({
      apiUrl: 'http://localhost:1234/v1/chat/completions',
      model: 'omnicoder-qwen3.5-9b-claude-4.6-opus-uncensored-v2'
    })
    
    this.onJoinRoom = () => {
      console.log(`[AIMember] Присоединился к общей комнате. UID: ${this.uid()}`)
      this.subscribe(userMessageEvent, (msg) => {
        this.tools.EventQueue.enqueue(msg)
        this.processQueue()
      })
    }
  }

  async processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (!this.tools.EventQueue.isEmpty()) {
      const event = this.tools.EventQueue.dequeue()
      await this.handleEvent(event)
    }

    this.isProcessing = false
  }

  async handleEvent(event) {
    if (event.sourceUid === this.uid()) return

    console.log(`[AI] Получено событие: ${JSON.stringify(event)}`)
    
    const routerSystemPrompt = `Ты специалист технической поддержки. Твоя задача — анализировать поток событий и определять, требует ли событие ответа от тебя. Отвечай строго "Yes" или "No".`
    const routerUserPrompt = `Это сообщение от пользователя, требующее ответа?\n\n${JSON.stringify(event)}`
    
    const messages = [
      { role: 'system', content: routerSystemPrompt },
      { role: 'user', content: routerUserPrompt }
    ]
    
    const result = await this.tools.Llm.query(messages)
    
    if (result) {
      const shouldRespond = result.message.toLowerCase().includes('yes')
      console.log(`[AI] Маршрутизация: требуется ответ = ${shouldRespond}`)
      
      if (result.reasoning) {
        console.log(`[AI] Reasoning: ${result.reasoning}`)
      }

      if (shouldRespond) {
        await this.generateResponse(event)
      } else {
        await this.analyzeEvent(event)
      }
    }
  }

  async generateResponse(event) {
    const systemPrompt = `Ты полезный AI ассистент, участвующий в диалоге.`
    
    const userDate = new Date(event.timestamp).toISOString()
    const userContent = `<date>${userDate}</date>\n${event.message || JSON.stringify(event)}`
    this.assistantHistory.add({ role: 'user', content: userContent })
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.assistantHistory.getAll()
    ]
    
    const result = await this.tools.Llm.query(messages)
    
    if (result && result.message) {
      const currentDate = new Date().toISOString()
      const assistantContent = `<date>${currentDate}</date>\n${result.message}`
      this.assistantHistory.add({ role: 'assistant', content: assistantContent })
      
      console.log(`[AI] Сгенерирован ответ: ${result.message}`)
      
      this.send(aiResponseEvent, {
        sourceUid: this.uid(),
        message: result.message,
        timestamp: Date.now().toString()
      })
    }
  }

  async analyzeEvent(event) {
    const analystSystemPrompt = `Ты аналитический модуль. Твоя задача — извлекать скрытые намерения, контекст и факты из событий. Сформулируй краткую "мысль" для внутреннего использования.`
    
    const messages = [
      { role: 'system', content: analystSystemPrompt },
      { role: 'user', content: JSON.stringify(event) }
    ]
    
    const result = await this.tools.Llm.query(messages)
    
    if (result && result.message) {
      const currentDate = new Date().toISOString()
      const analystContent = `<date>${currentDate}</date>\n${result.message}`
      this.analystHistory.add({ role: 'assistant', content: analystContent })
      console.log(`[AI] Анализ (мысль): ${result.message}`)
    }
  }
}

export class MessageHistory {
  constructor() {
    this.messages = []
  }
  
  add(message) {
    this.messages.push(message)
  }
  getAll() {
    return [...this.messages]
  }
}