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