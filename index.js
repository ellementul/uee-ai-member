import { MemberFactory } from '@ellementul/uee-core'
import { InferenceMember } from './src/InferenceMember/index.js'
import { ChatMember } from './src/ChatMember/index.js'
import { HistoryMember } from './src/HistoryMember/index.js'


console.log('--- Инициализация системы ---')

const host = new MemberFactory("HostRoom")
host.makeRoom()
console.log(`[Host] Комната создана. UID: ${host.uid()}`)

const userChat = new ChatMember("UserChat")
console.log(`[UserChat] Запущен. UID: ${userChat.uid()}`)

const aiChat = new InferenceMember("InferenceMember")
console.log(`[InferenceMember] Запущен. UID: ${aiChat.uid()}`)

const history = new HistoryMember("HistoryMember") // <-- Создание
console.log(`[HistoryMember] Запущен. UID: ${history.uid()}`)

// 4. ПОМЕЩАЕМ ОБОИХ В ОДНУ ОБЩУЮ КОМНАТУ
// Это автоматически настроит всплытие событий (bubbling) между ними

aiChat.strictValidationEvent = true
userChat.strictValidationEvent = true
history.strictValidationEvent = true

host.addMember(aiChat)
host.addMember(userChat)
host.addMember(history)


console.log('\n=== Система готова к работе ===')
console.log('Введите сообщение в консоль и нажмите Enter.')
console.log('InferenceMember должен ответить вам.')
console.log('(Ctrl+C для выхода)\n')