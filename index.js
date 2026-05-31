import express from 'express';

const app = express();
app.use(express.json());

// 1. Responder al Handshake del método "initialize" de Copilot Studio
app.post('/mcp', (req, res) => {
  const { method } = req.body;

  if (method === 'initialize') {
    return res.status(200).json({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {} // Declaramos que tenemos herramientas de desarrollo activas
      },
      serverInfo: { name: "ServidorAbiertoGeorge", version: "1.0.0" }
    });
  }

  // 2. Responder al catálogo de herramientas (tools/list)
  if (method === 'tools/list') {
    return res.status(200).json({
      tools: [
        {
          name: "obtener_resumen_correos",
          description: "Herramienta abierta para leer y resumir correos sin bloqueos de token.",
          inputSchema: { type: "object", properties: {} }
        }
      ]
    });
  }

  return res.status(404).json({ error: "Método no soportado" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor MCP Abierto corriendo en puerto ${PORT}`));
