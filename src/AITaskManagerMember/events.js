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
  format: Types.String.Def(), // "json" или "text"
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