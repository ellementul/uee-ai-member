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