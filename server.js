
const http = require("http");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && req.url === "/") {
    return res.end(JSON.stringify({
      status: "online",
      service: "YellowHale Hub AI"
    }));
  }

  if (req.method !== "POST" || req.url !== "/solve") {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: "Ruta no encontrada" }));
  }

  if (!API_KEY) {
    res.writeHead(503);
    return res.end(JSON.stringify({ error: "IA no configurada" }));
  }

  try {
    let body = "";

    for await (const chunk of req) {
      body += chunk;
      if (body.length > 10000) {
        res.writeHead(413);
        return res.end(JSON.stringify({ error: "Texto demasiado largo" }));
      }
    }

    const data = JSON.parse(body);
    const question = data.question;

    if (typeof question !== "string" || !question.trim()) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "Falta la pregunta" }));
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-6.2-sol",
        instructions:
          "Analiza acertijos. Responde en el idioma de la pregunta. " +
          "No inventes datos. Si falta información, dilo claramente. " +
          "Devuelve una respuesta breve y explica si no estás seguro.",
        input: question
      })
    });

    const result = await response.json();

    if (!response.ok) {
      res.writeHead(502);
      return res.end(JSON.stringify({ error: "Error al consultar la IA" }));
    }

    const answer = (result.output || [])
  .flatMap(item => item.content || [])
  .filter(part => part.type === "output_text")
  .map(part => part.text)
  .join("\n");

res.end(JSON.stringify({
  answer: answer || "No se obtuvo una respuesta."
}));

  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("YellowHale Hub AI iniciado en el puerto " + PORT);
});
          
