<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatHundredMillion, formatWon } from '../../utils/formatters'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['detail', 'invest', 'trade'])
const titleElement = ref(null)
const meterOffset = ref(0)

const progress = computed(() => {
  return Math.min(
    100,
    Math.round((props.product.fundedAmount / props.product.targetAmount) * 100),
  )
})

const titleLines = computed(() => {
  const name = props.product.name || ''

  if (props.product.symbol === 'BUSAN-PARADISE-HOTEL' && name.endsWith(' 수익증권')) {
    return [name.replace(/ 수익증권$/, ''), '수익증권']
  }

  return [name]
})

const meterOffsetStyle = computed(() => ({
  '--meter-offset': `${meterOffset.value}px`,
}))

function updateMeterOffset() {
  const element = titleElement.value

  if (!element) {
    meterOffset.value = 0
    return
  }

  const style = globalThis.getComputedStyle(element)
  const lineHeight = Number.parseFloat(style.lineHeight)
  const height = element.getBoundingClientRect().height

  if (!lineHeight || !height) {
    meterOffset.value = 0
    return
  }

  const lineCount = Math.max(1, Math.round(height / lineHeight))
  meterOffset.value = Math.max(0, 2 - lineCount) * lineHeight
}

function queueMeterOffsetUpdate() {
  nextTick(() => {
    updateMeterOffset()
  })
}

onMounted(() => {
  queueMeterOffsetUpdate()
  globalThis.addEventListener?.('resize', queueMeterOffsetUpdate)
})

onBeforeUnmount(() => {
  globalThis.removeEventListener?.('resize', queueMeterOffsetUpdate)
})

watch(() => props.product.name, queueMeterOffsetUpdate)
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
      {{ product.category }} · {{ product.statusLabel || product.status }}
    </span>
    <h3 ref="titleElement">
      <template v-for="(line, index) in titleLines" :key="`${line}-${index}`">
        <br v-if="index > 0" />
        {{ line }}
      </template>
    </h3>
    <p class="summary">{{ product.summary }}</p>

    <div class="recruitment-meter" :style="meterOffsetStyle" aria-label="목표 투자금 달성률">
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
      <button type="button" class="ghost-button" @click="emit('detail')">상세보기</button>
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
