module.exports = async function handler(req, res) { const allowedOrigin =
    "https://amankumar140705-create.github.io";

res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
    return res.status(204).end();
}
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({
            error: "AI service is not configured"
        });
    }

    try {
        const { messages } = req.body || {};

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Please send a message"
            });
        }

        if (messages.length > 20) {
            return res.status(400).json({
                error: "Conversation is too long"
            });
        }

        const conversation = messages
            .filter(m =>
                m &&
                ["user", "assistant"].includes(m.role) &&
                typeof m.content === "string"
            )
            .map(m => ({
                role: m.role,
                content: m.content.slice(0, 3000)
            }));

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",
                    messages: [
                        {
                            role: "system",
                            content: "You are ZENOVA AI, a helpful, friendly and intelligent assistant. Explain things clearly and accurately."
                        },
                        ...conversation
                    ],
                    max_completion_tokens: 1000
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(502).json({
                error: "AI service request failed"
            });
        }

        return res.status(200).json({
            reply: data.choices?.[0]?.message?.content ||
                   "I couldn't generate a response."
        });

    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong"
        });
    }
};
