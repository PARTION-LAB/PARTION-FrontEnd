<script setup>
import { computed, ref } from 'vue'
import ProductCard from '../components/common/ProductCard.vue'
import { products } from '../data/products'

const emit = defineEmits(['navigate'])
const selectedCategory = ref('전체')
const categories = ['전체', '부동산', '미술품', '음악저작권']

const visibleProducts = computed(() => {
  if (selectedCategory.value === '전체') {
    return products
  }

  return products.filter((product) => product.category === selectedCategory.value)
})

function countByCategory(category) {
  if (category === '전체') {
    return products.length
  }

  return products.filter((product) => product.category === category).length
}
</script>

<template>
  <main>
    <section class="hero-section">
      <div class="hero-copy">
        <p class="eyebrow">Partion STO</p>
        <h1>부동산, 미술품, 음악저작권을 토큰으로 간편하게 투자하세요</h1>
        <p>
          모집 중인 부동산·미술품 상품은 투자하고, 개별 곡 저작권 상품은
          바로 거래하기에서 매수·매도할 수 있습니다.
        </p>
        <button type="button" class="primary-link" @click="emit('navigate', 'invest')">
          모집 중 상품 투자하기
        </button>
      </div>
    </section>

    <section class="offering">
      <div class="section-heading">
        <div>
          <p class="eyebrow">투자 상품 리스트</p>
          <h2>목표 투자금 달성률로 보는 STO 상품</h2>
        </div>
        <div class="section-actions">
          <button type="button" class="secondary-link">매각 투표</button>
          <button type="button" class="secondary-link" @click="emit('navigate', 'register')">
            상품 등록하기
          </button>
        </div>
      </div>

      <div class="filter-tabs" role="tablist" aria-label="상품군 필터">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          role="tab"
          :aria-selected="selectedCategory === category"
          :class="{ selected: selectedCategory === category }"
          @click="selectedCategory = category"
        >
          {{ category }} {{ countByCategory(category) }}
        </button>
      </div>

      <div class="product-grid" aria-label="투자 상품 목록">
        <ProductCard
          v-for="product in visibleProducts"
          :key="product.symbol"
          :product="product"
          @invest="emit('navigate', 'invest')"
          @trade="emit('navigate', 'market')"
        />
      </div>
    </section>
  </main>
</template>
