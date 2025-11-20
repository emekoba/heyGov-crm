export const CONFIG = {
	port: Number(process.env.PORT) || 4001,
	initialId: 1,
};

export const ERROR_MESSAGES = {
	requiredField: "Either name or email is required",
	contactNotFound: "Contact not found",
	queryRequired: "Query is required",
	processingFailed: "Failed to process request",
	noNamesOrEmails: "I couldn't find any names or emails in your message.",
};

export const AI_CONFIG = {
	model: "gpt-4o-mini",
	queryTemperature: 0.7,
	queryMaxTokens: 100,
	maxContactsForContext: 20,
};

export const ACTIONS = {
	ADD_OR_UPDATE: "add_or_update",
	DELETE_CONTACT: "delete_contact",
	QUERY_CONTACTS: "query_contacts",
};

export const PROMPTS = {
	actionRouter: (query: string) =>
		`Parse query to JSON action.\n\nActions:\n1. add_or_update: Add/update contact info. Params: {identifier, name, email, company, phone}. Set field to null if not mentioned.\n2. delete_contact: Remove contact. Params: {identifier}.\n3. query_contacts: Answer question. Params: {question}.\n\nQuery: "${query}"\n\nExtract FULL names with initials. Return JSON: {"action":"name","params":{...}}`,

	query: (query: string, context: string) =>
		`Answer briefly based on these contacts:\n${context}\n\nQuestion: "${query}"`,
};

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
