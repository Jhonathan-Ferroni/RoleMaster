import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const response = await api.post("/auth/login", { email, senha });
      localStorage.setItem("token", response.data.token);
      navigate("/lobby");
    } catch {
      setErro("E-mail ou senha incorretos. Verifique seus dados.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center owlbear-canvas-bg p-4">
      <div className="w-full max-w-sm bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-7">
        <div className="text-center mb-7">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🎲
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            RoleMaster
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Entre para acessar suas salas de jogo
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-950/40 mt-2"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-zinc-400 pt-3 text-xs">
            Não tem uma conta?{" "}
            <Link
              to="/registro"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
