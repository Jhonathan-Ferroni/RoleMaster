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
      await api.post("/auth/registrar", {
        nome,
        email,
        senha,
      });
      navigate("/login");
    } catch (error) {
      setErro(
        error.response?.data?.message ||
          "Não foi possível criar sua conta. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen owlbear-canvas-bg flex flex-col justify-center items-center p-4">
      <div className="max-w-sm w-full bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-7 shadow-2xl">
        <div className="text-center mb-7">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🎲
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Criar Conta
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Comece a jogar ou mestrar em segundos
          </p>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-xs text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleRegistro} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              Nome de exibição
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-zinc-950/80 border border-white/10 text-zinc-100 px-3.5 py-2.5 rounded-xl text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Como seus amigos te chamam"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950/80 border border-white/10 text-zinc-100 px-3.5 py-2.5 rounded-xl text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="voce@exemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-zinc-950/80 border border-white/10 text-zinc-100 px-3.5 py-2.5 rounded-xl text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2 shadow-lg shadow-indigo-950/40"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-zinc-400 mt-5 text-xs">
          Já possui conta?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
