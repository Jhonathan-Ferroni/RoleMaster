import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Registro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      // Endpoint alinhado com o [HttpPost("registrar")]
      await api.post("/auth/registrar", {
        nome,
        email,
        senha,
      });

      alert("Aventureiro registrado com sucesso! Faça seu login.");
      navigate("/login");
    } catch (error) {
      // Lendo o campo "message" retornado pelo BadRequest do seu C#
      setErro(
        error.response?.data?.message ||
          "Erro ao forjar sua conta. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 tracking-wider uppercase mb-2">
            RoleMaster
          </h1>
          <p className="text-zinc-400">Junte-se à guilda.</p>
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-900 text-red-400 p-3 rounded mb-6 text-sm text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleRegistro} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">
              Como devemos chamá-lo?
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded focus:outline-none focus:border-red-700 transition-colors"
              placeholder="Seu Nome"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded focus:outline-none focus:border-red-700 transition-colors"
              placeholder="email@guilda.com"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded focus:outline-none focus:border-red-700 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-600 disabled:bg-red-900 text-white font-bold py-3 rounded-lg transition-colors mt-6 shadow-lg shadow-red-900/20"
          >
            {loading ? "Forjando conta..." : "Criar Conta"}
          </button>
        </form>

        <p className="text-center text-zinc-400 mt-6 text-sm">
          Já faz parte da guilda?{" "}
          <Link
            to="/login"
            className="text-red-500 hover:text-red-400 font-semibold transition-colors"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
