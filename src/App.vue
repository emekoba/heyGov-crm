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
          @focus="$event.target.select()"
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

<script>
import { API_ENDPOINTS, EMPTY_EDIT_FORM, EMPTY_FORM, ERROR_MESSAGES, UI_CONFIG } from './constants.js';

export default {
  data() {
    return {
      contacts: [],
      searchQuery: '',
      filterCompany: '',
      sortBy: 'name',
      currentPage: 1,
      itemsPerPage: UI_CONFIG.itemsPerPage,
      assistantQuery: '',
      assistantResponse: '',
      form: { ...EMPTY_FORM },
      formError: '',
      showEditModal: false,
      editForm: { ...EMPTY_EDIT_FORM },
      editError: '',
      loading: false
    }
  },
  computed: {
    companies() {
      const companySet = new Set();
      this.contacts.forEach(contact => {
        if (contact.company) companySet.add(contact.company);
      });
      return Array.from(companySet).sort();
    },
    filteredContacts() {
      let result = [...this.contacts];
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(contact =>
          contact.name?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query)
        );
      }
      
      if (this.filterCompany) {
        result = result.filter(contact => contact.company === this.filterCompany);
      }
      
      result.sort((a, b) => {
        const aVal = a[this.sortBy] || '';
        const bVal = b[this.sortBy] || '';
        return aVal.toString().localeCompare(bVal.toString());
      });
      
      return result;
    },
    totalPages() {
      return Math.ceil(this.filteredContacts.length / this.itemsPerPage);
    },
    paginatedContacts() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredContacts.slice(start, end);
    }
  },
  watch: {
    filteredContacts() {
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
      }
    }
  },
  mounted() {
    this.loadContacts();
  },
  methods: {
    async loadContacts() {
      const response = await fetch(API_ENDPOINTS.contacts);
      this.contacts = await response.json();
    },
    async addContact() {
      this.formError = '';
      
      if (!this.form.name && !this.form.email) {
        this.formError = ERROR_MESSAGES.requiredField;
        return;
      }

      this.loading = true;
      try {
        const response = await fetch(API_ENDPOINTS.contacts, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        });

        if (response.ok) {
          const newContact = await response.json();
          this.contacts.push(newContact);
          this.form = { ...EMPTY_FORM };
        }
      } finally {
        this.loading = false;
      }
    },
    async handleAssistant() {
      if (!this.assistantQuery.trim()) return;

      this.loading = true;
      try {
        const response = await fetch(API_ENDPOINTS.assistant, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: this.assistantQuery })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        this.assistantResponse = result.message;
        
        if (result.success) {
          if (result.action === 'add' && result.contact) {
            this.contacts.push(result.contact);
          }
          
          if (result.action === 'update' && result.contact) {
            const index = this.contacts.findIndex(c => c.id === result.contact.id);
            if (index !== -1) {
              this.contacts.splice(index, 1, result.contact);
            }
          }
          
          if (result.action === 'delete' && result.contactId) {
            this.contacts = this.contacts.filter(c => c.id !== result.contactId);
          }
        }
        
        this.$nextTick(() => {
          if (this.$refs.assistantInput) {
            this.$refs.assistantInput.select();
          }
        });
      } catch (error) {
        console.error('Assistant error:', error);
        this.assistantResponse = 'Something went wrong. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    openEditModal(contact) {
      this.editForm = { ...contact };
      this.showEditModal = true;
      this.editError = '';
    },
    closeEditModal() {
      this.showEditModal = false;
      this.editForm = { ...EMPTY_EDIT_FORM };
      this.editError = '';
    },
    async updateContact() {
      this.editError = '';
      
      if (!this.editForm.name && !this.editForm.email) {
        this.editError = ERROR_MESSAGES.requiredField;
        return;
      }

      this.loading = true;
      try {
        const response = await fetch(`${API_ENDPOINTS.contacts}/${this.editForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.editForm)
        });

        if (response.ok) {
          const updated = await response.json();
          const index = this.contacts.findIndex(c => c.id === updated.id);
          if (index !== -1) {
            this.contacts.splice(index, 1, updated);
          }
          this.closeEditModal();
        }
      } finally {
        this.loading = false;
      }
    },
    async deleteContact(id) {
      if (!confirm(ERROR_MESSAGES.deleteConfirm)) return;

      this.loading = true;
      try {
        await fetch(`${API_ENDPOINTS.contacts}/${id}`, { method: 'DELETE' });
        this.contacts = this.contacts.filter(c => c.id !== id);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
