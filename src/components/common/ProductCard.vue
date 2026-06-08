<script setup>
import { computed } from 'vue'
import { formatHundredMillion, formatWon } from '../../utils/formatters'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['invest', 'trade'])

const progress = computed(() => {
  return Math.min(
    100,
    Math.round((props.product.fundedAmount / props.product.targetAmount) * 100),
  )
})
</script>

<template>
  <article class="product-card">
    <div
      class="product-image"
      :class="`asset-${product.categoryKey}`"
      :style="{ backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0), rgba(17, 24, 39, 0.18)), url(${product.imageUrl})` }"
      aria-hidden="true"
    ></div>
    <span class="badge" :class="{ muted: !product.open }">
      {{ product.category }} · {{ product.status }}
    </span>
    <h3>{{ product.name }}</h3>
    <p class="summary">{{ product.summary }}</p>

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

    <dl>
      <div>
        <dt>토큰 단가</dt>
        <dd>{{ formatWon(product.unitPrice) }}</dd>
      </div>
      <div>
        <dt>수익 구조</dt>
        <dd>{{ product.expectedYield }}</dd>
      </div>
      <div>
        <dt>투자 기간</dt>
        <dd>{{ product.subscriptionPeriod }}</dd>
      </div>
    </dl>

    <div class="product-actions">
      <button type="button" class="ghost-button">상세보기</button>
      <button
        type="button"
        class="action-button"
        :class="{ secondary: !product.open }"
        @click="product.open ? emit('invest') : emit('trade')"
      >
        {{ product.action }}
      </button>
    </div>
  </article>
</template>
