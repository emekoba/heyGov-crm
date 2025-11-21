// Server configuration
export const CONFIG = {
	port: Number(process.env.PORT) || 4001,
	initialId: 1,
};

// Error messages for API responses
export const ERROR_MESSAGES = {
	requiredField: "Either name or email is required",
	contactNotFound: "Contact not found",
	queryRequired: "Query is required",
	processingFailed: "Failed to process request",
	noNamesOrEmails: "I couldn't find any names or emails in your message.",
};

// OpenAI configuration
export const AI_CONFIG = {
	model: "gpt-4o-mini",
	queryTemperature: 0.7,
	queryMaxTokens: 100,
	maxContactsForContext: 20,
};

// Action types for the AI assistant
export enum ACTIONS {
	ADD_OR_UPDATE = "add_or_update",
	DELETE_CONTACT = "delete_contact",
	QUERY_CONTACTS = "query_contacts",
}

// Prompt templates for OpenAI
export const PROMPTS = {
	// Parses user input to determine action type
	actionRouter: (query: string) =>
		`Parse query to JSON actions array.\n\nActions:\n1. add_or_update: Add/update contact info OR when user mentions meeting/talking/emailing/interacting with people (even without contact details). Params: {identifier, name, email, company, phone}. Set field to null if not mentioned. ALWAYS use this for "met with", "talked to", "called", "emailed", etc.\n2. delete_contact: Remove contact. Params: {identifier}.\n3. query_contacts: Only for questions about existing contacts (what, when, who, etc).\n\nQuery: "${query}"\n\nIMPORTANT: Only extract information EXPLICITLY mentioned. DO NOT invent last names, emails, or other details. Use ONLY what's provided. For MULTIPLE people, return MULTIPLE actions.\nRETURN JSON ARRAY: [{"action":"add_or_update","params":{"identifier":null,"name":"Jon","email":null,"company":null,"phone":null}}, ...]`,

	// Answers questions about contacts
	query: (query: string, context: string) =>
		`Answer briefly based on these contacts:\n${context}\n\nQuestion: "${query}"`,
};

// Common words to filter out when extracting keywords
export const STOP_WORDS = [
	"when",
	"did",
	"what",
	"who",
	"where",
	"how",
	"which",
	"why",
	"the",
	"a",
	"an",
	"is",
	"was",
	"are",
	"were",
	"do",
	"does",
	"have",
	"has",
	"had",
	"with",
	"about",
	"from",
	"for",
	"at",
	"by",
	"to",
	"of",
	"in",
	"on",
	"my",
	"our",
	"their",
	"his",
	"her",
	"meet",
	"met",
	"contact",
	"call",
	"called",
	"email",
	"emailed",
	"first",
	"last",
	"time",
];
