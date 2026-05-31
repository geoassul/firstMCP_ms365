import express from 'express';

const app = express();
app.use(express.json());

app.post(['/', '/mcp'], (req, res) => {
    const method = req.body?.method;
    const id = req.body?.id || 1;
    const params = req.body?.params || {};

    // 1. Initialize
    if (method === 'initialize') {
        return res.status(200).json({
            jsonrpc: "2.0",
            id: id,
            result: {
                protocolVersion: "2024-11-05",
                capabilities: { tools: {} },
                serverInfo: { name: "m365-mcp-server", version: "1.0.0" }
            }
        });
    }

    // 2. Notificación post-initialize (no requiere respuesta)
    if (method === 'notifications/initialized') {
        return res.status(204).send();
    }

    // 3. Lista de herramientas disponibles
    if (method === 'tools/list') {
        return res.status(200).json({
            jsonrpc: "2.0",
            id: id,
            result: {
                tools: [
                    {
                        name: "obtener_resumen_correos",
                        description: "Devuelve un resumen de los correos recientes del usuario.",
                        inputSchema: { 
                            type: "object", 
                            properties: {
                                contacto: {
                                    type: "string",
                                    description: "Email del contacto a filtrar (opcional)"
                                },
                                dias: {
                                    type: "number",
                                    description: "Cantidad de días hacia atrás a analizar"
                                }
                            }
                        }
                    }
                ]
            }
        });
    }

    // 4. EJECUCIÓN DE HERRAMIENTA  ← esto es lo que faltaba
    if (method === 'tools/call') {
        const toolName = params.name;
        const toolArgs = params.arguments || {};

        if (toolName === 'obtener_resumen_correos') {
            // Por ahora respuesta MOCK; aquí irá la llamada real a Graph API
            const resultado = {
                contacto: toolArgs.contacto || "no especificado",
                dias_analizados: toolArgs.dias || 7,
                total_correos: 12,
                resumen: "Demo: 12 correos en los últimos 7 días. 3 requieren respuesta.",
                detalle: [
                    { de: "carlos.alvarado@canvia.com", asunto: "Revisión Q4", estado: "pendiente" },
                    { de: "carlos.alvarado@canvia.com", asunto: "Aprobación cambio", estado: "respondido" }
                ]
            };

            return res.status(200).json({
                jsonrpc: "2.0",
                id: id,
                result: {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(resultado, null, 2)
                        }
                    ]
                }
            });
        }

        // Herramienta desconocida
        return res.status(200).json({
            jsonrpc: "2.0",
            id: id,
            error: {
                code: -32601,
                message: `Herramienta no encontrada: ${toolName}`
            }
        });
    }

    // Cualquier otro método
    return res.status(200).json({
        jsonrpc: "2.0",
        id: id,
        error: {
            code: -32601,
            message: `Método no soportado: ${method}`
        }
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor MCP escuchando en puerto ${PORT}`));
