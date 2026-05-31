import express from 'express';

const app = express();
app.use(express.json());

// Permitimos que Express escuche en ambas rutas simultáneamente
app.post(['/', '/mcp'], (req, res) => {
  const { method } = req.body;

  if (method === 'initialize') {
    return res.status(200).json({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {} 
      },
      serverInfo: { name: "ServidorAbiertoGeorge", version: "1.0.0" }
    });
  }

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

  return res.status(444).json({ error: "Método MCP no soportado dentro de este endpoint" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor MCP Abierto escuchando en puerto ${PORT}`));
