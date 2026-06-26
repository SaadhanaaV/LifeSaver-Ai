import { fileURLToPath } from 'url';
import path from 'path'; // FIXED: Added missing path utility import statement
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Setup standard ES Modules directory references cleanly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({});

// Define the exact structural schema you saved in AI Studio
const triageSchema = {
  type: "object",
  properties: {
    triage_plan: {
      type: "array",
      description: "A list of prioritized action items compiled from the user's brain dump.",
      items: {
        type: "object",
        properties: {
          task_title: { type: "string", description: "Clear, actionable name of the task." },
          urgency: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], description: "The priority level." }, // FIXED: Added LOW to support defcon room updates
          time_block: { type: "string", description: "Suggested execution time window." },
          micro_steps: { type: "array", items: { type: "string" }, description: "3-4 tiny, atomic physical actions." }
        },
        required: ["task_title", "urgency", "time_block", "micro_steps"]
      }
    }
  },
  required: ["triage_plan"]
};

// Frontend Home Root Direct Fallback Redirector Router
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// The core API endpoint your frontend talks to
app.post('/api/triage', async (req, res) => {
  try {
    const { brainDump } = req.body;

    if (!brainDump) {
      return res.status(400).json({ error: "Brain dump text is required." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: brainDump,
      config: {
        systemInstruction: "You are the 'Last-Minute Life Saver' AI. Your job is to take chaotic, stressed, or unstructured text from a user and organize it into an immediate, prioritized triage action plan. Break large tasks into ultra-small micro-steps to prevent user paralysis.",
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: triageSchema
      }
    });

    const structuredData = JSON.parse(response.text);
    res.json(structuredData);

  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// FIXED: Single Unified Listener Node running on Google Cloud compatible environment configs
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Security matrix core running live on port ${PORT}`);
});