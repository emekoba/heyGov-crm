import Fuse from "fuse.js";
import { answerQuery, parseAction } from "./ai.js";
import { ACTIONS, ERROR_MESSAGES } from "./constants.js";

/**
 * Finds a contact by name or email using fuzzy matching
 */
function findContact(contacts: any[], identifier: string) {
	const search = identifier.toLowerCase();

	// First try exact match
	let match = contacts.find(
		(c) => c.name?.toLowerCase() === search || c.email?.toLowerCase() === search
	);

	if (match) return match;

	// Fall back to fuzzy search for typos/partial matches
	const fuse = new Fuse(contacts, {
		keys: ["name", "email"],
		threshold: 0.4,
		ignoreLocation: true,
		findAllMatches: false,
	});

	const results = fuse.search(identifier);
	return results.length > 0 ? results[0].item : null;
}

/**
 * Parses user query and prepares it for execution
 */
export async function parseAssistantQuery(query: string, contacts: any[]) {
	const parsedActions = await parseAction(query);

	if (!parsedActions || parsedActions.length === 0) {
		console.error("Invalid parsed action:", parsedActions);
		return {
			type: "error",
			message: "I couldn't understand that request.",
		};
	}

	// Return array of actions to execute
	return parsedActions.map((action: any) => ({
		type: action.action.toLowerCase(),
		params: action.params,
		query,
		contacts,
	}));
}

/**
 * Executes the parsed action (add/update/delete/query)
 */
export async function executeAction(
	parsedAction: any,
	contacts: any[],
	nextId: number
) {
	const { type, params } = parsedAction;

	switch (type) {
		case ACTIONS.QUERY_CONTACTS: {
			const answer = await answerQuery(params.question, contacts);
			return {
				success: true,
				action: "query",
				message: answer,
			};
		}

		case ACTIONS.ADD_OR_UPDATE: {
			const { identifier, name, email, company, phone } = params;

			if (!identifier && !name && !email) {
				return {
					success: false,
					message: ERROR_MESSAGES.noNamesOrEmails,
				};
			}

			const searchTerm = identifier || name || email;
			const existingContact = findContact(contacts, searchTerm);

			// Update existing contact
			if (existingContact) {
				if (name !== null && name !== undefined) existingContact.name = name;
				if (email !== null && email !== undefined)
					existingContact.email = email;
				if (company !== null && company !== undefined)
					existingContact.company = company;
				if (phone !== null && phone !== undefined)
					existingContact.phone = phone;

				return {
					success: true,
					action: "update",
					contact: { ...existingContact },
					message: `Updated ${existingContact.name || existingContact.email}`,
				};
			} else {
				// Create new contact
				const newContact = {
					id: nextId,
					name: name || "",
					email: email || "",
					company: company || "",
					phone: phone || "",
					metadata: {},
					createdAt: new Date().toISOString(),
				};

				return {
					success: true,
					action: "add",
					contact: newContact,
					message: `Added ${newContact.name || newContact.email}`,
				};
			}
		}

		case ACTIONS.DELETE_CONTACT: {
			const contact = findContact(contacts, params.identifier);

			if (!contact) {
				return {
					success: false,
					message: `Contact \"${params.identifier}\" not found`,
				};
			}

			return {
				success: true,
				action: "delete",
				contactId: contact.id,
				message: `Deleted ${contact.name || contact.email}`,
			};
		}

		case "error": {
			return {
				success: false,
				message: parsedAction.message,
			};
		}

		default:
			return {
				success: false,
				message: "Unknown action",
			};
	}
}
