<script setup>
import { onMounted, ref } from 'vue'
import { getMyProfile, updateMyPassword, updateMyProfile } from '../api/members'
import { useAuth } from '../composables/useAuth'

const { setMember } = useAuth()

const profile = ref(null)
const nickname = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const isLoading = ref(true)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const message = ref('')
const messageType = ref('info')
const passwordMessage = ref('')
const passwordMessageType = ref('info')

function setMessage(nextMessage, type = 'info') {
  message.value = nextMessage
  messageType.value = type
}

function setPasswordMessage(nextMessage, type = 'info') {
  passwordMessage.value = nextMessage
  passwordMessageType.value = type
}

function fillProfile(nextProfile) {
  profile.value = nextProfile
  nickname.value = nextProfile?.nickname || ''
  setMember(nextProfile)
}

function validateProfileForm() {
  const trimmedNickname = nickname.value.trim()

  if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
    return '닉네임은 2자 이상 10자 이하로 입력해주세요.'
  }

  return ''
}

function validatePasswordForm() {
  if (!currentPassword.value) {
    return '현재 비밀번호를 입력해주세요.'
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/.test(newPassword.value)) {
    return '새 비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 20자 이하로 입력해주세요.'
  }

  return ''
}

function getPasswordErrorMessage(error) {
  if (error.status === 400) {
    return '입력값을 확인해주세요. 새 비밀번호는 8자 이상 20자 이하이며 영문, 숫자, 특수문자를 포함해야 합니다.'
  }

  if (error.status === 401) {
    return '현재 비밀번호가 일치하지 않습니다.'
  }

  if (error.status === 500) {
    return '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  return error.message || '비밀번호를 변경하지 못했습니다.'
}

async function loadProfile() {
  isLoading.value = true
  setMessage('')

  try {
    fillProfile(await getMyProfile())
  } catch (error) {
    setMessage(error.message || '내 정보를 불러오지 못했습니다.', 'error')
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  const validationMessage = validateProfileForm()

  if (validationMessage) {
    setMessage(validationMessage, 'error')
    return
  }

  isSavingProfile.value = true
  setMessage('저장 중입니다.', 'info')

  try {
    fillProfile(await updateMyProfile({ nickname: nickname.value.trim() }))
    setMessage('내 정보가 저장되었습니다.', 'success')
  } catch (error) {
    setMessage(error.message || '내 정보를 저장하지 못했습니다.', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

async function handlePasswordSubmit() {
  const validationMessage = validatePasswordForm()

  if (validationMessage) {
    setPasswordMessage(validationMessage, 'error')
    return
  }

  isSavingPassword.value = true
  setPasswordMessage('비밀번호를 변경하는 중입니다.', 'info')

  try {
    await updateMyPassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    fillProfile(await getMyProfile())
    currentPassword.value = ''
    newPassword.value = ''
    setPasswordMessage('비밀번호가 변경되었습니다. 내 정보도 최신 상태로 유지됩니다.', 'success')
  } catch (error) {
    setPasswordMessage(getPasswordErrorMessage(error), 'error')
  } finally {
    isSavingPassword.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <main class="profile-page">
    <section class="page-hero profile-hero">
      <div>
        <p class="eyebrow">Privacy & Settings</p>
        <h1>개인정보와 계정 설정을 관리하세요</h1>
        <p>로그인한 회원의 기본 정보와 비밀번호를 한 화면에서 관리할 수 있습니다.</p>
      </div>
    </section>

    <p
      v-if="message"
      class="profile-message"
      :class="messageType"
      role="status"
    >
      {{ message }}
    </p>

    <section class="profile-layout">
      <article class="profile-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Profile</p>
            <h2>기본 정보</h2>
          </div>
        </div>

        <p v-if="isLoading" class="profile-state" role="status">내 정보를 불러오는 중입니다.</p>

        <form v-else class="profile-form" novalidate @submit.prevent="handleSubmit">
          <label>
            <span>이메일</span>
            <input :value="profile?.email || ''" type="email" autocomplete="email" disabled />
          </label>
          <label>
            <span>닉네임</span>
            <input
              v-model="nickname"
              type="text"
              autocomplete="nickname"
              minlength="2"
              maxlength="10"
              required
            />
          </label>
          <div class="profile-meta">
            <span>권한 {{ profile?.role || '-' }}</span>
            <span>가입일 {{ profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-' }}</span>
          </div>
          <button type="submit" :disabled="isSavingProfile">
            {{ isSavingProfile ? '저장 중...' : '닉네임 변경' }}
          </button>
        </form>
      </article>

      <article class="profile-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Security</p>
            <h2>비밀번호 변경</h2>
          </div>
        </div>

        <form class="profile-form" novalidate @submit.prevent="handlePasswordSubmit">
          <label>
            <span>현재 비밀번호</span>
            <input
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              required
            />
          </label>
          <label>
            <span>새 비밀번호</span>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              minlength="8"
              maxlength="20"
              required
            />
          </label>
          <div class="profile-note">
            <strong>비밀번호 정책</strong>
            <small>8자 이상 20자 이하, 영문·숫자·특수문자를 포함해야 합니다.</small>
          </div>
          <button type="submit" :disabled="isSavingPassword">
            {{ isSavingPassword ? '변경 중...' : '비밀번호 변경' }}
          </button>
          <p
            v-if="passwordMessage"
            class="profile-message inline"
            :class="passwordMessageType"
            role="status"
          >
            {{ passwordMessage }}
          </p>
        </form>
      </article>
    </section>
  </main>
</template>
