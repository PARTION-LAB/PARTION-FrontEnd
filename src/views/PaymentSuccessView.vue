<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createInvestment } from '../api/investments'
import { confirmDepositPayment } from '../api/payments'
import { formatWon } from '../utils/formatters'

const route = useRoute()
const status = ref('pending')
const message = ref('결제 승인 정보를 확인하고 있습니다.')
const investment = ref(null)
const pendingInvestmentStorageKey = 'partionPendingInvestmentOrder'

const paymentKey = computed(() => String(route.query.paymentKey || ''))
const orderId = computed(() => String(route.query.orderId || ''))
const amount = computed(() => Number(route.query.amount || 0))

function getPendingInvestment() {
  const saved = globalThis.sessionStorage.getItem(pendingInvestmentStorageKey)

  if (!saved) {
    return null
  }

  try {
    return JSON.parse(saved)
  } catch {
    globalThis.sessionStorage.removeItem(pendingInvestmentStorageKey)
    return null
  }
}

onMounted(async () => {
  try {
    const pendingInvestment = getPendingInvestment()
    await confirmDepositPayment({
      paymentKey: paymentKey.value,
      orderId: orderId.value,
      amount: amount.value,
    })

    if (pendingInvestment?.productId && pendingInvestment?.quantity) {
      investment.value = await createInvestment({
        productId: pendingInvestment.productId,
        quantity: pendingInvestment.quantity,
      })
      globalThis.sessionStorage.removeItem(pendingInvestmentStorageKey)
    }

    status.value = 'success'
    message.value = investment.value
      ? '예치금 충전 후 투자가 완료되었습니다.'
      : '예치금 충전이 완료되었습니다.'
  } catch (error) {
    status.value = 'error'
    message.value = error.message || '결제 승인 처리에 실패했습니다.'
  }
})
</script>

<template>
  <main class="payment-result-page">
    <section class="payment-result-panel">
      <p class="eyebrow">Payment</p>
      <h1>{{ status === 'success' ? '결제 완료' : '결제 확인 중' }}</h1>
      <p>{{ message }}</p>

      <dl class="order-summary">
        <div>
          <dt>주문 번호</dt>
          <dd>{{ orderId || '-' }}</dd>
        </div>
        <div>
          <dt>결제 금액</dt>
          <dd>
            <strong>{{ formatWon(amount) }}</strong>
          </dd>
        </div>
        <div v-if="investment">
          <dt>투자 수량</dt>
          <dd>{{ investment.quantity }}토큰</dd>
        </div>
      </dl>

      <RouterLink class="secondary-link" :to="{ name: 'profile' }">내 투자 내역 보기</RouterLink>
    </section>
  </main>
</template>
