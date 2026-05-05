const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
model:"gemini-2.5-flash",
});

const chatWithAI = async (req,res)=>{
try{

const { message } = req.body || {};

if(!message){
return res.json({
reply:
`👋 Hello! I am ClinicMind AI.
Describe your symptoms and I can help with:
`
});
}

const prompt = `
You are a helpful medical assistant.

User query:
${message}

Rules:
- Give a short and clear answer
- Use 2–3 small sentences only
- No headings
- No emojis
- No bold text
- No symbols like ** or formatting
- Use simple language
- Keep it natural like normal conversation

If serious, briefly suggest consulting a doctor.
If non-medical, reply: "I can only help with medical-related questions."
`;

const result = await model.generateContent(prompt);

const aiResponse = result.response.text();

return res.json({
reply: aiResponse
});

}catch(error){
console.error("AI ERROR:",error);

res.status(500).json({
error:"Medical AI error"
});

}
};


const generateDoctorAbout = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "Text is required",
      });
    }

    const prompt = `
Rewrite the following doctor description into 2-3 professional lines.

Rules:
- Make it clear and confident
- Keep it short (max 3 lines)
- Make it patient-friendly
- Do not exaggerate

TEXT:
${text}
`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    res.json({
      result: aiResponse,
    });

  } catch (error) {
    console.error("AI ABOUT ERROR:", error);

    res.status(500).json({
      message: "AI generation failed",
    });
  }
};

module.exports = {
chatWithAI,
 generateDoctorAbout,
};