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
  AIMember/
    events.js
    index.js
  ChatMember/
    events.js
    index.js
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
repomix-output.xml
````

# Files

## File: src/AIMember/events.js
````javascript
import { EventFactory, Types } from "@ellementul/uee-core"

// Пользователь написал сообщение
export const userMessageEvent = EventFactory(Types.Object.Def({
  system: "Chat",
  action: "UserMessage",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))

// AI ответил
export const aiResponseEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "Response",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))
````

## File: src/ChatMember/events.js
````javascript
import { EventFactory, Types } from "@ellementul/uee-core"


// Пользователь написал сообщение
export const userMessageEvent = EventFactory(Types.Object.Def({
  system: "Chat",
  action: "UserMessage",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))

// AI ответил
export const aiResponseEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "Response",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))
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

## File: index.js
````javascript
import { MemberFactory } from '@ellementul/uee-core'
import { AIMember } from './src/AIMember/index.js'
import { ChatMember } from './src/ChatMember/index.js'

console.log('--- Инициализация системы ---')

// 1. Создаем "Хост" — это будет наша общая комната (Room)
const host = new MemberFactory("HostRoom")
host.makeRoom()
console.log(`[Host] Комната создана. UID: ${host.uid()}`)

// 2. Создаем Пользовательский чат (читает stdin, пишет в stdout)
const userChat = new ChatMember("UserChat")
console.log(`[UserChat] Запущен. UID: ${userChat.uid()}`)

// 3. Создаем AI (пока работает как эхо-бот)
const aiChat = new AIMember("AIMember")
console.log(`[AIMember] Запучен. UID: ${aiChat.uid()}`)

// 4. ПОМЕЩАЕМ ОБОИХ В ОДНУ ОБЩУЮ КОМНАТУ
// Это автоматически настроит всплытие событий (bubbling) между ними

aiChat.strictValidationEvent = true
userChat.strictValidationEvent = true

host.addMember(aiChat)
host.addMember(userChat)


console.log('\n=== Система готова к работе ===')
console.log('Введите сообщение в консоль и нажмите Enter.')
console.log('AIMember должен ответить вам.')
console.log('(Ctrl+C для выхода)\n')
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
  }
}
````

## File: README.md
````markdown
# uee-ai
An event-driven AI integration module for UnyEvents Core, enabling seamless interaction with LLMs via OpenAI-compatible APIs
````

## File: repomix-output.xml
````xml
This file is a merged representation of the entire codebase, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
src/
  AIMember/
    events.js
    index.js
  ChatMember/
    events.js
    index.js
.gitignore
index.js
LICENSE
package.json
README.md
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="src/AIMember/events.js">
import { EventFactory, Types } from "@ellementul/uee-core"

// Пользователь написал сообщение
export const userMessageEvent = EventFactory(Types.Object.Def({
  system: "Chat",
  action: "UserMessage",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))

// AI ответил
export const aiResponseEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "Response",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))
</file>

<file path="src/AIMember/index.js">
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
</file>

<file path="src/ChatMember/events.js">
import { EventFactory, Types } from "@ellementul/uee-core"


// Пользователь написал сообщение
export const userMessageEvent = EventFactory(Types.Object.Def({
  system: "Chat",
  action: "UserMessage",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))

// AI ответил
export const aiResponseEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "Response",
  sourceUid: Types.Key.Def(3),
  message: Types.String.Def(),
  timestamp: Types.Key.Def(3)
}))
</file>

<file path="src/ChatMember/index.js">
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
            // this._prompt()
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
</file>

<file path=".gitignore">
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
</file>

<file path="index.js">
import { MemberFactory } from '@ellementul/uee-core'
import { AIMember } from './src/AIMember/index.js'
import { ChatMember } from './src/ChatMember/index.js'

console.log('--- Инициализация системы ---')

// 1. Создаем "Хост" — это будет наша общая комната (Room)
const host = new MemberFactory("HostRoom")
host.makeRoom()
console.log(`[Host] Комната создана. UID: ${host.uid()}`)

// 2. Создаем Пользовательский чат (читает stdin, пишет в stdout)
const userChat = new ChatMember("UserChat")
console.log(`[UserChat] Запущен. UID: ${userChat.uid()}`)

// 3. Создаем AI (пока работает как эхо-бот)
const aiChat = new AIMember("AIMember")
console.log(`[AIMember] Запучен. UID: ${aiChat.uid()}`)

// 4. ПОМЕЩАЕМ ОБОИХ В ОДНУ ОБЩУЮ КОМНАТУ
// Это автоматически настроит всплытие событий (bubbling) между ними

aiChat.strictValidationEvent = true
userChat.strictValidationEvent = true

host.addMember(aiChat)
host.addMember(userChat)


console.log('\n=== Система готова к работе ===')
console.log('Введите сообщение в консоль и нажмите Enter.')
console.log('AIMember должен ответить вам.')
console.log('(Ctrl+C для выхода)\n')
</file>

<file path="LICENSE">
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
</file>

<file path="package.json">
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
  }
}
</file>

<file path="README.md">
# uee-ai
An event-driven AI integration module for UnyEvents Core, enabling seamless interaction with LLMs via OpenAI-compatible APIs
</file>

</files>
````

## File: src/ChatMember/index.js
````javascript
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

## File: src/AIMember/index.js
````javascript
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
````
