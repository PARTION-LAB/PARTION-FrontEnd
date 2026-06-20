<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getLedgerBlocks, getLedgerTransactions, verifyLedger } from '../api/ledger'
import { formatWon } from '../utils/formatters'

const refreshedAt = ref(new Date())
const blocks = ref([])
const ledgerEvents = ref([])
const ledgerStatus = ref(null)
const ledgerMessage = ref('')
const isLoading = ref(false)
let ledgerRefreshTimer = null
const LEDGER_REFRESH_INTERVAL_MS = 1000

const recentBlocks = computed(() => blocks.value.slice(0, 8))
const recentEvents = computed(() => ledgerEvents.value.slice(0, 12))
const latestHash = computed(() => ledgerStatus.value?.latestHash || recentBlocks.value[0]?.currentHash || '')
const isLedgerValid = computed(() => ledgerStatus.value?.valid ?? true)
const eventCounts = computed(() => countBy(ledgerEvents.value, 'eventType'))
const assetCounts = computed(() => countBy(ledgerEvents.value, 'productCategory'))
const latestHeight = computed(() => ledgerStatus.value?.height ?? recentBlocks.value[0]?.blockNumber ?? 0)

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const name = item[key] || '기타'
    counts[name] = (counts[name] || 0) + 1
    return counts
  }, {})
}

function shortHash(hash) {
  return hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : '-'
}

function formatDate(value) {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

async function refreshLedger({ silent = false } = {}) {
  if (isLoading.value) {
    return
  }

  isLoading.value = true
  if (!silent) {
    ledgerMessage.value = ''
  }

  try {
    const [blockPage, transactionPage, verifyResult] = await Promise.all([
      getLedgerBlocks({ page: 0, size: 20 }),
      getLedgerTransactions({ page: 0, size: 50 }),
      verifyLedger(),
    ])

    blocks.value = blockPage.content
    ledgerEvents.value = transactionPage.content
    ledgerStatus.value = verifyResult
    refreshedAt.value = new Date()
  } catch (error) {
    ledgerMessage.value = error.message || '원장 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function startLedgerAutoRefresh() {
  if (ledgerRefreshTimer) {
    return
  }

  ledgerRefreshTimer = window.setInterval(() => {
    void refreshLedger({ silent: true })
  }, LEDGER_REFRESH_INTERVAL_MS)
}

function stopLedgerAutoRefresh() {
  if (!ledgerRefreshTimer) {
    return
  }

  window.clearInterval(ledgerRefreshTimer)
  ledgerRefreshTimer = null
}

onMounted(async () => {
  await refreshLedger()
  startLedgerAutoRefresh()
})

onUnmounted(stopLedgerAutoRefresh)
</script>

<template>
  <main class="ledger-page">
    <section class="page-hero ledger-hero">
      <div>
        <p class="eyebrow">On-chain Audit Console</p>
        <h1>STO 토큰화와 거래 기록을 추적하는 블록체인 원장</h1>
        <p>
          자산 토큰화, 결제, 토큰 발행, 주문, 체결 이벤트를 블록 단위로 연결해
          현재 원장의 무결성과 최신 이벤트를 확인합니다.
        </p>
      </div>
      <button
        class="primary-link page-action-link"
        type="button"
        :disabled="isLoading"
        @click="refreshLedger"
      >
        {{ isLoading ? '불러오는 중' : '원장 새로고침' }}
      </button>
    </section>

    <section class="blockchain-dashboard" aria-live="polite">
      <div class="blockchain-summary">
        <article class="chain-metric">
          <span>Blocks</span>
          <strong>{{ blocks.length.toLocaleString('ko-KR') }}</strong>
          <small>Genesis 포함 전체 블록</small>
        </article>
        <article class="chain-metric">
          <span>Events</span>
          <strong>{{ ledgerEvents.length.toLocaleString('ko-KR') }}</strong>
          <small>토큰화·결제·거래 이벤트</small>
        </article>
        <article class="chain-metric">
          <span>Integrity</span>
          <strong :class="{ 'is-valid': isLedgerValid, 'is-invalid': !isLedgerValid }">
            {{ isLedgerValid ? 'VALID' : 'CHECK' }}
          </strong>
          <small>{{ shortHash(latestHash) }}</small>
        </article>
      </div>

      <div class="ledger-state">
        {{ ledgerMessage || ledgerStatus?.message || '공개 원장 흐름을 보고 있습니다.' }}
        마지막 갱신: {{ formatDate(refreshedAt.toISOString()) }}
      </div>

      <section class="chain-panel ledger-flow">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Latest Blocks</p>
            <h2>최근 블록 흐름</h2>
          </div>
          <span class="ledger-pill">height {{ latestHeight.toLocaleString('ko-KR') }}</span>
        </div>
        <div class="chain-node-map">
          <article v-for="block in recentBlocks" :key="block.currentHash" class="chain-node">
            <span>#{{ block.blockNumber }}</span>
            <strong>{{ shortHash(block.currentHash) }}</strong>
            <dl>
              <div>
                <dt>prev</dt>
                <dd>{{ shortHash(block.previousHash) }}</dd>
              </div>
              <div>
                <dt>merkle</dt>
                <dd>{{ shortHash(block.merkleRoot) }}</dd>
              </div>
              <div>
                <dt>time</dt>
                <dd>{{ formatDate(block.createdAt) }}</dd>
              </div>
              <div>
                <dt>events</dt>
                <dd>{{ block.eventCount }}</dd>
              </div>
            </dl>
          </article>
          <article v-if="!recentBlocks.length" class="chain-node">
            <span>#-</span>
            <strong>아직 생성된 블록이 없습니다.</strong>
          </article>
        </div>
      </section>

      <div class="ledger-layout">
        <section class="chain-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Event Stream</p>
              <h2>최근 이벤트</h2>
            </div>
          </div>
          <div class="chain-list">
            <div
              v-for="event in recentEvents"
              :key="event.transactionHash || event.id"
              class="chain-row event-row"
            >
              <span>{{ event.eventType }} · {{ event.productName }}</span>
              <strong>{{ shortHash(event.transactionHash) }}</strong>
              <small>
                {{ formatDate(event.occurredAt) }} ·
                {{ event.quantity.toLocaleString('ko-KR') }} token ·
                {{ formatWon(event.amount) }}
              </small>
            </div>
            <div v-if="!recentEvents.length" class="chain-row event-row">
              <span>NO_EVENTS</span>
              <strong>체결 원장 이벤트가 아직 없습니다.</strong>
              <small>매칭엔진에서 체결이 발생하면 이곳에 기록됩니다.</small>
            </div>
          </div>
        </section>

        <aside class="ledger-side">
          <section class="chain-panel">
            <h2>자산별 기록</h2>
            <div class="chain-list">
              <div
                v-for="([name, count]) in Object.entries(assetCounts)"
                :key="name"
                class="chain-row compact"
              >
                <span>{{ name }}</span>
                <strong>{{ count.toLocaleString('ko-KR') }} records</strong>
              </div>
            </div>
          </section>

          <section class="chain-panel">
            <h2>이벤트 타입</h2>
            <div class="chain-list">
              <div
                v-for="([name, count]) in Object.entries(eventCounts)"
                :key="name"
                class="chain-row compact"
              >
                <span>{{ name }}</span>
                <strong>{{ count.toLocaleString('ko-KR') }} events</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>
