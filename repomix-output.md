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
````
src/
  AITaskManagerMember/
    events.js
    index.js
  ChatMember/
    events.js
    index.js
  HistoryMember/
    index.js
  InferenceMember/
    events.js
    index.js
    index.test.js
  Tools/
    eventQueue/
      index.js
    llm/
      index.js
    lmstudio/
      index.js
.gitignore
index.js
LICENSE
package.json
README.md
````

# Files

## File: src/AITaskManagerMember/events.js
````javascript
import { EventFactory, Types } from "@ellementul/uee-core"

// 1. Запрос от пользователя (или Чата) к Администратору
export const adminTaskRequestEvent = EventFactory(Types.Object.Def({
  system: "Admin",
  action: "AdminTaskRequest",
  taskId: Types.Key.Def(3),      // Строго >= 3 символов, a-z, A-Z, 0-9, _
  sourceUid: Types.Key.Def(3),
  question: Types.String.Def(),  // Исходный текст запроса пользователя
  timestamp: Types.Key.Def(3)
}))

// 2. Финальный ответ Администратора пользователю
export const adminResponseEvent = EventFactory(Types.Object.Def({
  system: "Admin",
  action: "AdminResponse",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),   // Финальный текст или сообщение об ошибке/занятости
  timestamp: Types.Key.Def(3)
}))

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

export const inferenceResponseEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "InferenceResponse",
  sourceUid: Types.Key.Def(3),
  taskId: Types.Key.Def(3),
  message: Types.String.Def(),
  format: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))

export const inferenceErrorEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "InferenceError",
  sourceUid: Types.Key.Def(3),
  taskId: Types.Key.Def(3),
  error: Types.Object.Def({
    message: Types.String.Def()
  }),
  timestamp: Types.Key.Def(3)
}))

export const inferenceReadyEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "InferenceReady",
  sourceUid: Types.Key.Def(3),
  timestamp: Types.Key.Def(3)
}))
````

## File: src/AITaskManagerMember/index.js
````javascript
import { MemberFactory } from '@ellementul/uee-core'
import { adminTaskRequestEvent, adminResponseEvent } from './events.js'

export class AITaskManagerMember extends MemberFactory {
  constructor(name = "AdministratorMember") {
    super(name)

    this.onJoinRoom = () => {
      this.subscribe(adminTaskRequestEvent, this.handleAdminTask.bind(this), false)
    }
  }

  async handleAdminTask(msg) {
    this.send(adminResponseEvent, {
      sourceUid: this.uid(),
      message: "Администратор еще не реализован. Функция в разработке.",
      timestamp: Date.now().toString()
    })
  }
}
````

## File: src/HistoryMember/index.js
````javascript
import fs from 'fs'
import { EventFactory, MemberFactory, Types } from '@ellementul/uee-core'

export class HistoryMember extends MemberFactory {
  constructor(name = "HistoryMember") {
    super(name)
    
    const logFileName = `history_log_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    this.logStream = fs.createWriteStream(logFileName, { flags: 'a' })
    console.log(`\n[History] Логирование начато в файл: ${logFileName}`)

    this.onJoinRoom = () => {
      // Подписка на все события без фильтрации
      const AllTypeEvent = EventFactory(Types.Object.Def({}, true))
      this.subscribe(AllTypeEvent, (msg) => {
        this._logEvent('ALL', msg)
      })
    }
  }

  _logEvent(direction, payload) {
    const timestamp = new Date().toISOString()
    // Определяем имя события из payload, если оно есть, или пишем Unknown
    const eventName = `${payload.system || 'Unknown'}:${payload.action || 'Unknown'}`
    const logLine = `\n[${timestamp}] [${direction}] ${eventName}\n${JSON.stringify(payload, null, 2)}\n`
    
    this.logStream.write(logLine)
  }

  destroy() {
    if (this.logStream) {
      this.logStream.end()
    }
    super.destroy()
  }
}
````

## File: src/InferenceMember/index.test.js
````javascript
import test from 'ava'
import sinon from 'sinon'
import { MemberFactory } from '@ellementul/uee-core'
import { InferenceMember } from './index.js'
import { 
  taskRequestEvent, 
  inferenceResponseEvent, 
  inferenceErrorEvent, 
  inferenceReadyEvent 
} from './events.js'

// --- Утилиты ---

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

const createTaskPayload = (taskId, content = 'Привет') => ({
  system: "AI",
  action: "TaskRequest",
  taskId,
  sourceUid: 'user_uid_123',
  systemPrompt: 'Ты полезный помощник',
  content,
  timestamp: Date.now().toString(),
  role: 'User'
})

// --- Тестовые кейсы ---

test('InferenceMember: отправляет готовность при присоединении к комнате', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()
  host.strictValidationEvent = true

  const readyCallback = sinon.fake()
  host.subscribe(inferenceReadyEvent, readyCallback, false)

  const mockTool = createMockLlmTool({ message: "test" })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  
  // Событие должно уйти внутри onJoinRoom, который срабатывает при addMember
  host.addMember(inference)

  await waitFor(() => readyCallback.called)

  t.true(readyCallback.calledOnce)
  const payload = readyCallback.getCall(0).args[0]
  t.is(payload.sourceUid, inference.uid())
})

test('InferenceMember: успешный текстовый ответ', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()
  host.strictValidationEvent = true

  const taskId = 'task_text_1'
  const expectedMessage = 'Это обычный текст'
  const expectedFormat = 'text'
  
  const mockTool = createMockLlmTool({ message: expectedMessage })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const responseCallback = sinon.fake()
  const readyCallback = sinon.fake()
  
  host.subscribe(inferenceResponseEvent, responseCallback, false)
  host.subscribe(inferenceReadyEvent, readyCallback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Скажи привет'))

  await waitFor(() => responseCallback.called && readyCallback.called)

  t.true(responseCallback.calledOnce)
  t.true(readyCallback.calledOnce)
  
  const responsePayload = responseCallback.getCall(0).args[0]
  t.is(responsePayload.format, expectedFormat)
  t.is(responsePayload.message, expectedMessage)
  t.is(responsePayload.taskId, taskId)

  const readyPayload = readyCallback.getCall(0).args[0]
  t.is(readyPayload.sourceUid, inference.uid())
})

test('InferenceMember: успешный JSON ответ', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()
  host.strictValidationEvent = true

  const taskId = 'task_json_1'
  const jsonString = '{"role": "admin", "prompt": "будь строгим"}'
  const expectedFormat = 'json'
  
  const mockTool = createMockLlmTool({ message: jsonString })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const responseCallback = sinon.fake()
  const readyCallback = sinon.fake()
  
  host.subscribe(inferenceResponseEvent, responseCallback, false)
  host.subscribe(inferenceReadyEvent, readyCallback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Дай JSON'))

  await waitFor(() => responseCallback.called && readyCallback.called)

  t.true(responseCallback.calledOnce)
  t.true(readyCallback.calledOnce)
  
  const responsePayload = responseCallback.getCall(0).args[0]
  t.is(responsePayload.format, expectedFormat)
  t.is(responsePayload.message, jsonString)
})

test('InferenceMember: обработка ошибки LLM инструмента', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()
  host.strictValidationEvent = true

  const taskId = 'task_err_1'
  const errorMessage = 'Сбой сети API'
  
  const mockTool = {
    name: "Llm",
    ToolFactory() {
      return {
        setConfig: () => {},
        query: async () => { throw new Error(errorMessage) }
      }
    },
    depends: { required: [] }
  }

  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const errorCallback = sinon.fake()
  const readyCallback = sinon.fake()
  
  host.subscribe(inferenceErrorEvent, errorCallback, false)
  host.subscribe(inferenceReadyEvent, readyCallback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Сломись'))

  await waitFor(() => errorCallback.called && readyCallback.called)

  t.true(errorCallback.calledOnce)
  t.true(readyCallback.calledOnce)
  
  const errorPayload = errorCallback.getCall(0).args[0]
  t.is(errorPayload.error.message, errorMessage)
  t.is(errorPayload.taskId, taskId)
})

test('InferenceMember: тихий сброс при пустом ответе и сигнал готовности', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()
  host.strictValidationEvent = true

  const taskId = 'task_empty_1'
  
  const mockTool = createMockLlmTool({ message: "" })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const responseCallback = sinon.fake()
  const readyCallback = sinon.fake()
  
  host.subscribe(inferenceResponseEvent, responseCallback, false)
  host.subscribe(inferenceReadyEvent, readyCallback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Пустота'))

  // Теперь мы ждем НЕ таймаута, а успешного сигнала готовности
  await waitFor(() => readyCallback.called)

  t.true(readyCallback.calledOnce)
  t.false(responseCallback.called, 'Событие ответа не должно быть отправлено')
})
````

## File: src/Tools/eventQueue/index.js
````javascript
export const EventQueueTool = {
  name: "EventQueue",
  ToolFactory() {
    const queue = []

    return {
      // Метод для добавления события в очередь (передается в subscribe)
      enqueue(msg) {
        queue.push(msg)
      },
      // Метод для извлечения одного события из очереди для обработки
      dequeue() {
        return queue.shift()
      },
      // Вспомогательный метод для проверки, есть ли еще события
      isEmpty() {
        return queue.length === 0
      }
    }
  },
  depends: {
    required: []
  }
}
````

## File: src/Tools/lmstudio/index.js
````javascript
export const LlmTool = {
  name: "Llm",
  ToolFactory({ currentMember }) {
    let apiUrl = 'http://localhost:1234/api/v1/chat'
    let model = 'local-model'

    return {
      setConfig(config) {
        if (config.apiUrl) apiUrl = config.apiUrl
        if (config.model) model = config.model
      },
      async query(messages) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages,
              store: false // Отключаем хранение истории чата на стороне сервера
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ошибка: ${response.status}. Детали: ${errorText}`)
          }

          const data = await response.json()
          let message = ""
          let reason = ""

          // 1. Нативный формат LM Studio (массив output)
          if (data.output && Array.isArray(data.output)) {
            for (const item of data.output) {
              if (item.type === 'text') message += item.content
              if (item.type === 'reasoning') reason += item.content
            }
          } 
          // 2. Фолбэк на OpenAI-совместимый формат (если сервер вернет его)
          else if (data.choices?.[0]?.message) {
            message = data.choices[0].message.content || ""
            reason = data.choices[0].message.reasoning_content || ""
          }

          return {
            message: message.trim(),
            reason: reason.trim()
          }
        } catch (error) {
          currentMember.throwError(error)
          return null
        }
      }
    }
  },
  depends: {
    required: [{ requiredName: "currentMember", requiredMethods: ["throwError"] }]
  }
}
````

## File: .gitignore
````
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.*
!.env.example

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist
.output

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp directory
.temp

# Sveltekit cache directory
.svelte-kit/

# vitepress build output
**/.vitepress/dist

# vitepress cache directory
**/.vitepress/cache

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# Firebase cache directory
.firebase/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# pnpm
.pnpm-store

# yarn v3
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# Vite files
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
.vite/
````

## File: LICENSE
````
MIT License

Copyright (c) 2026 Иван

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````

## File: README.md
````markdown
# uee-ai
An event-driven AI integration module for UnyEvents Core, enabling seamless interaction with LLMs via OpenAI-compatible APIs



## Система событий участников

Каждый участник определяет свои **входящие** и **исходящие** события в файле `events.js`.

### Принципы:

1. **Нет "собственных" событий** - есть только контракты взаимодействия:
   - **Входящие события** - что участник принимает от других
   - **Исходящие события** - что участник отправляет другим

2. **Автономность модулей** - каждый участник определяет ВСЕ события, с которыми работает, даже если они дублируют контракты других участников. Это позволяет выносить модули в отдельные репозитории без зависимостей.

3. **Совместимость контрактов** - для успешной коммуникации между двумя участниками:
   - Исходящее событие участника A должно удовлетворять типу входящего события участника B
   - События могут иметь разные имена, но структура (сигнатура) должна совпадать

### Пример:

**ChatMember/events.js:**
```javascript
// Входящие (получает от других)
export const aiResponseEvent = ...
export const adminResponseEvent = ...

// Исходящие (отправляет другим)
export const taskRequestEvent = ...
export const adminTaskRequestEvent = ...
````

## File: src/InferenceMember/events.js
````javascript
import { EventFactory, Types } from "@ellementul/uee-core"

export const inferenceReadyEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "InferenceReady",
  sourceUid: Types.Key.Def(3),
  timestamp: Types.Key.Def(3)
}))

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
````

## File: src/InferenceMember/index.js
````javascript
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
````

## File: src/Tools/llm/index.js
````javascript
export const LlmTool = {
    name: "Llm",
    ToolFactory({ currentMember }) {
        let apiUrl = 'http://localhost:1234/v1/chat/completions'
        let model = 'omnicoder-qwen3.5-9b-claude-4.6-opus-uncensored-v2'

        return {
            setConfig(config) {
                if (config.apiUrl) apiUrl = config.apiUrl
                if (config.model) model = config.model
            },
            async query(messages) {
                try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        model, 
                        messages
                        // Убран response_format, так как он вызывает 400 на неподдерживаемых моделях
                    })
                })
                
                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`HTTP ошибка: ${response.status}. Детали API: ${errorText}`)
                }
                
                const data = await response.json()
                let rawContent = data.choices?.[0]?.message?.content || '{}'
                
                // Надежное извлечение: берем всё от первой '{' до последней '}'
                const firstBracket = rawContent.indexOf('{')
                const lastBracket = rawContent.lastIndexOf('}')
                
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                    rawContent = rawContent.slice(firstBracket, lastBracket + 1)
                } else {
                    rawContent = rawContent.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim()
                }
                
                try {
                    return JSON.parse(rawContent)
                } catch (parseError) {
                    currentMember.throwError(new Error(`Failed to parse LLM JSON: ${parseError.message}. Raw: ${rawContent}`))
                    return { reasoning: "Ошибка парсинга", shouldRespond: false, message: "" }
                }
                } catch (error) {
                currentMember.throwError(error)
                return null
                }
            }
        }
    },
    depends: {
        required: [{ requiredName: "currentMember", requiredMethods: ["throwError"] }]
    }
}
````

## File: index.js
````javascript
import { MemberFactory } from '@ellementul/uee-core'
import { InferenceMember } from './src/InferenceMember/index.js'
import { ChatMember } from './src/ChatMember/index.js'
import { HistoryMember } from './src/HistoryMember/index.js'
import { AITaskManagerMember } from './src/AITaskManagerMember/index.js'


console.log('--- Инициализация системы ---')

const host = new MemberFactory("HostRoom")
host.makeRoom()
console.log(`[Host] Комната создана. UID: ${host.uid()}`)

const userChat = new ChatMember("UI")
console.log(`[UserChat] Запущен. UID: ${userChat.uid()}`)

const aiChat = new InferenceMember("Inference")
console.log(`[InferenceMember] Запущен. UID: ${aiChat.uid()}`)

const history = new HistoryMember("History")
console.log(`[HistoryMember] Запущен. UID: ${history.uid()}`)

const admin = new AITaskManagerMember("AIAdmin")
console.log(`[AITaskManagerMember] Запущен. UID: ${admin.uid()}`)

// 4. ПОМЕЩАЕМ ОБОИХ В ОДНУ ОБЩУЮ КОМНАТУ
// Это автоматически настроит всплытие событий (bubbling) между ними

aiChat.strictValidationEvent = true
userChat.strictValidationEvent = true
history.strictValidationEvent = true
admin.strictValidationEvent = true

host.addMember(aiChat)
host.addMember(userChat)
host.addMember(history)
host.addMember(admin)


console.log('\n=== Система готова к работе ===')
console.log('Введите сообщение в консоль и нажмите Enter.')
console.log('InferenceMember должен ответить вам.')
console.log('(Ctrl+C для выхода)\n')
````

## File: package.json
````json
{
  "name": "uee-ai-member",
  "version": "0.0.1",
  "description": "An event-driven AI integration module for UnyEvents Core, enabling seamless interaction with LLMs via OpenAI-compatible APIs.",
  "homepage": "https://github.com/ellementul/uee-ai-member#readme",
  "bugs": {
    "url": "https://github.com/ellementul/uee-ai-member/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ellementul/uee-ai-member.git"
  },
  "dependencies": {
    "@ellementul/uee-core": "file:../uee-core"
  },
  "license": "MIT",
  "author": "ellementul",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "test": "ava",
    "start": "node ./index.js"
  },
  "devDependencies": {
    "ava": "^8.0.1",
    "sinon": "^22.1.0"
  }
}
````

## File: src/ChatMember/events.js
````javascript
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

// 1. Запрос от пользователя (или Чата) к Администратору
export const adminTaskRequestEvent = EventFactory(Types.Object.Def({
  system: "Admin",
  action: "AdminTaskRequest",
  taskId: Types.Key.Def(3),      // Строго >= 3 символов, a-z, A-Z, 0-9, _
  sourceUid: Types.Key.Def(3),
  question: Types.String.Def(),  // Исходный текст запроса пользователя
  timestamp: Types.Key.Def(3)
}))

// 2. Финальный ответ Администратора пользователю 
// (дублирует структуру aiResponseEvent для автономности модуля)
export const adminResponseEvent = EventFactory(Types.Object.Def({
  system: "Admin",
  action: "AdminResponse",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),   // Финальный текст или сообщение об ошибке/занятости
  timestamp: Types.Key.Def(3)
}))
````

## File: src/ChatMember/index.js
````javascript
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
````
