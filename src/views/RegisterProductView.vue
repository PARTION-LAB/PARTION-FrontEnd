<script setup>
const emit = defineEmits(['navigate'])

const assetTypes = [
  ['부동산', '위치, 임대 현황, 배당 조건 중심'],
  ['미술품', '작품 정보, 보관, 매각 정산 중심'],
  ['음악저작권', '곡명, 아티스트, 저작권료 중심'],
]

const fields = [
  ['상품명', '예: 성수 크리에이티브 스튜디오 1호'],
  ['상품 요약', '예: 성수동 업무시설 임대수익을 분기 배당으로 배분'],
  ['건물 위치', '예: 서울 성동구 성수동'],
  ['건물 규모', '예: 지상 8층, 전용면적 85평'],
  ['임대 현황', '예: 임대율 92%, 주요 임차인 3곳'],
  ['권리 구조', '예: 임대수익 배당 및 매각 차익 배분 권리'],
  ['대표 이미지 URL', 'https://example.com/image.jpg'],
]

const termFields = [
  ['목표 투자금', '100000000'],
  ['토큰 단가', '10000'],
  ['예상 연 수익률', '6.4'],
  ['예상 수익 표시', '예: 연 6.4%'],
  ['정산 방식', '분기 배당'],
  ['리스크 등급', '중위험'],
  ['모집 마감일', 'mm/dd/yyyy'],
]
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
                v-for="([title, desc], index) in assetTypes"
                :key="title"
                :class="{ selected: index === 0 }"
              >
                <input name="assetType" type="radio" :checked="index === 0" />
                <strong>{{ title }}</strong>
                <small>{{ desc }}</small>
              </label>
            </div>
            <p class="guidance">
              부동산은 건물 위치, 임대 현황, 목표 투자금과 배당 조건만 먼저 입력하면 됩니다.
            </p>
          </section>

          <section class="form-section">
            <p class="eyebrow">Basic</p>
            <h3>기본 정보</h3>
            <label v-for="([label, placeholder], index) in fields.slice(0, 2)" :key="label">
              <span>{{ label }}</span>
              <input :placeholder="placeholder" :type="index === 0 ? 'text' : 'text'" />
            </label>
          </section>

          <section class="form-section">
            <p class="eyebrow">Asset</p>
            <h3>부동산 정보</h3>
            <div class="form-grid">
              <label v-for="([label, placeholder]) in fields.slice(2)" :key="label">
                <span>{{ label }}</span>
                <input :placeholder="placeholder" />
              </label>
            </div>
          </section>

          <section class="form-section">
            <p class="eyebrow">Terms</p>
            <h3>투자 모집 조건</h3>
            <div class="form-grid">
              <label v-for="([label, placeholder]) in termFields" :key="label">
                <span>{{ label }}</span>
                <input :placeholder="placeholder" />
              </label>
            </div>
          </section>

          <details class="extra-details">
            <summary>상세 설명 더 입력하기</summary>
          </details>
          <button class="submit-button" type="button">부동산 상품 등록하기</button>
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
