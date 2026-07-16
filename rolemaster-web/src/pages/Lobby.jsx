import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { api } from "../services/api";

export function Lobby() {
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [mesas, setMesas] = useState([]);
  const navigate = useNavigate();

  const fetchMesas = async () => {
    try {
      const response = await api.get("/mesas");
      console.log("DADOS DO BANCO:", response.data);
      setMesas(response.data);
    } catch (error) {
      console.error("Erro ao buscar mesas:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const claimNome =
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
      setNomeUsuario(decoded[claimNome] || "Aventureiro");

      fetchMesas();
    } catch (error) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    navigate("/login");
  };

  const acessarMesa = (tenantId) => {
    console.log("Tentando acessar a mesa ID:", tenantId);

    if (!tenantId) {
      alert("Erro: O ID da mesa está vazio!");
      return;
    }

    localStorage.setItem("tenantId", tenantId);
    navigate("/campanha");
  };

  const handleCriarMesa = async () => {
    const nomeDaMesa = prompt("Qual o nome da sua nova campanha?");

    if (!nomeDaMesa) return;

    try {
      await api.post("/mesas", { nome: nomeDaMesa });
      fetchMesas();
    } catch (error) {
      alert("Erro ao criar a mesa. O feitiço falhou.");
    }
  };

  const handleSolicitarEntrada = async () => {
    const codigo = prompt(
      "Digite o código de 6 caracteres da mesa (Ex: 8F3A9C):",
    );

    if (!codigo) return;

    try {
      await api.post(`/mesas/solicitar-entrada/${codigo.trim().toUpperCase()}`);
      alert(
        "Solicitação enviada com sucesso! Agora é só aguardar o Mestre aprovar.",
      );
    } catch (error) {
      const mensagemErro =
        error.response?.data ||
        "Erro ao solicitar entrada. Verifique o código e tente novamente.";
      alert(mensagemErro);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center border-b border-zinc-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-red-600 tracking-wider uppercase">
            RoleMaster
          </h1>
          <p className="text-zinc-400 mt-1">
            Bem-vindo(a) à taverna,{" "}
            <span className="text-zinc-100 font-semibold">{nomeUsuario}</span>.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
        >
          Sair do Sistema
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-100">Suas Campanhas</h2>
          <div className="space-x-4">
            <button
              onClick={handleSolicitarEntrada}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-lg transition-colors shadow-lg border border-zinc-700"
            >
              Participar com Código
            </button>
            <button
              onClick={handleCriarMesa}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20"
            >
              + Criar Nova Mesa
            </button>
          </div>
        </div>

        {mesas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl">
            <p className="text-zinc-400 mb-4 text-center">
              Você ainda não participa de nenhuma campanha.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mesas.map((mesa) => (
              <div
                key={mesa.codigoConvite || mesa.CodigoConvite}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg hover:border-red-900/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-zinc-100">
                    {mesa.nome || mesa.Nome}
                  </h3>
                  <span className="text-xs font-mono bg-zinc-950 text-zinc-400 px-2 py-1 rounded border border-zinc-800">
                    ID: {mesa.codigoConvite || mesa.CodigoConvite}
                  </span>
                </div>

                <button
                  onClick={() =>
                    acessarMesa(mesa.codigoConvite || mesa.CodigoConvite)
                  }
                  className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 px-4 rounded transition-colors border border-zinc-700"
                >
                  Entrar na Mesa
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
