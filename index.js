import { MemberFactory, RelationTool } from '@ellementul/uee-core'
import { InferenceMember } from './src/InferenceMember/index.js'
import { ChatMember } from './src/ChatMember/index.js'
import { HistoryMember } from './src/HistoryMember/index.js'
import { AITaskManagerMember } from './src/AITaskManagerMember/index.js'


console.log('--- Инициализация системы ---')

const host = new MemberFactory("HostRoom")
host.makeRoom()
RelationTool.pingDelay = 1000
host.addTool(RelationTool)
console.log(`[Host] Комната создана. UID: ${host.uid()}`)

const userChat = new ChatMember("UI")
console.log(`[UserChat] Запущен. UID: ${userChat.uid()}`)

const aiChat = new InferenceMember("Inference")
console.log(`[InferenceMember] Запущен. UID: ${aiChat.uid()}`)

const history = new HistoryMember("History")
console.log(`[HistoryMember] Запущен. UID: ${history.uid()}`)

const admin = new AITaskManagerMember("AIAdmin")
console.log(`[AITaskManagerMember] Запущен. UID: ${admin.uid()}`)

// 4. ПОМЕЩАЕМ ОБОИХ В ОДНУ ОБЩУЮ КОМНАТУ
// Это автоматически настроит всплытие событий (bubbling) между ними

aiChat.strictValidationEvent = true
userChat.strictValidationEvent = true
history.strictValidationEvent = true
admin.strictValidationEvent = true

host.addMember(aiChat)
host.addMember(userChat)
host.addMember(history)
host.addMember(admin)


console.log('\n=== Система готова к работе ===')
console.log('Введите сообщение в консоль и нажмите Enter.')
console.log('InferenceMember должен ответить вам.')
console.log('(Ctrl+C для выхода)\n')