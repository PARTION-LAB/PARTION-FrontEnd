<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getBoard, getBoardComments, getBoards } from '../api/boards'

const categories = ['전체', '공지', '상품토론', '수익인증', '질문', '건의']
const apiCategoryToDisplayCategory = {
  NOTICE: '공지',
  QUESTION: '질문',
  FREE: '상품토론',
}
const router = useRouter()
const selectedCategory = ref('전체')
const selectedPostId = ref(1)
const isLoadingPosts = ref(false)
const loadMessage = ref('')

const posts = ref([
  {
    id: 1,
    category: '공지',
    title: '6월 모집 상품 투자 유의사항 안내',
    body: '부동산과 미술품 모집 상품은 모집 마감 전까지 청약 취소가 가능하며, 모집률 100% 달성 이후에는 거래 페이지에서 매수·매도 주문을 제출할 수 있습니다.',
    authorName: 'Partion 운영팀',
    createdAt: '2026-06-08T09:30:00+09:00',
    likes: 128,
    comments: 14,
    pinned: true,
    likedByMe: false,
  },
  {
    id: 2,
    category: '상품토론',
    title: '서울역 커넥트 리테일 2호 상권 회복률 어떻게 보시나요?',
    body: '환승 상권이라는 점은 좋지만 평일과 주말 매출 편차가 클 것 같아서 고민 중입니다. 비슷한 리테일 STO 투자 경험 있으신 분 의견 궁금합니다.',
    authorName: 'wildyoung',
    createdAt: '2026-06-08T12:12:00+09:00',
    likes: 43,
    comments: 9,
    pinned: false,
    likedByMe: true,
  },
  {
    id: 3,
    category: '수익인증',
    title: '밤하늘의 파도 저작권 월 정산 들어왔습니다',
    body: '소액으로 담아둔 음악저작권 상품인데 이번 달 정산이 예상치와 비슷하게 들어왔습니다. 거래량이 조금 더 붙으면 가격도 안정될 것 같아요.',
    authorName: '서린',
    createdAt: '2026-06-07T20:44:00+09:00',
    likes: 87,
    comments: 21,
    pinned: false,
    likedByMe: false,
  },
  {
    id: 4,
    category: '질문',
    title: '미술품 상품은 매각 투표가 언제 열리나요?',
    body: '아트브릿지 컬렉션을 보고 있는데 매각 조건이나 투표 시점이 상품마다 다른지 궁금합니다.',
    authorName: '민준',
    createdAt: '2026-06-07T16:05:00+09:00',
    likes: 18,
    comments: 6,
    pinned: false,
    likedByMe: false,
  },
  {
    id: 5,
    category: '건의',
    title: '거래 페이지에 호가 알림 기능이 있으면 좋겠습니다',
    body: '관심 가격에 도달하면 알림을 받을 수 있으면 음악저작권 상품 거래할 때 훨씬 편할 것 같습니다.',
    authorName: 'northbridge',
    createdAt: '2026-06-06T10:28:00+09:00',
    likes: 31,
    comments: 4,
    pinned: false,
    likedByMe: false,
  },
])

function createFallbackMetrics(id) {
  const numericId = Number(id) || 1

  return {
    likes: 12 + (numericId * 17) % 92,
    pinned: numericId === 1,
    likedByMe: false,
  }
}

async function normalizeBoardPost(board) {
  const id = board.boardId ?? board.id
  const fallback = createFallbackMetrics(id)
  let detail
  let commentCount

  try {
    detail = await getBoard(id)
  } catch {
    detail = board
  }

  try {
    const commentsPage = await getBoardComments(id)
    commentCount = commentsPage.totalElements
  } catch {
    commentCount = 0
  }

  return {
    id,
    category: apiCategoryToDisplayCategory[detail.category || board.category] || '상품토론',
    title: detail.title || board.title,
    body: detail.content || board.content || '게시글 상세 내용을 불러오는 중입니다.',
    authorName: detail.writerNickname || board.writerNickname || `회원 ${detail.memberId || board.memberId || '-'}`,
    memberId: detail.memberId || board.memberId,
    createdAt: detail.createdAt || board.createdAt || new Date().toISOString(),
    likes: fallback.likes,
    comments: commentCount,
    pinned: fallback.pinned,
    likedByMe: fallback.likedByMe,
  }
}

const visiblePosts = computed(() => {
  if (selectedCategory.value === '전체') {
    return posts.value
  }

  return posts.value.filter((post) => post.category === selectedCategory.value)
})

const selectedPost = computed(() => {
  return posts.value.find((post) => post.id === selectedPostId.value) || visiblePosts.value[0]
})

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function categoryCount(category) {
  if (category === '전체') {
    return posts.value.length
  }

  return posts.value.filter((post) => post.category === category).length
}

function selectCategory(category) {
  selectedCategory.value = category
  selectedPostId.value = visiblePosts.value[0]?.id || selectedPostId.value
}

function toggleLike(post) {
  post.likedByMe = !post.likedByMe
  post.likes += post.likedByMe ? 1 : -1
}

function goWritePage() {
  router.push('/board/write')
}

function goDetailPage(postId) {
  selectedPostId.value = postId
  router.push(`/board/${postId}`)
}

async function loadPosts() {
  isLoadingPosts.value = true
  loadMessage.value = ''

  try {
    const boardsPage = await getBoards({ page: 0, size: 20 })
    const apiPosts = await Promise.all(boardsPage.content.map(normalizeBoardPost))

    if (apiPosts.length) {
      posts.value = apiPosts
      selectedPostId.value = apiPosts[0].id
    }
  } catch (error) {
    loadMessage.value = `${error.message || '게시글 API를 불러오지 못했습니다.'} 현재는 예시 데이터로 표시합니다.`
  } finally {
    isLoadingPosts.value = false
  }
}

onMounted(loadPosts)
</script>

<template>
  <main class="board-page">
    <section class="page-hero board-hero">
      <div>
        <p class="eyebrow">Community</p>
        <h1>상품 공지와 투자자 의견을 모아보는 게시판</h1>
        <p>상품 토론, 수익 인증, 질문, 건의를 한 화면에서 확인할 수 있습니다.</p>
      </div>
      <button
        class="primary-link page-action-link"
        type="button"
        @click="goWritePage"
      >
        글쓰기
      </button>
    </section>

    <section class="board-layout">
      <section class="board-feed">
        <div class="panel-heading board-feed-heading">
          <div>
            <p class="eyebrow">Board Feed</p>
            <h2>전체 게시글</h2>
          </div>
          <div class="board-feed-actions">
            <strong>{{ visiblePosts.length.toLocaleString('ko-KR') }}개</strong>
            <button
              class="secondary-link"
              type="button"
              @click="goWritePage"
            >
              새 글 작성
            </button>
          </div>
        </div>

        <div class="filter-tabs" role="tablist" aria-label="게시글 필터">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            role="tab"
            :aria-selected="selectedCategory === category"
            :class="{ selected: selectedCategory === category }"
            @click="selectCategory(category)"
          >
            {{ category }} {{ categoryCount(category) }}
          </button>
        </div>

        <p v-if="isLoadingPosts" class="message">게시글을 불러오는 중입니다.</p>
        <p v-else-if="loadMessage" class="message">{{ loadMessage }}</p>

        <div class="board-list">
          <article
            v-for="post in visiblePosts"
            :key="post.id"
            class="board-post"
            :class="{
              'is-pinned': post.pinned,
              'is-selected': selectedPost?.id === post.id,
            }"
            @click="goDetailPage(post.id)"
          >
            <div class="board-post-meta">
              {{ post.category }} · {{ post.authorName }} · {{ formatDate(post.createdAt) }}
            </div>
            <h3>{{ post.title }}</h3>
            <p>{{ post.body }}</p>
            <div class="board-post-actions">
              <button
                type="button"
                :class="{ selected: post.likedByMe }"
                @click.stop="toggleLike(post)"
              >
                좋아요 {{ post.likes.toLocaleString('ko-KR') }}
              </button>
              <span>댓글 {{ post.comments }}</span>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
