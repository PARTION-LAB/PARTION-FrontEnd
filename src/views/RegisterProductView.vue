<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createProduct, getMyProducts, uploadProductImage } from '../api/products'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['navigate'])
const { isAuthenticated } = useAuth()

const selectedAssetType = ref('부동산')
const formValues = ref({})
const imageFile = ref(null)
const imageInputRef = ref(null)
const message = ref('')
const isSubmitting = ref(false)
const isLoadingMyProducts = ref(false)
const myProducts = ref([])
const openSelectField = ref('')

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
      ['목표 투자금(만원)', '예: 10'],
      ['토큰 단가', '10000'],
      ['예상 연 수익률', '6.4'],
      ['정산 방식', '분기 배당'],
      ['리스크 등급', '중위험'],
      ['모집 마감일', 'YYYY-MM-DD'],
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
      ['목표 투자금(만원)', '예: 10'],
      ['토큰 단가', '25000'],
      ['예상 연 수익률', '8.0'],
      ['정산 방식', '매각 정산'],
      ['리스크 등급', '중고위험'],
      ['모집 마감일', 'YYYY-MM-DD'],
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
      ['목표 투자금(만원)', '예: 10'],
      ['토큰 단가', '5000'],
      ['예상 연 수익률', '7.5'],
      ['정산 방식', '월 정산'],
      ['리스크 등급', '중위험'],
      ['거래 시작일', 'YYYY-MM-DD'],
    ],
  },
]

const selectedConfig = computed(() => {
  return (
    assetTypeOptions.find((option) => option.value === selectedAssetType.value) ||
    assetTypeOptions[0]
  )
})

const categoryByAssetType = {
  부동산: 'REAL_ESTATE',
  미술품: 'ART',
  음악저작권: 'MUSIC',
}

const extraInfoFieldByAssetType = {
  부동산: '건물 위치',
  미술품: '작가명',
  음악저작권: '아티스트',
}

const targetAmountFieldLabel = '목표 투자금(만원)'
const dateFieldLabels = new Set(['모집 마감일', '거래 시작일'])
const selectFieldOptions = {
  '정산 방식': ['월 정산', '분기 배당', '반기 배당', '연 정산', '매각 정산'],
  '리스크 등급': ['저위험', '중위험', '중고위험', '고위험'],
}

const minSelectableDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDateInputValue(tomorrow)
})

const visibleMessage = computed(() => {
  if (message.value) {
    return message.value
  }

  return isAuthenticated.value ? '' : '로그인 후 상품을 등록할 수 있습니다.'
})

const selectedImageFileName = computed(() => imageFile.value?.name || '')

function updateField(label, value) {
  formValues.value = {
    ...formValues.value,
    [label]: value,
  }
}

function readField(label) {
  return formValues.value[label] || ''
}

function formatDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isDateField(label) {
  return dateFieldLabels.has(label)
}

function isSelectField(label) {
  return Boolean(selectFieldOptions[label])
}

function isNumericField(label) {
  return label === targetAmountFieldLabel || label === '토큰 단가' || label === '예상 연 수익률'
}

function toggleSelectField(label) {
  openSelectField.value = openSelectField.value === label ? '' : label
}

function selectFieldOption(label, option) {
  updateField(label, option)
  openSelectField.value = ''
}

function closeSelectField(event) {
  if (event.target?.closest?.('.field-select')) {
    return
  }

  openSelectField.value = ''
}

function toNumber(value) {
  const parsed = Number(String(value || '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function getDeadline() {
  return readField('모집 마감일') || readField('거래 시작일') || ''
}

function getExpectedYield() {
  return toNumber(readField('예상 연 수익률'))
}

function getTargetAmount() {
  return toNumber(readField(targetAmountFieldLabel)) * 10000
}

function validateForm() {
  if (!isAuthenticated.value) {
    return '로그인 후 상품을 등록할 수 있습니다.'
  }

  if (!readField('상품명').trim() || !readField('상품 요약').trim()) {
    return '상품명과 상품 요약을 입력해주세요.'
  }

  if (getTargetAmount() <= 0 || toNumber(readField('토큰 단가')) <= 0) {
    return '목표 투자금과 토큰 단가는 0보다 크게 입력해주세요.'
  }

  if (!readField('정산 방식') || !readField('리스크 등급')) {
    return '정산 방식과 리스크 등급을 선택해주세요.'
  }

  if (!getDeadline()) {
    return '모집 마감일 또는 거래 시작일을 입력해주세요.'
  }

  if (getDeadline() < minSelectableDate.value) {
    return '오늘 이후 날짜를 선택해주세요.'
  }

  return ''
}

async function loadMyProducts() {
  if (!isAuthenticated.value) {
    myProducts.value = []
    return
  }

  isLoadingMyProducts.value = true

  try {
    const page = await getMyProducts({ page: 0, size: 5 })
    myProducts.value = page.content
  } catch {
    myProducts.value = []
  } finally {
    isLoadingMyProducts.value = false
  }
}

function handleImageFileChange(event) {
  imageFile.value = event.target.files?.[0] || null
}

async function submitProduct() {
  const validationMessage = validateForm()

  if (validationMessage) {
    message.value = validationMessage
    return
  }

  isSubmitting.value = true
  message.value = imageFile.value ? '이미지를 업로드하고 상품을 등록하는 중입니다.' : '상품을 등록하는 중입니다.'

  try {
    const imageUrl = imageFile.value
      ? await uploadProductImage(imageFile.value)
      : readField('대표 이미지 URL')

    await createProduct({
      category: categoryByAssetType[selectedAssetType.value],
      name: readField('상품명').trim(),
      summary: readField('상품 요약').trim(),
      description: readField('권리 구조') || readField('상품 요약').trim(),
      imageUrl,
      extraInfo: readField(extraInfoFieldByAssetType[selectedAssetType.value]),
      targetAmount: getTargetAmount(),
      tokenPrice: toNumber(readField('토큰 단가')),
      expectedYield: getExpectedYield(),
      deadline: getDeadline(),
    })

    formValues.value = {}
    imageFile.value = null
    if (imageInputRef.value) {
      imageInputRef.value.value = ''
    }
    message.value = '상품이 등록되었습니다.'
    emit('navigate', 'products')
  } catch (error) {
    message.value = error.message || '상품을 등록하지 못했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadMyProducts()
  document.addEventListener('pointerdown', closeSelectField)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeSelectField)
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
        <p v-if="visibleMessage" class="message">{{ visibleMessage }}</p>

        <form class="register-form" @submit.prevent="submitProduct">
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
              <input
                :value="readField(label)"
                :placeholder="placeholder"
                type="text"
                @input="updateField(label, $event.target.value)"
              />
            </label>
          </section>

          <section class="form-section">
            <p class="eyebrow">Asset</p>
            <h3>{{ selectedConfig.sectionTitle }}</h3>
            <div class="form-grid">
              <label v-for="([label, placeholder]) in selectedConfig.assetFields" :key="label">
                <span>{{ label }}</span>
                <input
                  :value="readField(label)"
                  :placeholder="placeholder"
                  @input="updateField(label, $event.target.value)"
                />
              </label>
              <div class="file-field">
                <span>대표 이미지 파일</span>
                <label class="file-upload-control" for="representative-image-file">
                  <input
                    id="representative-image-file"
                    ref="imageInputRef"
                    accept="image/*"
                    class="file-upload-input"
                    type="file"
                    @change="handleImageFileChange"
                  />
                  <span class="file-upload-button">파일 선택</span>
                  <span v-if="selectedImageFileName" class="file-upload-name">
                    {{ selectedImageFileName }}
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section class="form-section">
            <p class="eyebrow">Terms</p>
            <h3>투자 모집 조건</h3>
            <div class="form-grid">
              <label v-for="([label, placeholder]) in selectedConfig.termFields" :key="label">
                <span>{{ label }}</span>
                <div
                  v-if="isSelectField(label)"
                  class="field-select"
                  :class="{ 'is-open': openSelectField === label }"
                >
                  <button
                    type="button"
                    class="field-select-toggle"
                    :class="{ 'is-empty': !readField(label) }"
                    :aria-expanded="openSelectField === label"
                    aria-haspopup="listbox"
                    @click="toggleSelectField(label)"
                  >
                    <span>{{ readField(label) || '선택해주세요' }}</span>
                  </button>
                  <div
                    v-if="openSelectField === label"
                    class="field-select-menu"
                    role="listbox"
                    :aria-label="label"
                  >
                    <button
                      v-for="option in selectFieldOptions[label]"
                      :key="option"
                      type="button"
                      class="field-select-option"
                      :class="{ selected: readField(label) === option }"
                      role="option"
                      :aria-selected="readField(label) === option"
                      @click="selectFieldOption(label, option)"
                    >
                      {{ option }}
                    </button>
                  </div>
                </div>
                <input
                  v-else
                  :value="readField(label)"
                  :inputmode="isNumericField(label) ? 'decimal' : undefined"
                  :min="isDateField(label) ? minSelectableDate : undefined"
                  :placeholder="isDateField(label) ? undefined : placeholder"
                  :type="isDateField(label) ? 'date' : 'text'"
                  @input="updateField(label, $event.target.value)"
                />
              </label>
            </div>
          </section>

          <details class="extra-details">
            <summary>상세 설명 더 입력하기</summary>
          </details>
          <button class="submit-button" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '등록 중...' : selectedConfig.submitLabel }}
          </button>
        </form>
      </article>

      <aside class="registered-panel">
        <h2>내가 등록한 상품</h2>
        <p v-if="isLoadingMyProducts">등록한 상품을 불러오는 중입니다.</p>
        <p v-else-if="!myProducts.length">아직 등록한 상품이 없습니다.</p>
        <div v-else class="portfolio-list" aria-label="내가 등록한 상품">
          <article
            v-for="product in myProducts"
            :key="product.productId"
            class="portfolio-item"
          >
            <strong>{{ product.name }}</strong>
            <span>{{ product.category }} · {{ product.statusLabel || product.status }}</span>
            <small>{{ product.subscriptionPeriod }}</small>
          </article>
        </div>
        <button type="button" @click="emit('navigate', 'products')">상품 목록 보기</button>
      </aside>
    </section>
  </main>
</template>
