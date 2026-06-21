<script setup>
import { computed, nextTick, ref } from 'vue'
import { sendAiChatMessage } from '../api/ai'

const props = defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['navigate'])

const isOpen = ref(false)
const draft = ref('')
const isSending = ref(false)
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: 'Partion 서비스 이용 방법이나 STO 기본 개념이 궁금하면 물어보세요.',
  },
])
const messageList = ref(null)

const canSubmit = computed(() => props.isAuthenticated && draft.value.trim() && !isSending.value)

function scrollToBottom() {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

function toggleWidget() {
  isOpen.value = !isOpen.value
  scrollToBottom()
}

function goToLogin() {
  isOpen.value = false
  emit('navigate', 'login')
}

async function submitMessage() {
  if (!canSubmit.value) {
    return
  }

  const message = draft.value.trim()
  draft.value = ''
  messages.value.push({
    id: Date.now(),
    role: 'user',
    text: message,
  })
  isSending.value = true
  scrollToBottom()

  try {
    const data = await sendAiChatMessage({ message })
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: data?.answer || '답변을 불러왔지만 표시할 내용이 없습니다.',
    })
  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: error.message || 'AI 가이드 답변을 불러오지 못했습니다.',
      tone: 'error',
    })
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <aside class="ai-chat-widget" :class="{ open: isOpen }" aria-label="AI 가이드">
    <section v-if="isOpen" class="ai-chat-panel">
      <header class="ai-chat-header">
        <div>
          <strong>AI 가이드</strong>
          <span>Partion 사용법과 STO 안내</span>
        </div>
        <button type="button" aria-label="AI 가이드 닫기" @click="toggleWidget">×</button>
      </header>

      <div ref="messageList" class="ai-chat-messages" aria-live="polite">
        <p
          v-for="message in messages"
          :key="message.id"
          class="ai-chat-message"
          :class="[message.role, message.tone]"
        >
          {{ message.text }}
        </p>
        <p v-if="isSending" class="ai-chat-message assistant pending">답변을 준비하고 있어요.</p>
      </div>

      <form v-if="isAuthenticated" class="ai-chat-form" @submit.prevent="submitMessage">
        <input
          v-model="draft"
          type="text"
          maxlength="500"
          placeholder="궁금한 내용을 입력하세요"
          aria-label="AI 가이드 질문"
        />
        <button type="submit" :disabled="!canSubmit" aria-label="질문 보내기">↗</button>
      </form>

      <div v-else class="ai-chat-login">
        <p>로그인 후 AI 가이드를 이용할 수 있어요.</p>
        <button type="button" @click="goToLogin">로그인</button>
      </div>
    </section>

    <button
      type="button"
      class="ai-chat-toggle"
      :aria-expanded="isOpen"
      aria-label="AI 가이드 열기"
      @click="toggleWidget"
    >
      AI
    </button>
  </aside>
</template>
