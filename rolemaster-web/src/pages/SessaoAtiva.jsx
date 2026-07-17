import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { api } from "../services/api";

// URL base do seu servidor C# (ajuste a porta se necessário)
const BACKEND_URL = "https://localhost:7150";

export function SessaoAtiva() {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem("tenantId");

  const [conexao, setConexao] = useState(null);
  const [isMestre, setIsMestre] = useState(false);
  const [cenaAtual, setCenaAtual] = useState("");
  const [midias, setMidias] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Referência para o player de áudio invisível
  const audioRef = useRef(null);

  const verificarAcessoEConectar = async () => {
    try {
      const response = await api.get(`/mesas/${tenantId}`);
      setIsMestre(response.data.isMestre);

      if (response.data.isMestre) {
        carregarMidias();
      }

      iniciarSignalR();
    } catch (error) {
      navigate("/lobby");
    }
  };

  const carregarMidias = async () => {
    try {
      const response = await api.get(`/midias/${tenantId}`);
      setMidias(response.data);
    } catch (error) {
      console.error("Erro ao buscar mídias do Mestre", error);
    }
  };

  const iniciarSignalR = () => {
    const novaConexao = new HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/campanhaHub`)
      .withAutomaticReconnect()
      .build();

    novaConexao
      .start()
      .then(() => {
        console.log("🎲 Conectado ao Túnel de Transmissão!");
        novaConexao.invoke("EntrarNaMesa", tenantId);

        // === OUVIDOS DOS JOGADORES E DO MESTRE ===

        // 1. Ouvir a ordem de trocar a imagem da tela
        novaConexao.on("ReceberNovaCena", (urlImagem) => {
          setCenaAtual(urlImagem);
        });

        // 2. Ouvir a ordem de tocar música
        novaConexao.on("ReceberMusica", (urlMusica) => {
          if (audioRef.current) {
            audioRef.current.src = urlMusica;
            audioRef.current.volume = 0.5; // Deixa num volume agradável
            audioRef.current.play();
          }
        });
      })
      .catch((err) => console.error("Falha ao conectar no Túnel: ", err));

    setConexao(novaConexao);
  };

  useEffect(() => {
    if (!tenantId) {
      navigate("/lobby");
      return;
    }
    verificarAcessoEConectar();

    // Quando sair da tela, desconecta do SignalR para não gastar memória
    return () => {
      if (conexao) conexao.stop();
    };
  }, [tenantId]);

  // === CONTROLES DO MESTRE ===

  const handleUpload = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    // Converte o tipo do arquivo para o número do Enum do C# (0 = Imagem, 2 = Musica)
    const tipoMidia = arquivo.type.startsWith("image") ? 0 : 2;

    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("mesaId", tenantId);
    formData.append("tipo", tipoMidia);

    setUploading(true);
    try {
      await api.post("/midias/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      carregarMidias(); // Recarrega a lista de arquivos
    } catch (error) {
      alert("Falha ao conjurar o arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleExcluirMidia = async (id, e) => {
    e.stopPropagation(); // Impede que o clique "vaze" e acione a transmissão da cena

    if (
      !window.confirm("Deseja realmente dissipar esta magia e apagar a mídia?")
    )
      return;

    try {
      await api.delete(`/midias/${id}`);
      // Remove a mídia apagada da tela instantaneamente sem precisar recarregar o banco
      setMidias(midias.filter((m) => m.id !== id));
    } catch (error) {
      alert("Falha ao excluir a mídia.");
    }
  };

  // === ATUALIZAÇÃO 1: Exibição visual instantânea ===
  const transmitirCena = async (caminhoServidor) => {
    const urlCompleta = caminhoServidor;

    // Atualiza IMEDIATAMENTE a tela do mestre
    setCenaAtual(urlCompleta);

    // Dispara a ordem pelo túnel SignalR logo em seguida
    if (conexao) {
      try {
        await conexao.invoke("TrocarCena", tenantId, urlCompleta);
      } catch (err) {
        console.error("Erro ao avisar os jogadores pelo SignalR:", err);
      }
    }
  };

  const transmitirMusica = async (caminhoServidor) => {
    // 1. Toca a música IMEDIATAMENTE para o Mestre
    if (audioRef.current) {
      // Se a música atual for diferente da clicada, ele troca a fonte.
      // Isso evita que a música reinicie caso você clique nela duas vezes.
      if (audioRef.current.src !== caminhoServidor) {
        audioRef.current.src = caminhoServidor;
      }
      audioRef.current.volume = 0.5;

      // O catch captura o bloqueio do navegador e impede que o site quebre
      audioRef.current.play().catch((err) => {
        console.error("Navegador bloqueou o áudio do Mestre:", err);
      });
    }

    // 2. Dispara a ordem pelo túnel SignalR para os jogadores
    if (conexao) {
      try {
        await conexao.invoke("TocarMusica", tenantId, caminhoServidor);
      } catch (err) {
        console.error("Erro ao enviar música para jogadores:", err);
      }
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex flex-col">
      {/* ATUALIZAÇÃO 2: bg-contain e bg-no-repeat para não cortar a arte */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: cenaAtual ? `url(${cenaAtual})` : "none",
          backgroundColor: cenaAtual ? "#000" : "#09090b",
        }}
      />

      {/* Sobreposição escura para dar clima e não ofuscar menus */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Rádio invisível que toca a música */}
      <audio ref={audioRef} loop />

      {/* Botão de fuga discreto no topo esquerdo */}
      <button
        onClick={() => navigate("/campanha")}
        className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-red-900/80 text-white p-2 rounded-lg backdrop-blur-sm border border-zinc-700 transition-colors"
      >
        ⇦ Retornar
      </button>

      {/* ============================================== */}
      {/* PAINEL DO MESTRE (Só aparece se for o Mestre)  */}
      {/* ============================================== */}
      {isMestre && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-4xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h3 className="text-red-500 font-bold uppercase tracking-wider">
              Painel de Narração
            </h3>

            {/* Input de Upload Disfarçado de Botão */}
            <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-1.5 rounded cursor-pointer transition-colors border border-zinc-700 text-sm font-semibold">
              {uploading ? "Conjurando..." : "+ Upar Mídia (Soma no Banco)"}
              <input
                type="file"
                className="hidden"
                accept="image/*, audio/*"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-6 h-48 overflow-y-auto pr-2 custom-scrollbar">
            {/* Coluna de Imagens */}
            <div>
              <h4 className="text-zinc-400 text-xs mb-3 uppercase font-bold tracking-widest">
                Cenas (Imagens)
              </h4>
              <div className="flex flex-col gap-3">
                {midias
                  .filter((m) => m.tipo === 0)
                  .map((midia) => (
                    <div
                      key={midia.id}
                      className="flex items-center gap-2 w-full group"
                    >
                      <button
                        onClick={() => transmitirCena(midia.caminhoServidor)}
                        className="flex items-center gap-3 text-left text-sm text-zinc-300 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 p-2 rounded border border-zinc-800 transition-colors flex-1 overflow-hidden"
                      >
                        <img
                          src={midia.caminhoServidor}
                          alt={midia.nomeArquivo}
                          className="w-10 h-10 object-cover rounded border border-zinc-700 group-hover:border-zinc-500 transition-colors shrink-0"
                        />
                        <span className="truncate font-medium">
                          {midia.nomeArquivo}
                        </span>
                      </button>

                      {/* Novo Botão de Excluir */}
                      <button
                        onClick={(e) => handleExcluirMidia(midia.id, e)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 rounded border border-transparent hover:border-red-900/50 transition-colors"
                        title="Excluir Mídia"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Coluna de Músicas */}
            <div>
              <h4 className="text-zinc-400 text-xs mb-3 uppercase font-bold tracking-widest">
                Trilha Sonora
              </h4>
              <div className="flex flex-col gap-2">
                {midias
                  .filter((m) => m.tipo === 2)
                  .map((midia) => (
                    <div
                      key={midia.id}
                      className="flex items-center gap-2 w-full group"
                    >
                      <button
                        onClick={() => transmitirMusica(midia.caminhoServidor)}
                        className="text-left text-sm text-emerald-500 hover:text-emerald-400 bg-zinc-900/50 hover:bg-zinc-800 p-3 rounded border border-emerald-900/30 truncate transition-colors font-medium flex-1"
                      >
                        🎵 {midia.nomeArquivo}
                      </button>

                      {/* Novo Botão de Excluir */}
                      <button
                        onClick={(e) => handleExcluirMidia(midia.id, e)}
                        className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 rounded border border-transparent hover:border-red-900/50 transition-colors"
                        title="Excluir Música"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-8 rounded shadow-lg shadow-red-900/20">
              ⚔️ Iniciar Encontro (Em breve)
            </button>
          </div>
        </div>
      )}

      {/* Aviso para o Jogador */}
      {!isMestre && !cenaAtual && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-zinc-500 text-xl font-light tracking-widest animate-pulse">
            O Mestre está preparando a cena...
          </p>
        </div>
      )}
    </div>
  );
}
