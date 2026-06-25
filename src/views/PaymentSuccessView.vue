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
const paymentReturnPathStorageKey = 'partionPaymentReturnPath'
const returnPath = ref('/invest')

const paymentKey = computed(() => String(route.query.paymentKey || ''))
const orderId = computed(() => String(route.query.orderId || ''))
const amount = computed(() => Number(route.query.amount || 0))
const returnTarget = computed(() => returnPath.value)

function getInvestmentSuccessMessage(result) {
  const investedQuantity = Number(result?.investedQuantity ?? result?.quantity ?? 0)
  const unfilledQuantity = Number(result?.unfilledQuantity ?? 0)
  const leftoverAmount = Number(result?.leftoverAmount ?? 0)

  if (investedQuantity <= 0 && unfilledQuantity > 0) {
    return `투자는 진행되지 않았고 ${formatWon(leftoverAmount)}은 예치금으로 보관됩니다.`
  }

  if (unfilledQuantity > 0) {
    return `${investedQuantity}토큰만 투자되었습니다. 남은 ${unfilledQuantity}토큰에 해당하는 ${formatWon(leftoverAmount)}은 예치금으로 보관됩니다.`
  }

  return '예치금 충전 후 투자가 완료되었습니다.'
}

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

function normalizeReturnPath(value) {
  const path = String(value || '')

  return path.startsWith('/') && !path.startsWith('//') ? path : '/invest'
}

function getPaymentReturnPath(pendingInvestment) {
  return normalizeReturnPath(
    route.query.returnTo ||
      globalThis.sessionStorage.getItem(paymentReturnPathStorageKey) ||
      pendingInvestment?.returnPath,
  )
}

onMounted(async () => {
  const pendingInvestment = getPendingInvestment()
  returnPath.value = getPaymentReturnPath(pendingInvestment)

  try {
    await confirmDepositPayment({
      paymentKey: paymentKey.value,
      orderId: orderId.value,
      amount: amount.value,
    })

    if (pendingInvestment?.productId && pendingInvestment?.quantity) {
      try {
        investment.value = await createInvestment({
          productId: pendingInvestment.productId,
          quantity: pendingInvestment.quantity,
        })
        globalThis.sessionStorage.removeItem(pendingInvestmentStorageKey)
      } catch (investmentError) {
        status.value = 'success'
        message.value = `예치금 충전은 완료되었습니다. ${investmentError.message || '투자는 처리하지 못했으며 충전 금액은 예치금으로 보관됩니다.'}`
        return
      }
    }

    status.value = 'success'
    message.value = investment.value
      ? getInvestmentSuccessMessage(investment.value)
      : '예치금 충전이 완료되었습니다.'
    globalThis.sessionStorage.removeItem(paymentReturnPathStorageKey)
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

      <div class="payment-result-actions">
        <RouterLink class="primary-link" :to="returnTarget">결제 요청 화면으로 돌아가기</RouterLink>
        <RouterLink class="secondary-link" :to="{ name: 'profile' }">내 투자 내역 보기</RouterLink>
      </div>
    </section>
  </main>
</template>
