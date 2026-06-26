<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createComment, deleteBoard, deleteComment, getBoard, getBoardComments } from '../api/boards'
import { useAuth } from '../composables/useAuth'

const apiCategoryToDisplayCategory = {
  NOTICE: '공지',
  QUESTION: '질문',
  FREE: '상품토론',
}

const route = useRoute()
const router = useRouter()
const { isAuthenticated, user } = useAuth()

const board = ref(null)
const comments = ref([])
const commentBody = ref('')
const message = ref('')
const isLoading = ref(false)
const isSubmittingComment = ref(false)

const boardId = computed(() => route.params.boardId)
const canDeletePost = computed(() => {
  return Boolean(
    board.value
    && user.value
    && board.value.memberId
    && (board.value.memberId === user.value.id || user.value.role === 'ROLE_ADMIN'),
  )
})

function categoryLabel(category) {
  return apiCategoryToDisplayCategory[category] || category || '게시글'
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function writerName(item) {
  return item?.writerNickname || item?.authorName || `회원 ${item?.memberId || '-'}`
}

async function loadDetail() {
  isLoading.value = true
  message.value = ''

  try {
    const [nextBoard, nextComments] = await Promise.all([
      getBoard(boardId.value),
      getBoardComments(boardId.value),
    ])
    board.value = nextBoard
    comments.value = nextComments.content
  } catch (error) {
    message.value = error.message || '게시글을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteBoard() {
  if (!canDeletePost.value || !window.confirm('게시글을 삭제할까요?')) {
    return
  }

  try {
    await deleteBoard(boardId.value)
    router.push('/board')
  } catch (error) {
    message.value = error.message || '게시글을 삭제하지 못했습니다.'
  }
}

async function submitComment() {
  if (!isAuthenticated.value) {
    message.value = '로그인 후 댓글을 작성할 수 있습니다.'
    return
  }

  if (!commentBody.value.trim()) {
    message.value = '댓글 내용을 입력해주세요.'
    return
  }

  isSubmittingComment.value = true
  message.value = '댓글을 등록하는 중입니다.'

  try {
    await createComment(boardId.value, { content: commentBody.value.trim() })
    commentBody.value = ''
    await loadDetail()
    message.value = '댓글이 등록되었습니다.'
  } catch (error) {
    message.value = error.message || '댓글을 등록하지 못했습니다.'
  } finally {
    isSubmittingComment.value = false
  }
}

function canDeleteComment(comment) {
  return Boolean(user.value && comment?.memberId && (comment.memberId === user.value.id || user.value.role === 'ROLE_ADMIN'))
}

async function handleDeleteComment(comment) {
  if (!canDeleteComment(comment) || !window.confirm('댓글을 삭제할까요?')) {
    return
  }

  try {
    await deleteComment(comment.commentId)
    comments.value = comments.value.filter((item) => item.commentId !== comment.commentId)
    message.value = '댓글이 삭제되었습니다.'
  } catch (error) {
    message.value = error.message || '댓글을 삭제하지 못했습니다.'
  }
}

onMounted(loadDetail)
</script>

<template>
  <main class="board-page board-detail-page">
    <section class="page-hero board-hero">
      <div>
        <p class="eyebrow">Community</p>
        <h1>게시글 상세</h1>
        <p>게시글 내용과 댓글을 확인하고 의견을 남길 수 있습니다.</p>
      </div>
      <button
        class="primary-link page-action-link"
        type="button"
        @click="router.push('/board')"
      >
        목록으로
      </button>
    </section>

    <section class="board-detail-layout">
      <article class="board-detail-panel">
        <p v-if="isLoading" class="message">게시글을 불러오는 중입니다.</p>
        <p v-else-if="message" class="message">{{ message }}</p>

        <template v-if="board">
          <div class="board-detail-title">
            <p class="board-post-meta">
              {{ categoryLabel(board.category) }} · {{ writerName(board) }} · {{ formatDate(board.createdAt) }}
            </p>
            <h2>{{ board.title }}</h2>
          </div>
          <p class="board-detail-body">{{ board.content }}</p>
          <div v-if="canDeletePost" class="board-detail-actions">
            <button class="secondary-link danger" type="button" @click="handleDeleteBoard">
              삭제
            </button>
          </div>
        </template>
      </article>

      <section class="board-comments-panel">
        <div class="panel-heading board-feed-heading">
          <div>
            <p class="eyebrow">Comments</p>
            <h2>댓글 {{ comments.length.toLocaleString('ko-KR') }}개</h2>
          </div>
        </div>

        <form class="board-comment-form" @submit.prevent="submitComment">
          <textarea
            v-model="commentBody"
            rows="4"
            placeholder="댓글을 입력하세요"
            :disabled="isSubmittingComment"
          ></textarea>
          <button type="submit" :disabled="isSubmittingComment">
            {{ isSubmittingComment ? '등록 중...' : '댓글 작성' }}
          </button>
        </form>

        <div class="board-comment-list">
          <article
            v-for="comment in comments"
            :key="comment.commentId"
            class="board-comment"
          >
            <div class="board-comment-meta">
              <strong>{{ writerName(comment) }}</strong>
              <span>{{ formatDate(comment.createdAt) }}</span>
            </div>
            <p>{{ comment.content }}</p>
            <button
              v-if="canDeleteComment(comment)"
              class="secondary-link danger"
              type="button"
              @click="handleDeleteComment(comment)"
            >
              삭제
            </button>
          </article>
          <p v-if="!comments.length" class="message">아직 댓글이 없습니다.</p>
        </div>
      </section>
    </section>
  </main>
</template>
