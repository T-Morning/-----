import { GoogleGenAI } from "@google/genai";
import { GoBoardState } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const getGoTutorAdvice = async (board: GoBoardState, lastMove: {x: number, y: number} | null, currentPlayer: number) => {
  try {
    const ai = getClient();
    
    // Construct a simple visual representation for the LLM
    const size = board.length;
    let boardStr = `Board Size: ${size}x${size}\n`;
    boardStr += `Current Turn: ${currentPlayer === 1 ? 'Black' : 'White'}\n`;
    if (lastMove) {
      boardStr += `Last Move: (${lastMove.x}, ${lastMove.y})\n`;
    }
    boardStr += "Board State (0=Empty, 1=Black, 2=White):\n";
    
    for (let y = 0; y < size; y++) {
      boardStr += board[y].join(' ') + '\n';
    }

    const prompt = `
      You are a professional Weiqi (Go) teacher. I am a beginner learning to play.
      Analyze the current board state provided below.
      
      Tasks:
      1. Briefly evaluate the current situation (who is leading, weak groups).
      2. Suggest the ONE best next move for the current player using coordinates (x, y) where x is column (0-${size-1}) and y is row (0-${size-1}).
      3. Explain WHY this move is good in simple terms (e.g., "protects the corner", "attacks the group", "makes a base").
      
      Keep the response concise and encouraging.
      
      ${boardStr}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful and patient Go tutor.",
        thinkingConfig: { thinkingBudget: 1024 } // Use a bit of thinking for better analysis
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble analyzing the board right now. Please check your connection or API key.";
  }
};