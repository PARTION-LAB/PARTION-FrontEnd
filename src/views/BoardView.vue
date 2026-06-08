<script setup>
import { computed, ref } from 'vue'

const categories = ['전체', '공지', '상품토론', '수익인증', '질문', '건의']
const selectedCategory = ref('전체')
const selectedPostId = ref(1)
const isComposeOpen = ref(false)
const composeCategory = ref('상품토론')
const composeTitle = ref('')
const composeBody = ref('')
const composeMessage = ref('로그인 후 게시글을 작성할 수 있습니다.')

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

function submitPost() {
  if (!composeTitle.value.trim() || composeBody.value.trim().length < 10) {
    composeMessage.value = '제목과 10자 이상의 내용을 입력하세요.'
    return
  }

  const newPost = {
    id: Date.now(),
    category: composeCategory.value,
    title: composeTitle.value.trim(),
    body: composeBody.value.trim(),
    authorName: '나',
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: 0,
    pinned: false,
    likedByMe: false,
  }

  posts.value = [newPost, ...posts.value]
  selectedCategory.value = '전체'
  selectedPostId.value = newPost.id
  composeTitle.value = ''
  composeBody.value = ''
  composeMessage.value = '게시글이 임시 등록되었습니다.'
  isComposeOpen.value = false
}
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
        @click="isComposeOpen = true"
      >
        글쓰기
      </button>
    </section>

    <section class="board-layout" :class="{ 'compose-open': isComposeOpen }">
      <aside v-if="isComposeOpen" id="board-compose" class="board-compose">
        <div class="panel-heading">
          <p class="eyebrow">Write</p>
          <h2>새 글 작성</h2>
        </div>
        <p class="message">{{ composeMessage }}</p>
        <form @submit.prevent="submitPost">
          <label>
            카테고리
            <select v-model="composeCategory">
              <option value="상품토론">상품토론</option>
              <option value="수익인증">수익인증</option>
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
            <button
              class="secondary-link"
              type="button"
              @click="isComposeOpen = false"
            >
              취소
            </button>
            <button type="submit">게시하기</button>
          </div>
        </form>

        <div v-if="selectedPost" class="board-preview">
          <p class="eyebrow">Selected</p>
          <strong>{{ selectedPost.title }}</strong>
          <span>{{ selectedPost.category }} · 댓글 {{ selectedPost.comments }}</span>
        </div>
      </aside>

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
              @click="isComposeOpen = true"
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

        <div class="board-list">
          <article
            v-for="post in visiblePosts"
            :key="post.id"
            class="board-post"
            :class="{
              'is-pinned': post.pinned,
              'is-selected': selectedPost?.id === post.id,
            }"
            @click="selectedPostId = post.id"
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
