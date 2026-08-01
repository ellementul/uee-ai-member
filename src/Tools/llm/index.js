export const LlmTool = {
  name: "Llm",
  ToolFactory({ currentMember }) {
    let apiUrl = 'http://localhost:1234/v1/chat/completions'
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
            body: JSON.stringify({ model, messages })
          })
          
          if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`)
          
          const data = await response.json()
          return data.choices?.[0]?.message?.content || 'Извини, я не смог сгенерировать ответ.'
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