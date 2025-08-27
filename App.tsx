import { useState } from "react";
import axios from "axios";

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:3001/api/v1/workspace/bot/chat"; // slug = "bot"
  const API_KEY = "MVF317H-WMV4Q7G-MVWDA1N-TVEZ2G7"; // asegúrate de poner la tuya y que esté con "Bearer "

  const sendQuery = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await axios.post(
        API_URL,
        { message: prompt },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
          },
        }
      );

      setResponse(res.data.textResponse || "No se encontró respuesta.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          setResponse("⚠️ 401 Unauthorized\nAPI Key incorrecta o falta el 'Bearer'.");
        } else if (status === 403) {
          setResponse("⚠️ 403 Forbidden\nLa API Key no tiene permisos o la Developer API está deshabilitada.");
        } else if (status === 404) {
          setResponse("⚠️ 404 Not Found\nEndpoint o workspace incorrecto. Verifica el slug del workspace.");
        } else {
          setResponse(`⚠️ Error ${status || "desconocido"}\n${JSON.stringify(data, null, 2)}`);
        }
      } else {
        setResponse("❌ Error inesperado: " + error.message);
      }
    }

    setLoading(false);
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
      </div>
    </div>
  );
}

export default App;
