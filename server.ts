import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent startup crashes if key is initially empty
let aiClient: any = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Server-side AI Proxy
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt, chatHistory } = req.body;
    let ai;
    try {
      ai = getAIClient();
    } catch {
      return res.status(400).json({ 
        error: "GEMINI_API_KEY is not configured in the host environment. Please set GEMINI_API_KEY in the Secrets panel." 
      });
    }

    const systemInstruction = `You are AlphaAI, the elite Quantitative Trading and Prop Firm Assistant for AlphaFlow Pro.
You help professional traders understand quantitative analysis, mathematical formulations (e.g. Sharpe ratio, Kelly Criterion, drawdown), prop firm rules, and programming automated strategies.
Use professional formatting, bold labels, list metrics, and provide polished code blocks for scripts (like Pine Script, Python, C++, or Excel fórmulas).
Keep answers concise, technical, and directly focused on risk management, risk-to-reward ratio, trade psychology, or mathematical optimizations.`;

    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred in AlphaAI" });
  }
});

async function startServer() {
  // Setup Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
