<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { getLedgerBlock, getLedgerBlocks, getLedgerTransactions, verifyLedger } from '../api/ledger'
import { formatWon } from '../utils/formatters'

const refreshedAt = ref(new Date())
const blocks = ref([])
const blockTotalElements = ref(0)
const selectedBlock = ref(null)
const blockSearchValue = ref('')
const blockLookupMessage = ref('')
const ledgerEvents = ref([])
const eventTotalElements = ref(0)
const eventPage = ref(0)
const hasMoreEvents = ref(false)
const ledgerStatus = ref(null)
const ledgerMessage = ref('')
const isLoading = ref(false)
const isLoadingBlock = ref(false)
const isLoadingMoreEvents = ref(false)
const eventListRef = ref(null)
const eventLoadTriggerRef = ref(null)
let ledgerRefreshTimer = null
let eventLoadObserver = null
const LEDGER_REFRESH_INTERVAL_MS = 1000
const LEDGER_EVENT_PAGE_SIZE = 12

const recentBlocks = computed(() => blocks.value.slice(0, 8))
const recentEvents = computed(() => ledgerEvents.value)
const blockMetricCount = computed(() => blockTotalElements.value || blocks.value.length)
const eventMetricCount = computed(() => eventTotalElements.value || ledgerEvents.value.length)
const latestHash = computed(() => ledgerStatus.value?.latestHash || recentBlocks.value[0]?.currentHash || '')
const isLedgerValid = computed(() => ledgerStatus.value?.valid ?? true)
const assetCounts = computed(() => countBy(ledgerEvents.value, 'productCategory'))
const selectedBlockEvents = computed(() => selectedBlock.value?.transactions || [])

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

function eventKey(event) {
  return event.transactionHash || event.id || `${event.eventType}-${event.referenceId}`
}

function mergeEvents(currentEvents, nextEvents) {
  const seen = new Set(currentEvents.map(eventKey))
  const merged = [...currentEvents]

  nextEvents.forEach((event) => {
    const key = eventKey(event)

    if (!seen.has(key)) {
      seen.add(key)
      merged.push(event)
    }
  })

  return merged
}

function applyEventPage(pageData, { append = false } = {}) {
  ledgerEvents.value = append
    ? mergeEvents(ledgerEvents.value, pageData.content)
    : pageData.content
  eventPage.value = pageData.page
  hasMoreEvents.value = pageData.hasNext
  eventTotalElements.value = pageData.totalElements
  scheduleEventLoadObserver()
}

function syncSelectedBlock(nextBlocks) {
  if (!nextBlocks.length) {
    return
  }

  if (!selectedBlock.value) {
    selectedBlock.value = nextBlocks[0]
    blockSearchValue.value = String(nextBlocks[0].blockNumber)
    return
  }

  const matchingBlock = nextBlocks.find(
    (block) => block.blockNumber === selectedBlock.value.blockNumber,
  )

  if (matchingBlock) {
    selectedBlock.value = matchingBlock
  }
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
    const shouldRefreshEvents = eventPage.value === 0 && !isLoadingMoreEvents.value
    const eventPageRequest = shouldRefreshEvents
      ? getLedgerTransactions({ page: 0, size: LEDGER_EVENT_PAGE_SIZE })
      : Promise.resolve(null)
    const [blockPage, transactionPage, verifyResult] = await Promise.all([
      getLedgerBlocks({ page: 0, size: 20 }),
      eventPageRequest,
      verifyLedger(),
    ])

    blocks.value = blockPage.content
    blockTotalElements.value = blockPage.totalElements
    syncSelectedBlock(blockPage.content)
    if (transactionPage) {
      applyEventPage(transactionPage)
    }
    ledgerStatus.value = verifyResult
    refreshedAt.value = new Date()
  } catch (error) {
    ledgerMessage.value = error.message || '원장 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function loadBlock(blockNumber) {
  const normalizedBlockNumber = Number(blockNumber)

  if (!Number.isInteger(normalizedBlockNumber) || normalizedBlockNumber < 0) {
    blockLookupMessage.value = '조회할 블록 번호를 입력해주세요.'
    return
  }

  isLoadingBlock.value = true
  blockLookupMessage.value = ''

  try {
    selectedBlock.value = await getLedgerBlock(normalizedBlockNumber)
    blockSearchValue.value = String(selectedBlock.value.blockNumber)
    blockLookupMessage.value = `#${selectedBlock.value.blockNumber} 블록을 조회했습니다.`
  } catch (error) {
    blockLookupMessage.value = error.status === 404
      ? '해당 번호의 블록을 찾을 수 없습니다.'
      : error.message || '블록 조회에 실패했습니다.'
  } finally {
    isLoadingBlock.value = false
  }
}

function handleBlockSearch() {
  void loadBlock(blockSearchValue.value)
}

function selectBlock(block) {
  blockSearchValue.value = String(block.blockNumber)
  void loadBlock(block.blockNumber)
}

function isSelectedBlock(block) {
  return selectedBlock.value?.blockNumber === block.blockNumber
}

async function loadMoreEvents() {
  if (isLoadingMoreEvents.value || !hasMoreEvents.value) {
    return
  }

  isLoadingMoreEvents.value = true

  try {
    const nextPage = await getLedgerTransactions({
      page: eventPage.value + 1,
      size: LEDGER_EVENT_PAGE_SIZE,
    })

    applyEventPage(nextPage, { append: true })
  } catch (error) {
    ledgerMessage.value = error.message || '추가 원장 이벤트를 불러오지 못했습니다.'
  } finally {
    isLoadingMoreEvents.value = false
  }
}

function handleEventListScroll(event) {
  const target = event.currentTarget
  const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight

  if (distanceToBottom < 90) {
    void loadMoreEvents()
  }
}

function setupEventLoadObserver() {
  if (eventLoadObserver) {
    eventLoadObserver.disconnect()
    eventLoadObserver = null
  }

  if (!hasMoreEvents.value || !eventListRef.value || !eventLoadTriggerRef.value) {
    return
  }

  if (!globalThis.IntersectionObserver) {
    return
  }

  eventLoadObserver = new globalThis.IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      void loadMoreEvents()
    }
  }, {
    root: eventListRef.value,
    rootMargin: '90px 0px',
    threshold: 0.01,
  })

  eventLoadObserver.observe(eventLoadTriggerRef.value)
}

function scheduleEventLoadObserver() {
  void nextTick(setupEventLoadObserver)
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

function stopEventLoadObserver() {
  if (!eventLoadObserver) {
    return
  }

  eventLoadObserver.disconnect()
  eventLoadObserver = null
}

onMounted(async () => {
  await refreshLedger()
  startLedgerAutoRefresh()
})

onUnmounted(() => {
  stopLedgerAutoRefresh()
  stopEventLoadObserver()
})
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
    </section>

    <section class="blockchain-dashboard" aria-live="polite">
      <div class="blockchain-summary">
        <article class="chain-metric">
          <span>Blocks</span>
          <strong>{{ blockMetricCount.toLocaleString('ko-KR') }}</strong>
          <small>Genesis 포함 전체 블록</small>
        </article>
        <article class="chain-metric">
          <span>Events</span>
          <strong>{{ eventMetricCount.toLocaleString('ko-KR') }}</strong>
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
        </div>
        <div class="ledger-block-lookup">
          <div class="ledger-block-lookup-copy">
            <strong>블록 번호 조회</strong>
            <span>번호를 입력하거나 아래 최신 블록을 선택해 상세 정보를 확인할 수 있습니다.</span>
          </div>
          <form class="ledger-block-search" @submit.prevent="handleBlockSearch">
            <label>
              <span>블록 번호</span>
              <input
                v-model.trim="blockSearchValue"
                type="number"
                min="0"
                inputmode="numeric"
                placeholder="예: 16"
              />
            </label>
            <button type="submit" :disabled="isLoadingBlock">
              {{ isLoadingBlock ? '조회 중' : '조회' }}
            </button>
          </form>
        </div>
        <p v-if="blockLookupMessage" class="ledger-block-message">
          {{ blockLookupMessage }}
        </p>
        <div class="chain-node-map ledger-block-list">
          <button
            v-for="block in recentBlocks"
            :key="block.currentHash"
            type="button"
            class="chain-node ledger-block-node"
            :class="{ active: isSelectedBlock(block) }"
            @click="selectBlock(block)"
          >
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
          </button>
          <article v-if="!recentBlocks.length" class="chain-node">
            <span>#-</span>
            <strong>아직 생성된 블록이 없습니다.</strong>
          </article>
        </div>

        <aside class="ledger-block-detail">
          <template v-if="selectedBlock">
            <div class="ledger-block-detail-header">
              <span class="ledger-pill">Block #{{ selectedBlock.blockNumber }}</span>
              <strong>{{ shortHash(selectedBlock.currentHash) }}</strong>
            </div>
            <dl class="ledger-block-facts">
              <div>
                <dt>생성 시간</dt>
                <dd>{{ formatDate(selectedBlock.createdAt) }}</dd>
              </div>
              <div>
                <dt>이벤트</dt>
                <dd>{{ selectedBlock.eventCount.toLocaleString('ko-KR') }}개</dd>
              </div>
              <div>
                <dt>현재 해시</dt>
                <dd>{{ selectedBlock.currentHash || '-' }}</dd>
              </div>
              <div>
                <dt>이전 해시</dt>
                <dd>{{ selectedBlock.previousHash || '-' }}</dd>
              </div>
              <div>
                <dt>Merkle Root</dt>
                <dd>{{ selectedBlock.merkleRoot || '-' }}</dd>
              </div>
            </dl>

            <div class="ledger-block-events">
              <h3>포함 이벤트</h3>
              <div class="ledger-block-event-list">
                <article
                  v-for="event in selectedBlockEvents"
                  :key="event.transactionHash || event.id"
                  class="ledger-block-event"
                >
                  <span>{{ event.eventType }}</span>
                  <strong>{{ event.productName }}</strong>
                  <small>
                    {{ shortHash(event.transactionHash) }} ·
                    {{ event.quantity.toLocaleString('ko-KR') }} token ·
                    {{ formatWon(event.amount) }}
                  </small>
                </article>
                <article v-if="!selectedBlockEvents.length" class="ledger-block-event">
                  <span>NO_EVENTS</span>
                  <strong>이 블록에 포함된 이벤트가 없습니다.</strong>
                </article>
              </div>
            </div>
          </template>
          <template v-else>
            <strong>조회할 블록을 선택해주세요.</strong>
            <small>최근 블록을 누르거나 번호를 입력해 상세 정보를 확인할 수 있습니다.</small>
          </template>
        </aside>
      </section>

      <div class="ledger-layout">
        <section class="chain-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Event Stream</p>
              <h2>최근 이벤트</h2>
            </div>
          </div>
          <div
            ref="eventListRef"
            class="chain-list ledger-event-list"
            @scroll="handleEventListScroll"
          >
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
            <div
              v-if="hasMoreEvents"
              ref="eventLoadTriggerRef"
              class="ledger-event-sentinel"
              aria-hidden="true"
            ></div>
            <div v-if="isLoadingMoreEvents" class="ledger-event-status" role="status">
              이벤트를 불러오는 중입니다.
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

        </aside>
      </div>
    </section>
  </main>
</template>
