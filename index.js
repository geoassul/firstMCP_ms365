import express from 'express';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// 1. Instanciamos el servidor MCP oficial
const server = new McpServer({
  name: "ServidorMcpGeorge",
  version: "1.0.0"
});

// 2. Registramos la Herramienta MCP declarativa
server.tool(
  "obtener_resumen_correos",
  {
    cantidad: z.number().optional().default(5).description("Número de correos a recuperar")
  },
  async ({ cantidad }, extra) => {
    try {
      const req = extra?.request;
      const authHeader = req?.headers['authorization'] || req?.headers['Authorization'];
      
      if (!authHeader) {
        return { content: [{ type: "text", text: "Error: Falta cabecera de autorización corporativa." }] };
      }

      const graphResponse = await fetch(`https://microsoft.com{cantidad}`, {
        headers: { 'Authorization': authHeader }
      });

      if (!graphResponse.ok) {
        const errText = await graphResponse.text();
        return { content: [{ type: "text", text: `Error en Graph API: ${errText}` }] };
      }

      const data = await graphResponse.json();
      if (!data.value || data.value.length === 0) {
        return { content: [{ type: "text", text: "Bandeja de entrada sin mensajes recientes." }] };
      }

      const correos = data.value.map(msg => ({
        de: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address,
        asunto: msg.subject,
        fecha: msg.receivedDateTime
      }));

      return { content: [{ type: "text", text: JSON.stringify(correos, null, 2) }] };

    } catch (error) {
      return { content: [{ type: "text", text: `Error interno: ${error.message}` }] };
    }
  }
);

// Mapeamos los estados del transporte SSE de forma global para el ruteo web
let transport = null;

// Endpoint primario GET exigido por Copilot Studio para el Handshake inicial
app.get(['/', '/mcp', '/sse'], async (req, res) => {
  try {
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  } catch (err) {
    console.error("Falla en la conexión del transporte MCP:", err);
    if (!res.headersSent) res.status(500).send(err.message);
  }
});

// Endpoint POST obligatorio donde se transmiten los mensajes JSON-RPC
app.post('/messages', async (req, res) => {
  if (transport) {
    await transport.handleMessage(req, res);
  } else {
    res.status(500).send("El transporte MCP no ha sido inicializado mediante GET.");
  }
});

// Levantamos Express de forma inmediata en el puerto asignado por Google
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Contenedor activo y escuchando en el puerto obligatorio ${PORT}`);
});
