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