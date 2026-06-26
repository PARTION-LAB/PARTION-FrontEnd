<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getProduct } from '../api/products'
import { products as mockProducts } from '../data/products'
import { formatHundredMillion, formatWon } from '../utils/formatters'

const emit = defineEmits(['navigate'])
const route = useRoute()

const product = ref(mockProducts[0])
const message = ref('')
const isLoading = ref(false)

const progress = computed(() => {
  if (!product.value) {
    return 0
  }

  return Math.min(
    100,
    Math.round((product.value.fundedAmount / product.value.targetAmount) * 100),
  )
})

const metricRows = computed(() => {
  if (!product.value) {
    return []
  }

  return [
    ['상품군', product.value.category],
    ['목표 투자금', formatHundredMillion(product.value.targetAmount)],
    ['모집 금액', formatHundredMillion(product.value.fundedAmount)],
    ['달성률', `${progress.value}%`],
    ['토큰 단가', formatWon(product.value.unitPrice)],
    ['예상 수익', product.value.expectedYield],
  ]
})

const detailFacts = computed(() => {
  if (!product.value) {
    return []
  }

  return [
    ['자산 정보', product.value.extraInfo || product.value.category],
    ['권리 구조', product.value.description || product.value.summary],
    ['모집 기한', product.value.subscriptionPeriod],
    ['상품 상태', product.value.statusLabel || product.value.status],
  ]
})

const revenueItems = computed(() => {
  if (!product.value) {
    return []
  }

  if (product.value.category === '음악저작권') {
    return ['플랫폼별 저작권료 정산금을 토큰 보유 비율대로 배분합니다.', '곡 단위 사용량과 정산 추이에 따라 수익이 변동될 수 있습니다.']
  }

  if (product.value.category === '미술품') {
    return ['작품 매각 시 순매각대금을 지분율대로 정산합니다.', '전시 대여 수익이 발생하면 정산 주기에 맞춰 배분합니다.']
  }

  return ['임대료 등 기초자산 수익을 배당 재원으로 사용합니다.', '향후 자산 매각 차익이 발생하면 보유 지분율에 따라 정산합니다.']
})

const highlightItems = computed(() => {
  if (!product.value) {
    return []
  }

  return [
    product.value.category,
    product.value.open ? '투자자 모집중' : '거래 가능 상품',
    product.value.expectedYield,
  ]
})

const riskItems = computed(() => {
  if (!product.value) {
    return []
  }

  if (product.value.category === '음악저작권') {
    return ['곡 인기도와 플랫폼 정책 변화에 따라 정산금이 변동될 수 있습니다.', '과거 저작권료 수익률이 미래 수익을 보장하지 않습니다.']
  }

  if (product.value.category === '미술품') {
    return ['작품 매각 시점과 시장 수요에 따라 회수 기간이 달라질 수 있습니다.', '감정가와 실제 매각가는 차이가 날 수 있습니다.']
  }

  return ['임대율, 공실률, 지역 경기 변동에 따라 수익이 달라질 수 있습니다.', '기초자산 매각 시점과 가격은 보장되지 않습니다.']
})

const documentItems = computed(() => {
  if (!product.value) {
    return []
  }

  return ['상품 등록 신청서', '권리 구조 확인 자료', '수익 산정 근거']
})

const historyItems = computed(() => {
  if (!product.value) {
    return []
  }

  return [
    {
      date: product.value.createdAt ? new Date(product.value.createdAt).toLocaleDateString('ko-KR') : '등록일',
      title: '상품 등록',
      body: `${product.value.name} 상품 정보가 등록되었습니다.`,
    },
    {
      date: product.value.deadline || '모집 기한',
      title: product.value.open ? '투자자 모집 진행' : '거래 가능 상태',
      body: product.value.open
        ? `목표 투자금의 ${progress.value}%가 모집되었습니다.`
        : '모집 완료 또는 거래 가능 상품으로 확인됩니다.',
    },
  ]
})

async function loadProduct() {
  isLoading.value = true
  message.value = ''

  try {
    product.value = await getProduct(route.params.productId)
  } catch (error) {
    message.value = `${error.message || '상품 상세 정보를 불러오지 못했습니다.'} 현재는 예시 데이터로 표시합니다.`
  } finally {
    isLoading.value = false
  }
}

function getProductRouteQuery(nextProduct) {
  const productId = nextProduct.productId ?? nextProduct.id

  if (productId !== undefined && productId !== null && productId !== '') {
    return { productId: String(productId) }
  }

  return nextProduct.symbol ? { symbol: nextProduct.symbol } : {}
}

function goProductAction() {
  if (!product.value) {
    return
  }

  if (product.value.open) {
    emit('navigate', {
      name: 'invest',
      query: getProductRouteQuery(product.value),
    })
    return
  }

  emit('navigate', 'market')
}

onMounted(loadProduct)
</script>

<template>
  <main class="product-detail-page">
    <p v-if="isLoading" class="message">상품 상세 정보를 불러오는 중입니다.</p>
    <p v-else-if="message" class="message">{{ message }}</p>

    <section v-if="product" class="detail-hero">
      <div
        class="detail-asset-photo"
        :class="`asset-${product.categoryKey}`"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0), rgba(17, 24, 39, 0.18)), url(${product.imageUrl})` }"
        aria-hidden="true"
      ></div>
      <div class="detail-hero-copy">
        <span class="badge" :class="{ muted: !product.open }">
          {{ product.category }} · {{ product.statusLabel || product.status }}
        </span>
        <p class="eyebrow">Product Detail</p>
        <h1>{{ product.name }}</h1>
        <p>{{ product.summary }}</p>
        <div class="detail-actions">
          <button
            class="primary-link"
            type="button"
            @click="goProductAction"
          >
            {{ product.action }}
          </button>
          <button class="secondary-link" type="button" @click="emit('navigate', 'products')">
            상품 목록
          </button>
        </div>
      </div>
    </section>

    <section v-if="product" class="detail-metrics" aria-label="상품 주요 지표">
      <article v-for="([label, value]) in metricRows" :key="label" class="detail-metric-card">
        <span>{{ label }}</span>
        <strong>{{ value }}</strong>
        <small>{{ product.name }}</small>
      </article>
    </section>

    <section v-if="product" class="product-detail-layout">
      <div class="product-detail-main">
        <article class="detail-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Overview</p>
              <h2>자산 개요</h2>
            </div>
          </div>
          <p class="detail-copy">{{ product.description || product.summary }}</p>
          <div class="recruitment-meter" aria-label="목표 투자금 달성률">
            <div class="meter-head">
              <span>목표 투자금 달성률</span>
              <strong>{{ progress }}%</strong>
            </div>
            <div class="progress-track">
              <span :style="{ width: `${progress}%` }"></span>
            </div>
            <small>
              {{ formatHundredMillion(product.fundedAmount) }} /
              {{ formatHundredMillion(product.targetAmount) }}
            </small>
          </div>
          <dl class="detail-facts">
            <div v-for="([label, value]) in detailFacts" :key="label">
              <dt>{{ label }}</dt>
              <dd>{{ value }}</dd>
            </div>
          </dl>
        </article>

        <article class="detail-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">History</p>
              <h2>이전 거래·운영 이력</h2>
            </div>
          </div>
          <div class="timeline-list">
            <article v-for="item in historyItems" :key="`${item.date}-${item.title}`" class="timeline-row">
              <span>{{ item.date }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.body }}</p>
            </article>
          </div>
        </article>

        <article class="detail-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Cash Flow</p>
              <h2>수익 구조</h2>
            </div>
          </div>
          <div class="check-list">
            <div v-for="item in revenueItems" :key="item" class="chain-row compact">
              <span>{{ item }}</span>
            </div>
          </div>
        </article>
      </div>

      <aside class="product-detail-side">
        <article class="detail-panel">
          <h2>핵심 확인 포인트</h2>
          <div class="check-list">
            <div v-for="item in highlightItems" :key="item" class="chain-row compact">
              <span>{{ item }}</span>
            </div>
          </div>
        </article>
        <article class="detail-panel">
          <h2>리스크</h2>
          <div class="check-list">
            <div v-for="item in riskItems" :key="item" class="chain-row compact">
              <span>{{ item }}</span>
            </div>
          </div>
        </article>
        <article class="detail-panel">
          <h2>확인 자료</h2>
          <div class="check-list">
            <div v-for="item in documentItems" :key="item" class="chain-row compact">
              <span>{{ item }}</span>
            </div>
          </div>
        </article>
      </aside>
    </section>
  </main>
</template>
