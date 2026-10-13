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