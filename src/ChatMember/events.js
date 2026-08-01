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