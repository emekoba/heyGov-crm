import dotenv from "dotenv";
import OpenAI from "openai";
import { encoding_for_model } from "tiktoken";
import { AI_CONFIG, PROMPTS, STOP_WORDS } from "./constants.js";

dotenv.config();

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const encoding = encoding_for_model("gpt-4o-mini");

function countTokens(text: string) {
	const tokens = encoding.encode(text);
	return tokens.length;
}

export async function parseAction(userQuery: string) {
	const prompt = PROMPTS.actionRouter(userQuery);
	const promptTokens = countTokens(prompt);
	const startTime = Date.now();

	try {
		const response = await client.chat.completions.create({
			model: (AI_CONFIG as any).model,
			messages: [{ role: "user", content: prompt }],
			temperature: 0.3,
			max_tokens: 200,
		});

		const text = response.choices[0].message.content.trim();
		const completionTokens = countTokens(text);
		const totalTokens = promptTokens + completionTokens;
		const duration = Date.now() - startTime;

		console.table([
			{
				Type: "Action Parsing",
				Model: AI_CONFIG.model,
				Query:
					userQuery.substring(0, 50) + (userQuery.length > 50 ? "..." : ""),
				"Prompt Tokens": promptTokens,
				"Completion Tokens": completionTokens,
				"Total Tokens": totalTokens,
				"Duration (ms)": duration,
				Temperature: 0.3,
				"Max Tokens": 200,
			},
		]);

		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}

		return null;
	} catch (error) {
		console.error("AI action parsing error:", error);
		return null;
	}
}

function extractKeywordsFromQuery(query: string) {
	const words = query.toLowerCase().match(/\b[a-z]+\b/g) || [];
	return words.filter((w: string) => !STOP_WORDS.includes(w) && w.length > 1);
}

function filterRelevantContacts(contacts: any[], query: string) {
	const keywords = extractKeywordsFromQuery(query);

	if (keywords.length === 0) {
		return contacts.slice(0, AI_CONFIG.maxContactsForContext);
	}

	const scored = contacts.map((contact) => {
		let score = 0;
		const searchFields = [
			contact.name?.toLowerCase() || "",
			contact.email?.toLowerCase() || "",
			contact.company?.toLowerCase() || "",
		].join(" ");

		for (const keyword of keywords) {
			if (searchFields.includes(keyword)) {
				score++;
			}
		}

		return { contact, score };
	});

	const relevant = scored
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, AI_CONFIG.maxContactsForContext)
		.map((item) => item.contact);

	return relevant.length > 0
		? relevant
		: contacts.slice(0, AI_CONFIG.maxContactsForContext);
}

export async function answerQuery(query: string, contacts: any[]) {
	const relevantContacts = filterRelevantContacts(contacts, query);
	const contactsContext = relevantContacts
		.map(
			(c) =>
				`${c.name} (${c.email}) - ${
					c.company || "No company"
				} - Added: ${new Date(c.createdAt).toLocaleDateString()}`
		)
		.join("\n");

	const prompt = PROMPTS.query(query, contactsContext);
	const promptTokens = countTokens(prompt);

	try {
		const response = await client.chat.completions.create({
			model: AI_CONFIG.model,
			messages: [{ role: "user", content: prompt }],
			temperature: AI_CONFIG.queryTemperature,
			max_tokens: AI_CONFIG.queryMaxTokens,
		});

		const answer = response.choices[0].message.content.trim();
		const completionTokens = countTokens(answer);
		const totalTokens = promptTokens + completionTokens;

		console.table([
			{
				Type: "Answer Query",
				Model: AI_CONFIG.model,
				Query: query.substring(0, 50) + (query.length > 50 ? "..." : ""),
				"Contacts Filtered": relevantContacts.length,
				"Prompt Tokens": promptTokens,
				"Completion Tokens": completionTokens,
				"Total Tokens": totalTokens,
				Temperature: AI_CONFIG.queryTemperature,
				"Max Tokens": AI_CONFIG.queryMaxTokens,
			},
		]);

		return answer;
	} catch (error) {
		console.error("AI query error:", error);
		return "I couldn't process that query.";
	}
}
