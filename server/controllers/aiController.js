const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Note = require('../models/Note');
const Student = require('../models/Student');

// We bypass the Google SDK and use native fetch to resolve AQ.* token parsing bugs.

const chatWithAI = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API Key is missing. Please contact administration.' });
    }

    const { message, noteId, history } = req.body;
    
    // Ensure student
    if (!req.user.role || req.user.role.toUpperCase() !== 'STUDENT') {
      // Allow administrators to test the feature
      if (req.user.role && req.user.role.toUpperCase() === 'ADMINISTRATOR') {
        // Proceed for admin testing
      } else {
        return res.status(403).json({ message: 'Only students can access the AI Academic Assistant' });
      }
    }

    const student = await Student.findOne({ user: req.user._id }) || await Student.findOne({ student_user: req.user._id });
    if (!student && req.user.role?.toUpperCase() !== 'ADMINISTRATOR') {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    let documentContext = "";

    // If a document context is requested
    if (noteId) {
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const fullBatchName = student ? (student.batch.includes(student.course) 
        ? student.batch 
        : `${student.course} ${student.batch}`) : 'ADMIN_TEST';

      if (req.user.role?.toUpperCase() !== 'ADMINISTRATOR' && note.batchId !== student.batch && note.batchId !== fullBatchName) {
         return res.status(403).json({ message: 'You do not have access to this document' });
      }

      // Read document text
      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          const fileExtension = path.extname(filePath).toLowerCase();
          
          if (fileExtension === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            documentContext = data.text;
          } else if (fileExtension === '.docx') {
            const result = await mammoth.extractRawText({path: filePath});
            documentContext = result.value;
          } else if (fileExtension === '.txt') {
            documentContext = fs.readFileSync(filePath, 'utf8');
          }
          
          // Truncate to avoid exceeding token limits for large files
          if (documentContext.length > 30000) {
             documentContext = documentContext.substring(0, 30000) + '... [Document truncated]';
          }
        } catch (err) {
           console.error("Error reading document for AI:", err);
           return res.status(500).json({ message: 'Error processing document text: ' + (err.message || String(err)) });
        }
      }
    }

    // Prepare system instruction focusing purely on NEET/JEE
    let systemInstruction = "You are a highly knowledgeable AI Academic Assistant exclusively for students preparing for the NEET and JEE competitive exams in India. Your primary subjects are Physics, Chemistry, Biology, and Mathematics. DO NOT answer questions outside of these academic domains. If a student asks a general knowledge, programming, or non-academic question, politely decline and steer them back to NEET/JEE studies. Be encouraging, explain concepts clearly step-by-step, and provide relevant examples when helpful.";
    
    if (documentContext) {
      systemInstruction += `\n\nThe student is currently reviewing the following study material document. If they ask questions related to the document, use this context to answer:\n\n--- DOCUMENT START ---\n${documentContext}\n--- DOCUMENT END ---`;
    }

    const formattedHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ];

    const apiKey = process.env.GEMINI_API_KEY.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: contents,
        generationConfig: { temperature: 0.3 }
      })
    });

    const data = await fetchResponse.json();

    if (!fetchResponse.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    res.status(500).json({ 
      message: `AI Error: ${error.message || 'Failed to process chat'}`
    });
  }
};

module.exports = {
  chatWithAI
};
