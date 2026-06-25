import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
// Initialize the Google Gen AI SDK
// It automatically looks for an environment variable named GEMINI_API_KEY
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
          urgency: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM"], description: "The priority level." },
          time_block: { type: "string", description: "Suggested execution time window." },
          micro_steps: { type: "array", items: { type: "string" }, description: "3-4 tiny, atomic physical actions." }
        },
        required: ["task_title", "urgency", "time_block", "micro_steps"]
      }
    }
  },
  required: ["triage_plan"]
};

// The core endpoint your frontend will talk to
app.post('/api/triage', async (req, res) => {
  try {
    const { brainDump } = req.body;

    if (!brainDump) {
      return res.status(400).json({ error: "Brain dump text is required." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using the standard high-speed flash model
      contents: brainDump,
      config: {
        systemInstruction: "You are the 'Last-Minute Life Saver' AI. Your job is to take chaotic, stressed, or unstructured text from a user and organize it into an immediate, prioritized triage action plan. You must be supportive, highly efficient, and action-oriented. Break large tasks into ultra-small micro-steps to prevent user paralysis.",
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: triageSchema
      }
    });

    // Parse the structured text string from Gemini back into a true JSON object
    const structuredData = JSON.parse(response.text);
    res.json(structuredData);

  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
// Explicit route to serve the homepage
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});