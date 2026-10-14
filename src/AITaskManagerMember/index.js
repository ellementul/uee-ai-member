import { MemberFactory } from '@ellementul/uee-core'
import { adminTaskRequestEvent, adminResponseEvent, taskRequestEvent, inferenceResponseEvent } from './events.js'
import { inferencePongEvent } from '../InferenceMember/events.js'

const WAIT_ROLE = "waitRole"
const READY_FOR_INFERENCE = "readyForInference"

export class AITaskManagerMember extends MemberFactory {
  constructor(name = "AdministratorMember") {
    super(name)

    this.tasks = []

    this.onJoinRoom = () => {
      this.subscribe(adminTaskRequestEvent, this.handleAdminTask.bind(this), false)
      this.subscribe(inferencePongEvent, (msg) => this.handleInferenceReady(msg), false)
      this.subscribe(inferenceResponseEvent, (msg) => this.finishInferenceTask(msg), false)
    }
  }

  async handleAdminTask({ taskId, question }) {

    if(this.tasks.length > 0) {
      this.send(adminResponseEvent, {
        sourceUid: this.uid(),
        message: "Инференс уже работает",
        timestamp: Date.now().toString()
      })
    }
    else {
      this.tasks.push({ taskId, question, state: "waitRole" })
    }
  }

  async handleInferenceReady({ state }) {

    if(this.tasks.length > 0 && state == "Ready"){
      const task = this.tasks[0]

      if(task.state == WAIT_ROLE) {
        this.send(taskRequestEvent, {
          sourceUid: this.uid(),
          taskId: task.taskId,
          role: "Администратор",
          systemPrompt: `
            Ты менеджер ИИ. Ты должен определить по запросу пользотвателя, какую роль на себе должен принять ИИ для этогозапроса и написать систменый промт для этого ИИ
            Ответ должен быть строго форматом JSON

            {
              role: "...",
              systemPrompt: "..."
            }
          `,
          content: JSON.stringify(task),
          timestamp: Date.now().toString()
        })
      }
      else if(task.state == READY_FOR_INFERENCE) {
        this.send(taskRequestEvent, {
          sourceUid: this.uid(),
          taskId: task.taskId,
          role: task.role,
          systemPrompt: task.systemPrompt,
          content: task.question,
          timestamp: Date.now().toString()
        })
      }
    }
    
  }

  async finishInferenceTask({ taskId, message }) {
      const task = this.tasks[0]

      if(!task || task.taskId != taskId)
        return

      if(task.state == WAIT_ROLE) {
        task.state = READY_FOR_INFERENCE

        const { role, systemPrompt } = JSON.parse(message)
        task.role = role
        task.systemPrompt = systemPrompt

        this.send(taskRequestEvent, {
          sourceUid: this.uid(),
          taskId: task.taskId,
          role,
          systemPrompt,
          content: task.question,
          timestamp: Date.now().toString()
        })
      }
      else if(task.state == READY_FOR_INFERENCE) {
        this.send(adminResponseEvent, {
          sourceUid: this.uid(),
          message,
          timestamp: Date.now().toString()
        })

        this.tasks = []
      }
  }
}