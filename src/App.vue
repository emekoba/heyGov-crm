<template>
  <div>
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <h1>HeyGov CRM</h1>

    <div class="section">
      <h2>🤖Assistant</h2>
      <div class="assistant-input">
        <input
          ref="assistantInput"
          v-model="assistantQuery"
          @keyup.enter="handleAssistant"
          @focus="onAssistantFocus"
          placeholder='Try: "Had a call with Alex Smith, follow up at alex@heygov.com"'
        />
        <button @click="handleAssistant" :disabled="loading">→</button>
      </div>
      <div v-if="assistantResponse" class="assistant-response">
        {{ assistantResponse }}
      </div>
    </div>

    <div class="section">
      <h2>Add contacts manually</h2>
      <div class="form-grid">
        <input v-model="form.name" placeholder="Name" />
        <input v-model="form.email" placeholder="Email" />
        <input v-model="form.company" placeholder="Company" />
        <input v-model="form.phone" placeholder="Phone" />
      </div>
      <button class="add-btn" @click="addContact" :disabled="loading">+</button>
      <div v-if="formError" class="error">{{ formError }}</div>
    </div>

    <div class="section">
      <h2>Contacts list</h2>

      <div class="filters">
        <input
          v-model="searchQuery"
          class="search-box"
          placeholder="Search contacts..."
        />
        <select v-model="filterCompany" class="filter-select">
          <option value="">All Companies</option>
          <option v-for="company in companies" :key="company" :value="company">
            {{ company }}
          </option>
        </select>
        <select v-model="sortBy" class="filter-select">
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
          <option value="company">Sort by Company</option>
          <option value="createdAt">Sort by Date Added</option>
        </select>
      </div>

      <div class="contacts-list">
        <div v-for="contact in paginatedContacts" :key="contact.id" class="contact-card">
          <div class="contact-info">
            <div class="contact-name">{{ contact.name || 'No name' }}</div>
            <div v-if="contact.email" class="contact-detail"><strong>Email:</strong> {{ contact.email }}</div>
            <div v-if="contact.company" class="contact-detail"><strong>Company:</strong> {{ contact.company }}</div>
            <div v-if="contact.phone" class="contact-detail"><strong>Phone:</strong> {{ contact.phone }}</div>
          </div>
          <div class="contact-actions">
            <button class="edit-btn" @click="openEditModal(contact)">Edit</button>
            <button class="delete-btn" @click="deleteContact(contact.id)">Delete</button>
          </div>
        </div>
        <div v-if="filteredContacts.length === 0" class="contact-detail">
          No contacts found
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          First
        </button>
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredContacts.length }} contacts)
        </span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
        <button
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Last
        </button>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <h3>Edit Contact</h3>
        <div class="form-grid">
          <input v-model="editForm.name" placeholder="Name" />
          <input v-model="editForm.email" placeholder="Email" />
          <input v-model="editForm.company" placeholder="Company" />
          <input v-model="editForm.phone" placeholder="Phone" />
        </div>
        <div v-if="editError" class="error">{{ editError }}</div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeEditModal">Cancel</button>
          <button class="save-btn" @click="updateContact">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { API_ENDPOINTS, EMPTY_EDIT_FORM, EMPTY_FORM, ERROR_MESSAGES, UI_CONFIG } from './constants'

const assistantInput = ref<HTMLInputElement | null>(null)
const contacts = ref<any[]>([])
const searchQuery = ref('')
const filterCompany = ref('')
const sortBy = ref('name')
const currentPage = ref(1)
const itemsPerPage = UI_CONFIG.itemsPerPage
const assistantQuery = ref('')
const assistantResponse = ref('')
const form = ref({ ...EMPTY_FORM })
const formError = ref('')
const showEditModal = ref(false)
const editForm = ref({ ...EMPTY_EDIT_FORM })
const editError = ref('')
const loading = ref(false)

const companies = computed(() => {
  const set = new Set<string>()
  contacts.value.forEach(contact => {
    if (contact.company) set.add(contact.company)
  })
  return Array.from(set).sort()
})

const filteredContacts = computed(() => {
  let result = contacts.value.slice()

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(contact =>
      contact.name?.toLowerCase().includes(q) ||
      contact.email?.toLowerCase().includes(q) ||
      contact.company?.toLowerCase().includes(q) ||
      contact.phone?.toLowerCase().includes(q)
    )
  }

  if (filterCompany.value) {
    result = result.filter(contact => contact.company === filterCompany.value)
  }

  result.sort((a, b) => {
    const aVal = a[sortBy.value] || ''
    const bVal = b[sortBy.value] || ''
    return String(aVal).localeCompare(String(bVal))
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredContacts.value.length / itemsPerPage))

const paginatedContacts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredContacts.value.slice(start, end)
})

onMounted(() => {
  loadContacts()
})

async function loadContacts() {
  const res = await fetch(API_ENDPOINTS.contacts)
  contacts.value = await res.json()
}

async function addContact() {
  formError.value = ''
  if (!form.value.name && !form.value.email) {
    formError.value = ERROR_MESSAGES.requiredField
    return
  }

  loading.value = true
  try {
    const res = await fetch(API_ENDPOINTS.contacts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (res.ok) {
      const newContact = await res.json()
      contacts.value.push(newContact)
      form.value = { ...EMPTY_FORM }
    }
  } finally {
    loading.value = false
  }
}

async function handleAssistant() {
  if (!assistantQuery.value.trim()) return

  loading.value = true
  try {
    const res = await fetch(API_ENDPOINTS.assistant, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: assistantQuery.value })
    })

    if (!res.ok) throw new Error(`Server error: ${res.status}`)

    const result = await res.json()
    assistantResponse.value = result.message

    if (result.success) {
      if (result.action === 'add' && result.contact) {
        contacts.value.push(result.contact)
      }

      if (result.action === 'update' && result.contact) {
        const idx = contacts.value.findIndex(c => c.id === result.contact.id)
        if (idx !== -1) contacts.value.splice(idx, 1, result.contact)
      }

      if (result.action === 'delete' && result.contactId) {
        contacts.value = contacts.value.filter(c => c.id !== result.contactId)
      }
    }

    await nextTick()
    assistantInput.value?.select()
  } catch (err) {
    console.error('Assistant error:', err)
    assistantResponse.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

function onAssistantFocus(e: FocusEvent) {
  const el = e.target as HTMLInputElement | null
  el?.select()
}

function openEditModal(contact: any) {
  editForm.value = { ...contact }
  showEditModal.value = true
  editError.value = ''
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value = { ...EMPTY_EDIT_FORM }
  editError.value = ''
}

async function updateContact() {
  editError.value = ''
  if (!editForm.value.name && !editForm.value.email) {
    editError.value = ERROR_MESSAGES.requiredField
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API_ENDPOINTS.contacts}/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm.value)
    })

    if (res.ok) {
      const updated = await res.json()
      const idx = contacts.value.findIndex(c => c.id === updated.id)
      if (idx !== -1) contacts.value.splice(idx, 1, updated)
      closeEditModal()
    }
  } finally {
    loading.value = false
  }
}

async function deleteContact(id: number) {
  if (!confirm(ERROR_MESSAGES.deleteConfirm)) return

  loading.value = true
  try {
    await fetch(`${API_ENDPOINTS.contacts}/${id}`, { method: 'DELETE' })
    contacts.value = contacts.value.filter(c => c.id !== id)
  } finally {
    loading.value = false
  }
}
</script>

<style>
/* keep existing styles */
</style>

