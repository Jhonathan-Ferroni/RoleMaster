import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(""); // 1. Variável renomeada para casar com o C#
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      // 2. Agora o pacote vai com as chaves exatas que o .NET espera: { email, senha }
      const response = await api.post("/auth/login", { email, senha });

      // Salva a "chave do castelo" no navegador
      localStorage.setItem("token", response.data.token);

      // Redireciona para a tela de Mesas
      navigate("/lobby");
    } catch (error) {
      setErro("Credenciais inválidas. O guardião bloqueou a entrada.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 tracking-wider uppercase">
            RoleMaster
          </h1>
          <p className="text-zinc-400 mt-2">Acesse sua campanha</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              E-mail do Aventureiro
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Senha Secreta
            </label>
            <input
              type="password"
              value={senha} // 3. Atualizado para usar a nova variável
              onChange={(e) => setSenha(e.target.value)} // 4. Atualizado para usar a nova função
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg shadow-red-900/20"
          >
            Entrar na Taverna
          </button>
        </form>
      </div>
    </div>
  );
}
