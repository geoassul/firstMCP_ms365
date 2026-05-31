import express from 'express';

const app = express();
app.use(express.json());

app.post(['/', '/mcp'], (req, res) => {
  // Capturamos el método enviado en el body (manejamos un fallback por si viene vacío)
  const method = req.body?.method;

  // Si Microsoft solicita explícitamente el catálogo de herramientas
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

  // Para 'initialize' o cualquier otra petición de control/saludo de Microsoft,
  // respondemos con éxito 200 OK para no bloquear el canal.
  return res.status(200).json({
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {} 
    },
    serverInfo: { name: "ServidorAbiertoGeorge", version: "1.0.0" }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor MCP Abierto y Flexible en puerto ${PORT}`));
