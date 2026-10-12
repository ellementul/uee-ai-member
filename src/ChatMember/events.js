import { EventFactory, Types } from "@ellementul/uee-core"

export const taskRequestEvent = EventFactory(Types.Object.Def({
  system: "AI",
  action: "TaskRequest",
  taskId: Types.Key.Def(3),
  sourceUid: Types.Key.Def(3),
  content: Types.String.Def(),
  timestamp: Types.Key.Def(3),
  role: Types.String.Def()
}))

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