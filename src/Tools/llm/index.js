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