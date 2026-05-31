import express from 'express';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

// 1. Inicializamos el Servidor MCP oficial de Anthropic
const server = new McpServer({
  name: "ServidorMcpGeorge",
  version: "1.0.0"
});

// 2. Registramos la Herramienta MCP de forma declarativa (Sin endpoints manuales)
server.tool(
  "obtener_resumen_correos",
  {
    cantidad: z.number().optional().default(5).description("Número de correos a recuperar")
  },
  async ({ cantidad }, extra) => {
    try {
      // El SDK de Anthropic nos provee el contexto de la petición web en el argumento 'extra'
      const req = extra?.request;
      
      // Capturamos el token Bearer institucional de Canvia que Microsoft le inyecta a tu contenedor
      const authHeader = req?.headers['authorization'] || req?.headers['Authorization'];
      
      if (!authHeader) {
        return {
          content: [{ type: "text", text: "Error: No se recibió la cabecera de autorización desde Microsoft Copilot." }]
        };
      }

      // Hacemos el fetch directo al endpoint oficial de Microsoft Graph usando el token dinámico
      const graphResponse = await fetch(`https://microsoft.com{cantidad}`, {
        headers: { 'Authorization': authHeader }
      });

      if (!graphResponse.ok) {
        const errorText = await graphResponse.text();
        return {
          content: [{ type: "text", text: `Error en Microsoft Graph: ${graphResponse.statusText} - ${errorText}` }]
        };
      }

      const data = await graphResponse.json();
      
      // Si la bandeja está vacía
      if (!data.value || data.value.length === 0) {
        return {
          content: [{ type: "text", text: "No se encontraron correos electrónicos recientes en la bandeja de entrada." }]
        };
      }

      // Mapeamos los datos puros. Claude Sonnet se encargará de razonar y redactar el resumen final.
      const correos = data.value.map(msg => ({
        de: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address,
        asunto: msg.subject,
        fecha: msg.receivedDateTime,
        vistaPrevia: msg.bodyPreview
      }));

      return {
        content: [{ type: "text", text: JSON.stringify(correos, null, 2) }]
      };

    } catch (error) {
      return {
        content: [{ type: "text", text: `Error interno en el Servidor MCP: ${error.message}` }]
      };
    }
  }
);

// 3. Configuramos Express únicamente para manejar el transporte web (SSE) que exige Copilot Studio
const app = express();
app.use(express.json());

let transport;

// Endpoint obligatorio para que Copilot Studio mantenga el canal abierto (Server-Sent Events)
app.get(['/', '/mcp'], (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  server.connect(transport);
});

// Endpoint obligatorio por donde viajan las llamadas JSON-RPC del protocolo MCP
app.post('/messages', (req, res) => {
  if (transport) {
    transport.handleMessage(req, res);
  } else {
    res.status(500).send("Transporte MCP no inicializado. Realice una petición GET primero.");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor MCP Oficial Anthropic corriendo en puerto ${PORT}`));
