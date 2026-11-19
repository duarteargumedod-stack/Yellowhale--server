
const http = require("http");

const PORT = process.env.PORT || 3000;

// Base de conocimientos temporal
const knowledge = new Map();

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,]/g, "")
    .trim();
}

function solve(question) {
  const q = normalize(question);

  for (const [key, answer] of knowledge) {
    if (q.includes(key) || key.includes(q)) {
      return answer;
    }
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
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
      service: "YellowHale Hub",
      ai: "local"
    }));
  }

  if (req.method !== "POST" ||
      !["/solve", "/teach"].includes(req.url)) {
    res.writeHead(404);
    return res.end(JSON.stringify({
      error: "Ruta no encontrada"
    }));
  }

  try {
    let body = "";

    for await (const chunk of req) {
      body += chunk;

      if (body.length > 10000) {
        res.writeHead(413);
        return res.end(JSON.stringify({
          error: "Texto demasiado largo"
        }));
      }
    }

    const data = JSON.parse(body);

    if (req.url === "/teach") {
      if (
        typeof data.question !== "string" ||
        typeof data.answer !== "string" ||
        !data.question.trim() ||
        !data.answer.trim()
      ) {
        res.writeHead(400);
        return res.end(JSON.stringify({
          error: "Pregunta o respuesta inválida"
        }));
      }

      knowledge.set(
        normalize(data.question),
        data.answer.trim()
      );

      return res.end(JSON.stringify({
        success: true,
        message: "Respuesta aprendida"
      }));
    }

    if (typeof data.question !== "string" ||
        !data.question.trim()) {
      res.writeHead(400);
      return res.end(JSON.stringify({
        error: "Falta la pregunta"
      }));
    }

    const answer = solve(data.question);

    return res.end(JSON.stringify({
      found: answer !== null,
      answer: answer || "No conozco todavía esa respuesta."
    }));

  } catch (error) {
    res.writeHead(400);
    return res.end(JSON.stringify({
      error: "Solicitud inválida"
    }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("YellowHale Hub iniciado en puerto " + PORT);
});
  
