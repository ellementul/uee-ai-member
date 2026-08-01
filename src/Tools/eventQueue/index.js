export const EventQueueTool = {
  name: "EventQueue",
  ToolFactory() {
    const queue = []

    return {
      // Метод для добавления события в очередь (передается в subscribe)
      enqueue(msg) {
        queue.push(msg)
      },
      // Метод для извлечения одного события из очереди для обработки
      dequeue() {
        return queue.shift()
      },
      // Вспомогательный метод для проверки, есть ли еще события
      isEmpty() {
        return queue.length === 0
      }
    }
  },
  depends: {
    required: []
  }
}