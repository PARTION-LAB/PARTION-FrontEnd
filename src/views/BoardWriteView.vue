<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createBoard } from '../api/boards'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isAuthenticated } = useAuth()
const displayCategoryToApiCategory = {
  상품토론: 'FREE',
  질문: 'QUESTION',
  건의: 'FREE',
}

const composeCategory = ref('상품토론')
const composeTitle = ref('')
const composeBody = ref('')
const composeMessage = ref('')
const isSubmitting = ref(false)
const visibleMessage = computed(() => {
  if (composeMessage.value) {
    return composeMessage.value
  }

  return isAuthenticated.value ? '' : '로그인 후 게시글을 작성할 수 있습니다.'
})

watch(isAuthenticated, () => {
  if (isAuthenticated.value && composeMessage.value === '로그인 후 게시글을 작성할 수 있습니다.') {
    composeMessage.value = ''
  }
})

function validateForm() {
  if (!isAuthenticated.value) {
    return '로그인 후 게시글을 작성할 수 있습니다.'
  }

  if (!composeTitle.value.trim() || composeBody.value.trim().length < 10) {
    return '제목과 10자 이상의 내용을 입력하세요.'
  }

  return ''
}

async function submitPost() {
  const validationMessage = validateForm()

  if (validationMessage) {
    composeMessage.value = validationMessage
    return
  }

  isSubmitting.value = true
  composeMessage.value = '게시글을 등록하는 중입니다.'

  try {
    await createBoard({
      category: displayCategoryToApiCategory[composeCategory.value] || 'FREE',
      title: composeTitle.value.trim(),
      content: composeBody.value.trim(),
    })
    router.push('/board')
  } catch (error) {
    composeMessage.value = error.message || '게시글을 등록하지 못했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

function cancelWrite() {
  router.push('/board')
}
</script>

<template>
  <main class="board-page">
    <section class="page-hero board-hero">
      <div>
        <p class="eyebrow">Write</p>
        <h1>새 게시글 작성</h1>
        <p>상품 토론, 질문, 건의를 게시판에 공유할 수 있습니다.</p>
      </div>
    </section>

    <section class="board-write-layout">
      <article id="board-compose" class="board-compose">
        <div class="panel-heading">
          <p class="eyebrow">Board Post</p>
          <h2>게시글 정보</h2>
        </div>
        <p v-if="visibleMessage" class="message">{{ visibleMessage }}</p>
        <form @submit.prevent="submitPost">
          <label>
            카테고리
            <select v-model="composeCategory">
              <option value="상품토론">상품토론</option>
              <option value="질문">질문</option>
              <option value="건의">건의</option>
            </select>
          </label>
          <label>
            제목
            <input
              v-model="composeTitle"
              maxlength="80"
              placeholder="상품이나 거래 경험을 적어주세요"
              type="text"
            />
          </label>
          <label>
            내용
            <textarea
              v-model="composeBody"
              maxlength="1000"
              placeholder="10자 이상 입력하세요"
              rows="10"
            ></textarea>
          </label>
          <div class="form-actions">
            <button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? '게시 중...' : '게시하기' }}
            </button>
            <button
              class="secondary-link"
              type="button"
              :disabled="isSubmitting"
              @click="cancelWrite"
            >
              취소
            </button>
          </div>
        </form>
      </article>
    </section>
  </main>
</template>
