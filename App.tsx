import { useState } from "react";
import axios, { AxiosError } from "axios";

// Ajusta estos valores a tu entorno
const WORKSPACE_SLUG = "";
const API_BASE = "http://localhost:3001/api/v1"; // 👈 solo hasta /api/v1
const API_KEY = "Bearer ";

// Cliente Axios
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Authorization: API_KEY,
  },
});

// Traductor de errores
function describeAxiosError(err: unknown) {
  const e = err as AxiosError<any>;
  if (e.request && !e.response) {
    if (e.code === "ECONNABORTED") {
      return {
        title: "Timeout",
        hint: "El servidor tardó demasiado en responder.",
        details: e.message,
      };
    }
    if (e.message?.includes("Network Error")) {
      return {
        title: "Network Error",
        hint:
          "Posible CORS o servidor caído. Si ves 'blocked by CORS', usa un proxy de Vite o habilita CORS en el servidor.",
        details: e.message,
      };
    }
    return {
      title: "Sin respuesta del servidor",
      hint: "Revisa que AnythingLLM esté vivo en el puerto correcto.",
      details: e.message,
    };
  }

  if (e.response) {
    const { status, data } = e.response;
    let title = `HTTP ${status}`;
    let hint = "Error desconocido";
    switch (status) {
      case 401:
        title = "401 Unauthorized";
        hint = "API Key inválida o falta 'Bearer'.";
        break;
      case 403:
        title = "403 Forbidden";
        hint = "Tu API Key no tiene permisos o la Developer API está apagada.";
        break;
      case 404:
        title = "404 Not Found";
        hint = "Verifica el slug del workspace y el endpoint.";
        break;
      case 429:
        title = "429 Rate Limited";
        hint = "Demasiadas peticiones.";
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        title = `Error del servidor (${status})`;
        hint = "Revisa logs de AnythingLLM.";
        break;
    }
    return {
      title,
      hint,
      details:
        typeof data === "string" ? data : JSON.stringify(data, null, 2),
    };
  }

  return {
    title: "Error desconocido",
    hint: "No parece ser error HTTP o de red.",
    details: (e as any).message || String(e),
  };
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [diag, setDiag] = useState<{
    title: string;
    hint: string;
    details: string;
  } | null>(null);

  const sendQuery = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    setDiag(null);

    try {
      const res = await api.post(`/workspace/${WORKSPACE_SLUG}/chat`, {
        message: prompt,
        mode: "chat",
      });

      console.log("Respuesta cruda:", res.data);

      // Auto-detección del campo que trae la respuesta
      const respuesta =
        res.data.textResponse ||
        res.data.response ||
        res.data.answer ||
        res.data.message ||
        "⚠️ No se encontró respuesta en el payload.";

      setResponse(respuesta);
    } catch (error) {
      const info = describeAxiosError(error);
      console.error("[AnythingLLM error]", info);
      setDiag(info);
      setResponse("Error al conectar con AnythingLLM.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">
          Chat con AnythingLLM
        </h1>

        <textarea
          className="w-full p-3 border rounded-lg mb-3"
          placeholder="Escribe tu consulta..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={sendQuery}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Consultando..." : "Enviar"}
        </button>

        <div className="mt-4 p-3 border rounded-lg bg-gray-50 min-h-[100px]">
          {loading ? (
            <p className="text-gray-500">Esperando respuesta...</p>
          ) : (
            <p className="whitespace-pre-line">{response}</p>
          )}
        </div>

        {diag && (
          <div className="mt-4 p-3 border rounded-lg bg-red-50">
            <p className="font-semibold text-red-700">⚠️ {diag.title}</p>
            <p className="text-red-800 text-sm mt-1">{diag.hint}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-700">
                Ver detalles técnicos
              </summary>
              <pre className="text-xs mt-2 overflow-auto max-h-48">
                {diag.details}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
