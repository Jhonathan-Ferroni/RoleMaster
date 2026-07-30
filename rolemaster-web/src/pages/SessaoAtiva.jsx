import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { api } from "../services/api";

// URL base do seu servidor C# corrigida (Render)
const BACKEND_URL = "https://rolemaster-ioyd.onrender.com";

export function SessaoAtiva() {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem("tenantId");

  const [isMestre, setIsMestre] = useState(false);
  const [cenaAtual, setCenaAtual] = useState("");
  const [midias, setMidias] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [arquivoPreview, setArquivoPreview] = useState(null);
  const [urlPreview, setUrlPreview] = useState("");
  const [contagem, setContagem] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [audioAtivo, setAudioAtivo] = useState("");

  // Referência para o player de áudio invisível
  const audioRef = useRef(null);

  // === FIX 1: ref para a conexão, para o cleanup do useEffect sempre
  // enxergar a instância mais recente (evita stale closure) ===
  const conexaoRef = useRef(null);

  // === FIX 2: ref para o volume, para o listener "ReceberMusica"
  // (registrado uma única vez) sempre usar o valor mais recente ===
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const verificarAcessoEConectar = async () => {
    try {
      const response = await api.get(`/mesas/${tenantId}`);
      setIsMestre(response.data.isMestre);

      if (response.data.isMestre) {
        await carregarMidias();
      }

      iniciarSignalR();
    } catch (err) {
      console.error("Erro ao verificar acesso à mesa:", err);
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
      .then(async () => {
        console.log("🎲 Conectado ao Túnel de Transmissão!");
        try {
          await novaConexao.invoke("EntrarNaMesa", tenantId);
          console.log("Mestre entrou no grupo da mesa:", tenantId);
        } catch (err) {
          console.error("Falha ao invocar EntrarNaMesa (mestre):", err);
        }

        // === OUVIDOS DOS JOGADORES E DO MESTRE ===

        // 1. Ouvir a ordem de trocar a imagem da tela
        novaConexao.on("ReceberNovaCena", (urlImagem) => {
          setCenaAtual(urlImagem);
        });

        // 2. Ouvir a ordem de tocar música
        novaConexao.on("ReceberMusica", (urlMusica) => {
          setAudioAtivo(urlMusica);
          if (audioRef.current) {
            audioRef.current.src = urlMusica;
            audioRef.current.volume = volumeRef.current;
            audioRef.current
              .play()
              .catch((e) => console.error("Bloqueio de autoplay:", e));
          }
        });

        conexaoRef.current = novaConexao;
      })
      .catch((err) => console.error("Falha ao conectar no Túnel: ", err));
  };

  useEffect(() => {
    if (!tenantId) {
      navigate("/lobby");
      return;
    }

    let ativo = true;

    const carregarDados = async () => {
      try {
        await verificarAcessoEConectar();
      } catch (err) {
        if (ativo) {
          console.error("Erro ao inicializar sessão:", err);
        }
      }
    };

    void carregarDados();

    return () => {
      ativo = false;
      if (conexaoRef.current) {
        void conexaoRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, navigate]);

  // === CONTROLES DO MESTRE ===

  const handleSelecionarArquivo = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    if (urlPreview) {
      URL.revokeObjectURL(urlPreview);
    }

    setArquivoPreview(arquivo);
    setUrlPreview(URL.createObjectURL(arquivo));
  };

  const confirmarUpload = async () => {
    if (!arquivoPreview) return;

    const tipoMidia = arquivoPreview.type.startsWith("image") ? 0 : 2;
    const formData = new FormData();
    formData.append("arquivo", arquivoPreview);
    formData.append("mesaId", tenantId);
    formData.append("tipo", tipoMidia);

    setUploading(true);
    try {
      await api.post("/midias/upload", formData);
      await carregarMidias();
      cancelarPreview();
    } catch (err) {
      console.error("Falha ao conjurar o arquivo no servidor:", err);
      alert("Falha ao conjurar o arquivo no servidor.");
    } finally {
      setUploading(false);
    }
  };

  const cancelarPreview = () => {
    if (urlPreview) {
      URL.revokeObjectURL(urlPreview);
    }
    setArquivoPreview(null);
    setUrlPreview("");
  };

  const handleExcluirMidia = async (id, e) => {
    e.stopPropagation();

    if (
      !window.confirm("Deseja realmente dissipar esta magia e apagar a mídia?")
    )
      return;

    try {
      await api.delete(`/midias/${id}`);
      setMidias((midiasAtuais) => midiasAtuais.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Falha ao excluir a mídia:", err);
      alert("Falha ao excluir a mídia.");
    }
  };

  const transmitirCena = async (caminhoServidor) => {
    setCenaAtual(caminhoServidor);

    if (conexaoRef.current) {
      try {
        await conexaoRef.current.invoke(
          "TrocarCena",
          tenantId,
          caminhoServidor,
        );
      } catch (err) {
        console.error("Erro ao avisar os jogadores pelo SignalR:", err);
      }
    }
  };

  const transmitirMusica = async (caminhoServidor) => {
    setAudioAtivo(caminhoServidor);

    if (audioRef.current) {
      if (audioRef.current.src !== caminhoServidor) {
        audioRef.current.src = caminhoServidor;
      }
      audioRef.current.volume = volume;

      audioRef.current.play().catch((err) => {
        console.error("Navegador bloqueou o áudio do Mestre:", err);
      });
    }

    if (conexaoRef.current) {
      try {
        await conexaoRef.current.invoke(
          "TocarMusica",
          tenantId,
          caminhoServidor,
        );
      } catch (err) {
        console.error("Erro ao enviar música para jogadores:", err);
      }
    }
  };

  const iniciarConvocacao = () => {
    if (!conexaoRef.current) {
      return alert("A conexão com o túnel ainda não está pronta.");
    }

    let tempo = 5;
    setContagem(tempo);

    const intervalo = setInterval(async () => {
      tempo -= 1;
      setContagem(tempo);

      if (tempo === 0) {
        clearInterval(intervalo);
        try {
          await conexaoRef.current.invoke("ConvocarJogadores", tenantId);
          setContagem(null);
        } catch (err) {
          console.error("Erro ao convocar:", err);
          setContagem(null);
        }
      }
    }, 1000);
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex flex-col">
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: cenaAtual ? `url(${cenaAtual})` : "none",
          backgroundColor: cenaAtual ? "#000" : "#09090b",
        }}
      />

      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <audio ref={audioRef} loop />

      <button
        onClick={() => navigate("/campanha")}
        className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-red-900/80 text-white p-2 rounded-lg backdrop-blur-sm border border-zinc-700 transition-colors"
      >
        ⇦ Retornar
      </button>

      {isMestre && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-4xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          {/* Modal de Preview de Upload */}
          {arquivoPreview && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4">
              <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl text-center max-w-sm w-full shadow-2xl">
                <h3 className="text-white font-bold mb-4">
                  Confirmar Conjuração?
                </h3>
                {arquivoPreview.type.startsWith("image") ? (
                  <img
                    src={urlPreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded mb-4"
                  />
                ) : (
                  <p className="text-zinc-400 mb-4 font-mono text-sm border border-zinc-800 bg-zinc-950 p-2 rounded">
                    🎵 {arquivoPreview.name}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={confirmarUpload}
                    disabled={uploading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold transition-colors"
                  >
                    {uploading ? "Enviando..." : "Confirmar e Salvar"}
                  </button>
                  <button
                    onClick={cancelarPreview}
                    disabled={uploading}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded font-bold transition-colors border border-zinc-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h3 className="text-red-500 font-bold uppercase tracking-wider">
              Painel de Narração
            </h3>

            <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-1.5 rounded cursor-pointer transition-colors border border-zinc-700 text-sm font-semibold">
              {uploading ? "Conjurando..." : "+ Upar Mídia (Soma no Banco)"}
              <input
                type="file"
                className="hidden"
                accept="image/*, audio/*"
                onChange={handleSelecionarArquivo}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-6 h-48 overflow-y-auto pr-2 custom-scrollbar">
            {/* Coluna Imagens */}
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

                      <div className="flex gap-1 bg-zinc-900/50 rounded border border-zinc-800">
                        <a
                          href={midia.caminhoServidor}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-zinc-500 hover:text-blue-400 transition-colors flex items-center justify-center"
                          title="Abrir ou Baixar Mídia"
                          download={midia.nomeArquivo || "midia"}
                        >
                          🔗
                        </a>
                        <button
                          onClick={(e) => handleExcluirMidia(midia.id, e)}
                          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 transition-colors flex items-center justify-center"
                          title="Excluir Mídia"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Coluna Músicas */}
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
                      className="flex flex-col gap-2 w-full group bg-zinc-900/50 p-2 rounded border border-zinc-800"
                    >
                      <div className="flex justify-between items-center w-full">
                        <button
                          onClick={() =>
                            transmitirMusica(midia.caminhoServidor)
                          }
                          className="text-left text-sm text-emerald-500 hover:text-emerald-400 truncate transition-colors font-medium flex-1"
                        >
                          🎵 {midia.nomeArquivo}
                        </button>
                        <div className="flex gap-1">
                          <a
                            href={midia.caminhoServidor}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-zinc-500 hover:text-blue-400 transition-colors"
                            title="Abrir Áudio em Nova Aba"
                            download={midia.nomeArquivo || "audio"}
                          >
                            🔗
                          </a>
                          <button
                            onClick={(e) => handleExcluirMidia(midia.id, e)}
                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 rounded transition-colors"
                            title="Excluir Música"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Controle de Volume Local */}
                      {audioAtivo === midia.caminhoServidor && (
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] text-zinc-500">Vol</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => {
                              const valor = parseFloat(e.target.value);
                              setVolume(valor);
                              if (audioRef.current) {
                                audioRef.current.volume = valor;
                              }
                            }}
                            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              onClick={iniciarConvocacao}
              disabled={contagem !== null}
              className="bg-red-700 hover:bg-red-600 disabled:bg-red-900 text-white font-bold py-2 px-8 rounded shadow-lg shadow-red-900/20 active:scale-95 transition-all"
            >
              {contagem !== null
                ? `Preparando portais em ${contagem}...`
                : "⚔️ Convocar Aventureiros para o Grid"}
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
