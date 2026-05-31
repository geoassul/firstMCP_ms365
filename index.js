import express from 'express';

const app = express();
app.use(express.json());

app.post(['/', '/mcp'], (req, res) => {
  const method = req.body?.method;
  const id = req.body?.id || 1; // Capturamos el ID de la petición JSON-RPC

  // 1. Si Microsoft pide la lista de herramientas
  if (method === 'tools/list') {
    return res.status(200).json({
      jsonrpc: "2.0",
      id: id,
      result: { // <-- OBLIGATORIO: Todo debe ir dentro de 'result'
        tools: [
          {
            name: "obtener_resumen_correos",
            description: "Herramienta abierta para leer y resumir correos sin bloqueos de token.",
            inputSchema: { type: "object", properties: {} }
          }
        ]
      }
    });
  }

  // 2. Para 'initialize' o cualquier otra petición de control/saludo de Microsoft
  return res.status(200).json({
    jsonrpc: "2.0",
    id: id,
    result: { // <-- OBLIGATORIO: Mapeo correcto para que Microsoft no lo marque vacío
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {} 
      },
      serverInfo: { 
        name: "m365-mcp-server", 
        version: "1.0.0" 
      }
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor MCP Estricto y Exitoso en puerto ${PORT}`));
