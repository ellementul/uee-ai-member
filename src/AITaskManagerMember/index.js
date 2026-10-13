import { MemberFactory } from '@ellementul/uee-core'
import { adminTaskRequestEvent, adminResponseEvent } from './events.js'

export class AITaskManagerMember extends MemberFactory {
  constructor(name = "AdministratorMember") {
    super(name)

    this.onJoinRoom = () => {
      this.subscribe(adminTaskRequestEvent, this.handleAdminTask.bind(this), false)
    }
  }

  async handleAdminTask(msg) {
    this.send(adminResponseEvent, {
      sourceUid: this.uid(),
      message: "Администратор еще не реализован. Функция в разработке.",
      timestamp: Date.now().toString()
    })
  }
}