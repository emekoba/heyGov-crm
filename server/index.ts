import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { executeAction, parseAssistantQuery } from "./assistant.js";
import { CONFIG, ERROR_MESSAGES } from "./constants.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let contacts: any[] = [];
let nextId = CONFIG.initialId as number;

app.get("/api/contacts", (req, res) => {
	const { search } = req.query as any;

	if (!search) {
		return res.json(contacts);
	}

	const searchLower = String(search).toLowerCase();
	const filtered = contacts.filter(
		(contact) =>
			contact.name?.toLowerCase().includes(searchLower) ||
			contact.email?.toLowerCase().includes(searchLower) ||
			contact.company?.toLowerCase().includes(searchLower) ||
			contact.phone?.toLowerCase().includes(searchLower)
	);

	res.json(filtered);
});

app.post("/api/contacts", (req, res) => {
	const { name, email, company, phone, notes } = req.body as any;

	if (!name && !email) {
		return res.status(400).json({ error: ERROR_MESSAGES.requiredField });
	}

	const contact = {
		id: nextId++,
		name: name || "",
		email: email || "",
		company: company || "",
		phone: phone || "",
		metadata: notes ? { userInput: notes } : {},
		createdAt: new Date().toISOString(),
	};

	contacts.push(contact);
	res.status(201).json(contact);
});

app.put("/api/contacts/:id", (req, res) => {
	const id = parseInt(req.params.id);
	const contactIndex = contacts.findIndex((c) => c.id === id);

	if (contactIndex === -1) {
		return res.status(404).json({ error: ERROR_MESSAGES.contactNotFound });
	}

	const { name, email, company, phone, notes } = req.body as any;

	if (!name && !email) {
		return res.status(400).json({ error: ERROR_MESSAGES.requiredField });
	}

	contacts[contactIndex] = {
		...contacts[contactIndex],
		name: name || "",
		email: email || "",
		company: company || "",
		phone: phone || "",
		metadata: notes ? { userInput: notes } : {},
	};

	res.json(contacts[contactIndex]);
});

app.delete("/api/contacts/:id", (req, res) => {
	const id = parseInt(req.params.id);
	const contactIndex = contacts.findIndex((c) => c.id === id);

	if (contactIndex === -1) {
		return res.status(404).json({ error: ERROR_MESSAGES.contactNotFound });
	}

	contacts.splice(contactIndex, 1);
	res.status(204).send();
});

app.post("/api/assistant", async (req, res) => {
	const { query } = req.body as any;

	if (!query) {
		return res.status(400).json({ error: ERROR_MESSAGES.queryRequired });
	}

	try {
		const parsedAction = await parseAssistantQuery(query, contacts);
		const result = await executeAction(parsedAction, contacts, nextId);

		if (result.action === "add" && result.contact) {
			contacts.push(result.contact);
			nextId++;
		}

		if (result.action === "update" && result.contact) {
			const index = contacts.findIndex((c) => c.id === result.contact.id);
			if (index !== -1) {
				contacts[index] = result.contact;
			}
		}

		if (result.action === "delete" && result.contactId) {
			const index = contacts.findIndex((c) => c.id === result.contactId);
			if (index !== -1) {
				contacts.splice(index, 1);
			}
		}

		res.json(result);
	} catch (error) {
		console.error("Assistant error:", error);
		res.status(500).json({
			success: false,
			message: ERROR_MESSAGES.processingFailed,
		});
	}
});

app.listen(CONFIG.port, () => {
	console.log(`Server running on http://localhost:${CONFIG.port}`);
});
