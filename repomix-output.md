This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
events.js
index.js
index.test.js
```

# Files

## File: events.js
```javascript
import { EventFactory, Types } from "@ellementul/uee-core"

export const taskRequestEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "TaskRequest",
  taskId: Types.Key.Def(3),
  sourceUid: Types.Key.Def(3),
  content: Types.String.Def(),
  systemPrompt: Types.String.Def(),
  timestamp: Types.Key.Def(3),
  role: Types.String.Def()
}))

// AI ответил
export const aiResponseEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "Response",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))

export const inferenceResponseEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "InferenceResponse",
  sourceUid: Types.Key.Def(3),
  taskId: Types.Key.Def(3),
  message: Types.String.Def(),
  format: Types.String.Def(), // "json" или "text"
  timestamp: Types.Key.Def(3)
}))

export const inferenceErrorEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "InferenceError",
  sourceUid: Types.Key.Def(3),
  taskId: Types.Key.Def(3),       // Критически важно: связывает ошибку с конкретной задачей
  error: Types.Object.Def({
    message: Types.String.Def()   // Только сообщение, как мы и договаривались
  }),
  timestamp: Types.Key.Def(3)
}))
```

## File: index.test.js
```javascript
import test from 'ava'
import sinon from 'sinon'
import { MemberFactory } from '@ellementul/uee-core'
import { InferenceMember } from './index.js'
import { taskRequestEvent, inferenceResponseEvent, inferenceErrorEvent } from './events.js'

// --- Утилиты ---

// Надёжное ожидание условия с таймаутом (вместо later)
const waitFor = (condition, timeoutMs = 2000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval)
        resolve()
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error(`Timeout waiting for condition after ${timeoutMs}ms`))
      }
    }, 10)
  })
}

// Фабрика мок-инструмента LLM
const createMockLlmTool = (mockResponse) => ({
  name: "Llm",
  ToolFactory() {
    return {
      setConfig: () => {},
      query: async () => mockResponse
    }
  },
  depends: { required: [] }
})

// Хелпер для payload задачи
const createTaskPayload = (taskId = 'test-task-1', content = 'Привет') => ({
  taskId,
  sourceUid: 'user-uid-123',
  systemPrompt: 'Ты полезный помощник',
  content,
  timestamp: Date.now().toString(),
  role: 'User'
})

// --- Тестовые кейсы ---

test('InferenceMember: успешный текстовый ответ', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()

  const mockTool = createMockLlmTool({ message: "Это обычный текст" })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const callback = sinon.fake()
  host.subscribe(inferenceResponseEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload('task-text-1', 'Скажи привет'))

  await waitFor(() => callback.called)

  t.true(callback.calledOnce)
  const payload = callback.getCall(0).args[0]
  t.is(payload.format, 'text')
  t.is(payload.message, 'Это обычный текст')
  t.is(payload.taskId, 'task-text-1')
})

test('InferenceMember: успешный JSON ответ', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()

  const jsonString = '{"role": "admin", "prompt": "будь строгим"}'
  const mockTool = createMockLlmTool({ message: jsonString })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const callback = sinon.fake()
  host.subscribe(inferenceResponseEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload('task-json-1', 'Дай JSON'))

  await waitFor(() => callback.called)

  t.true(callback.calledOnce)
  const payload = callback.getCall(0).args[0]
  t.is(payload.format, 'json')
  t.is(payload.message, jsonString)
})

test('InferenceMember: обработка ошибки LLM инструмента', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()

  const mockTool = {
    name: "Llm",
    ToolFactory() {
      return {
        setConfig: () => {},
        query: async () => { throw new Error("Сбой сети API") }
      }
    },
    depends: { required: [] }
  }

  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const callback = sinon.fake()
  host.subscribe(inferenceErrorEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload('task-err-1', 'Сломись'))

  await waitFor(() => callback.called)

  t.true(callback.calledOnce)
  const payload = callback.getCall(0).args[0]
  t.is(payload.error.message, 'Сбой сети API')
  t.is(payload.taskId, 'task-err-1')
})

test('InferenceMember: тихий сброс при пустом ответе', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()

  const mockTool = createMockLlmTool({ message: "" })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const callback = sinon.fake()
  host.subscribe(inferenceResponseEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload('task-empty-1', 'Пустота'))

  // Ожидаем, что условие НИКОГДА не выполнится (таймаут)
  const error = await t.throwsAsync(() => waitFor(() => callback.called, 500))
  t.true(error.message.includes('Timeout'))
  t.false(callback.called)
})
```

## File: index.js
```javascript
import { MemberFactory } from '@ellementul/uee-core'
import { taskRequestEvent, inferenceResponseEvent, inferenceErrorEvent } from './events.js'
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
```
