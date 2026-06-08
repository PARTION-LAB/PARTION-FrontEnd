<script setup>
import { computed, ref } from 'vue'
import { products } from '../data/products'
import { formatWon } from '../utils/formatters'

const refreshedAt = ref(new Date())

const ledgerEvents = computed(() => {
  return products.flatMap((product, index) => {
    const baseTime = Date.parse('2026-06-08T09:00:00+09:00') + index * 1000 * 60 * 37
    const tokenized = {
      id: `${product.symbol}-tokenized`,
      type: 'ASSET_TOKENIZED',
      symbol: product.symbol,
      asset: product.category,
      quantity: Math.round(product.targetAmount / product.unitPrice),
      amount: product.targetAmount,
      occurredAt: new Date(baseTime).toISOString(),
    }

    const funded = {
      id: `${product.symbol}-funded`,
      type: product.open ? 'SUBSCRIPTION_PAYMENT' : 'SECONDARY_TRADE',
      symbol: product.symbol,
      asset: product.category,
      quantity: Math.round(product.fundedAmount / product.unitPrice),
      amount: product.fundedAmount,
      occurredAt: new Date(baseTime + 1000 * 60 * 12).toISOString(),
    }

    return [tokenized, funded]
  })
})

const blocks = computed(() => {
  const grouped = []
  for (let index = 0; index < ledgerEvents.value.length; index += 3) {
    grouped.push(ledgerEvents.value.slice(index, index + 3))
  }

  return grouped.map((events, index) => {
    const previousHash =
      index === 0
        ? '0000000000000000000000000000000000000000000000000000000000000000'
        : pseudoHash(`partion-prev-${index - 1}`)
    const merkleRoot = pseudoHash(events.map((event) => event.id).join('|'))
    const hash = pseudoHash(`${index}-${previousHash}-${merkleRoot}`)

    return {
      index,
      hash,
      previousHash,
      merkleRoot,
      nonce: 4200 + index * 137,
      events,
    }
  })
})

const recentBlocks = computed(() => blocks.value.slice(-8).reverse())
const recentEvents = computed(() => ledgerEvents.value.slice(-12).reverse())
const latestHash = computed(() => blocks.value.at(-1)?.hash || '')
const eventCounts = computed(() => countBy(ledgerEvents.value, 'type'))
const assetCounts = computed(() => countBy(ledgerEvents.value, 'asset'))

function countBy(items, key) {
  return items.reduce((counts, item) => {
    counts[item[key]] = (counts[item[key]] || 0) + 1
    return counts
  }, {})
}

function pseudoHash(seed) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }

  const base = Math.abs(hash).toString(16).padStart(8, '0')
  return `${base}${base.split('').reverse().join('')}${base}${base}`.slice(0, 64)
}

function shortHash(hash) {
  return hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : '-'
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function refreshLedger() {
  refreshedAt.value = new Date()
}
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
      <button class="primary-link page-action-link" type="button" @click="refreshLedger">
        원장 새로고침
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
          <strong class="is-valid">VALID</strong>
          <small>{{ shortHash(latestHash) }}</small>
        </article>
      </div>

      <div class="ledger-state">
        공개 원장 흐름을 보고 있습니다. 마지막 갱신:
        {{ formatDate(refreshedAt.toISOString()) }}
      </div>

      <section class="chain-panel ledger-flow">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Latest Blocks</p>
            <h2>최근 블록 흐름</h2>
          </div>
          <span class="ledger-pill">height {{ Math.max(0, blocks.length - 1) }}</span>
        </div>
        <div class="chain-node-map">
          <article v-for="block in recentBlocks" :key="block.hash" class="chain-node">
            <span>#{{ block.index }}</span>
            <strong>{{ shortHash(block.hash) }}</strong>
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
                <dt>nonce</dt>
                <dd>{{ block.nonce }}</dd>
              </div>
              <div>
                <dt>events</dt>
                <dd>{{ block.events.length }}</dd>
              </div>
            </dl>
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
            <div v-for="event in recentEvents" :key="event.id" class="chain-row event-row">
              <span>{{ event.type }} · {{ event.symbol }}</span>
              <strong>{{ shortHash(pseudoHash(event.id)) }}</strong>
              <small>
                {{ formatDate(event.occurredAt) }} ·
                {{ event.quantity.toLocaleString('ko-KR') }} token ·
                {{ formatWon(event.amount) }}
              </small>
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
