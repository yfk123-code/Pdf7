// netlify/functions/ocr.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Netlify एनवायरनमेंट वेरिएबल से API Key लें
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const base64File = body.file;
        const mimeType = body.type;

        if (!base64File || !mimeType) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'File या Mime Type गायब है।' }),
            };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const prompt = "इस इमेज या डॉक्यूमेंट में से सभी टेक्स्ट को ठीक से पहचानो और केवल टेक्स्ट को ही जवाब के रूप में दो। किसी भी तरह की फॉर्मेटिंग या अतिरिक्त विवरण मत देना।";

        const imagePart = {
            inlineData: {
                data: base64File,
                mimeType: mimeType,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ text: text }),
        };

    } catch (error) {
        console.error("Error processing OCR:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Gemini API से टेक्स्ट निकालते समय कोई समस्या हुई।' }),
        };
    }
};
