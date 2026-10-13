import test from 'ava'
import sinon from 'sinon'
import { MemberFactory } from '@ellementul/uee-core'
import { InferenceMember } from './index.js'
import { taskRequestEvent, inferenceResponseEvent, inferenceErrorEvent } from './events.js'

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

  const callback = sinon.fake()
  host.subscribe(inferenceResponseEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Скажи привет'))

  await waitFor(() => callback.called)

  t.true(callback.calledOnce)
  const payload = callback.getCall(0).args[0]
  t.is(payload.format, expectedFormat)
  t.is(payload.message, expectedMessage)
  t.is(payload.taskId, taskId)
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

  const callback = sinon.fake()
  host.subscribe(inferenceResponseEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Дай JSON'))

  await waitFor(() => callback.called)

  t.true(callback.calledOnce)
  const payload = callback.getCall(0).args[0]
  t.is(payload.format, expectedFormat)
  t.is(payload.message, jsonString)
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

  const callback = sinon.fake()
  host.subscribe(inferenceErrorEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Сломись'))

  await waitFor(() => callback.called)

  t.true(callback.calledOnce)
  const payload = callback.getCall(0).args[0]
  t.is(payload.error.message, errorMessage)
  t.is(payload.taskId, taskId)
})

test('InferenceMember: тихий сброс при пустом ответе', async (t) => {
  const host = new MemberFactory("HostRoom")
  host.makeRoom()
  host.strictValidationEvent = true

  const taskId = 'task_empty_1'
  
  const mockTool = createMockLlmTool({ message: "" })
  const inference = new InferenceMember("Inference", { LlmTool: mockTool })
  host.addMember(inference)

  const callback = sinon.fake()
  host.subscribe(inferenceResponseEvent, callback, false)

  host.send(taskRequestEvent, createTaskPayload(taskId, 'Пустота'))

  const error = await t.throwsAsync(() => waitFor(() => callback.called, 500))
  t.true(error.message.includes('Timeout'))
  t.false(callback.called)
})