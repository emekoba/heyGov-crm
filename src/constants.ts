const API_BASE_URL = import.meta.env.PROD 
	? "https://heygov-crm.onrender.com"
	: "";

export const API_ENDPOINTS = {
	contacts: `${API_BASE_URL}/api/contacts`,
	assistant: `${API_BASE_URL}/api/assistant`,
};

export const UI_CONFIG = {
	itemsPerPage: 10,
};

export const ERROR_MESSAGES = {
	requiredField: "Either name or email is required",
	deleteConfirm: "Delete this contact?",
};

// Default values for add contact form
export const EMPTY_FORM = {
	name: "",
	email: "",
	company: "",
	phone: "",
};

// Default values for edit contact form
export const EMPTY_EDIT_FORM = {
	id: null,
	name: "",
	email: "",
	company: "",
	phone: "",
};
