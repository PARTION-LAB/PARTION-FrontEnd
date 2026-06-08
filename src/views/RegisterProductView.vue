<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits(['navigate'])

const selectedAssetType = ref('부동산')

const assetTypeOptions = [
  {
    value: '부동산',
    title: '부동산',
    description: '위치, 임대 현황, 배당 조건 중심',
    note: '부동산은 건물 위치, 임대 현황, 목표 투자금과 배당 조건만 먼저 입력하면 됩니다.',
    sectionTitle: '부동산 정보',
    submitLabel: '부동산 상품 등록하기',
    basicFields: [
      ['상품명', '예: 성수 크리에이티브 스튜디오 1호'],
      ['상품 요약', '예: 성수동 업무시설 임대수익을 분기 배당으로 배분'],
    ],
    assetFields: [
      ['건물 위치', '예: 서울 성동구 성수동'],
      ['건물 규모', '예: 지상 8층, 전용면적 85평'],
      ['임대 현황', '예: 임대율 92%, 주요 임차인 3곳'],
      ['권리 구조', '예: 임대수익 배당 및 매각 차익 배분 권리'],
      ['대표 이미지 URL', 'https://example.com/building.jpg'],
    ],
    termFields: [
      ['목표 투자금', '100000000'],
      ['토큰 단가', '10000'],
      ['예상 연 수익률', '6.4'],
      ['예상 수익 표시', '예: 연 6.4%'],
      ['정산 방식', '분기 배당'],
      ['리스크 등급', '중위험'],
      ['모집 마감일', 'mm/dd/yyyy'],
    ],
  },
  {
    value: '미술품',
    title: '미술품',
    description: '작품 정보, 보관, 매각 정산 중심',
    note: '미술품은 작품명, 작가, 감정가, 보관 방식과 매각 정산 조건을 중심으로 등록합니다.',
    sectionTitle: '미술품 정보',
    submitLabel: '미술품 상품 등록하기',
    basicFields: [
      ['상품명', '예: 아트브릿지 컬렉션 5호'],
      ['상품 요약', '예: 국내 블루칩 작가 작품 공동 소유 및 매각 차익형 STO'],
    ],
    assetFields: [
      ['작품명', '예: Blue Silence Series'],
      ['작가명', '예: 김하린'],
      ['감정가', '예: 8억원'],
      ['보관 장소', '예: 서울 강남 전문 수장고'],
      ['권리 구조', '예: 작품 매각 차익 정산 및 대여 수익 배분'],
      ['대표 이미지 URL', 'https://example.com/artwork.jpg'],
    ],
    termFields: [
      ['목표 투자금', '800000000'],
      ['토큰 단가', '25000'],
      ['예상 수익 표시', '예: 매각 차익형'],
      ['정산 방식', '매각 정산'],
      ['리스크 등급', '중고위험'],
      ['모집 마감일', 'mm/dd/yyyy'],
    ],
  },
  {
    value: '음악저작권',
    title: '음악저작권',
    description: '곡명, 아티스트, 저작권료 중심',
    note: '음악저작권은 개별 곡 단위로 등록되며 저작권료 정산권과 월 정산 조건을 입력합니다.',
    sectionTitle: '음악저작권 정보',
    submitLabel: '음악저작권 상품 등록하기',
    basicFields: [
      ['상품명', '예: 밤하늘의 파도 저작권'],
      ['상품 요약', '예: 단일 곡 저작인접권 정산 수익증권'],
    ],
    assetFields: [
      ['곡명', '예: 밤하늘의 파도'],
      ['아티스트', '예: 서아린'],
      ['권리 유형', '예: 저작인접권'],
      ['정산 플랫폼', '예: 국내외 음원·숏폼 플랫폼'],
      ['권리 구조', '예: 월별 저작권료 정산금 배분 권리'],
      ['대표 이미지 URL', 'https://example.com/music-cover.jpg'],
    ],
    termFields: [
      ['목표 투자금', '500000000'],
      ['토큰 단가', '5000'],
      ['예상 연 수익률', '7.5'],
      ['예상 수익 표시', '예: 저작권료 수익률 7.5%'],
      ['정산 방식', '월 정산'],
      ['리스크 등급', '중위험'],
      ['거래 시작일', 'mm/dd/yyyy'],
    ],
  },
]

const selectedConfig = computed(() => {
  return (
    assetTypeOptions.find((option) => option.value === selectedAssetType.value) ||
    assetTypeOptions[0]
  )
})
</script>

<template>
  <main class="register-page">
    <section class="page-hero">
      <p class="eyebrow">Product Onboarding</p>
      <h1>개인 보유 자산을 STO 상품으로 등록하세요</h1>
      <p>
        자산 정보와 수익 구조를 입력하면 상품 목록과 상세 화면에서 확인할 수
        있습니다. 음악저작권은 개별 곡 단위로 등록되며 바로 거래 가능 상태로
        공개됩니다.
      </p>
    </section>

    <section class="registration-layout">
      <article class="register-panel">
        <h2>상품 정보</h2>
        <p class="message">로그인 후 상품을 등록할 수 있습니다.</p>

        <form class="register-form">
          <section class="form-section">
            <p class="eyebrow">Asset Type</p>
            <h3>등록할 상품군</h3>
            <div class="asset-options">
              <label
                v-for="option in assetTypeOptions"
                :key="option.value"
                :class="{ selected: selectedAssetType === option.value }"
              >
                <input
                  v-model="selectedAssetType"
                  name="assetType"
                  type="radio"
                  :value="option.value"
                />
                <strong>{{ option.title }}</strong>
                <small>{{ option.description }}</small>
              </label>
            </div>
            <p class="guidance">
              {{ selectedConfig.note }}
            </p>
          </section>

          <section class="form-section">
            <p class="eyebrow">Basic</p>
            <h3>기본 정보</h3>
            <label v-for="([label, placeholder]) in selectedConfig.basicFields" :key="label">
              <span>{{ label }}</span>
              <input :placeholder="placeholder" type="text" />
            </label>
          </section>

          <section class="form-section">
            <p class="eyebrow">Asset</p>
            <h3>{{ selectedConfig.sectionTitle }}</h3>
            <div class="form-grid">
              <label v-for="([label, placeholder]) in selectedConfig.assetFields" :key="label">
                <span>{{ label }}</span>
                <input :placeholder="placeholder" />
              </label>
            </div>
          </section>

          <section class="form-section">
            <p class="eyebrow">Terms</p>
            <h3>투자 모집 조건</h3>
            <div class="form-grid">
              <label v-for="([label, placeholder]) in selectedConfig.termFields" :key="label">
                <span>{{ label }}</span>
                <input :placeholder="placeholder" />
              </label>
            </div>
          </section>

          <details class="extra-details">
            <summary>상세 설명 더 입력하기</summary>
          </details>
          <button class="submit-button" type="button">
            {{ selectedConfig.submitLabel }}
          </button>
        </form>
      </article>

      <aside class="registered-panel">
        <h2>내가 등록한 상품</h2>
        <p>아직 등록한 상품이 없습니다.</p>
        <button type="button" @click="emit('navigate', 'products')">상품 목록 보기</button>
      </aside>
    </section>
  </main>
</template>
