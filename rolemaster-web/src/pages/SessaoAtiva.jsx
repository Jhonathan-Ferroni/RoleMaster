import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { api, HUB_URL, obterUsuarioLogado } from "../services/api";
import { TabuleiroBatalha } from "../components/TabuleiroBatalha";
import { rolarDado, calcularModificador } from "../data/dndPresets";

const PERICIAS_STORYTELLING = [
  { key: "percepcao", label: "Percepção", attr: "sabedoria" },
  { key: "investigacao", label: "Investigação", attr: "inteligencia" },
  { key: "furtividade", label: "Furtividade", attr: "destreza" },
  { key: "intuicao", label: "Intuição", attr: "sabedoria" },
  { key: "persuasao", label: "Persuasão", attr: "carisma" },
  { key: "intimidacao", label: "Intimidação", attr: "carisma" },
  { key: "enganacao", label: "Enganação", attr: "carisma" },
  { key: "arcanismo", label: "Arcanismo", attr: "inteligencia" },
  { key: "atletismo", label: "Atletismo", attr: "forca" },
  { key: "acrobacia", label: "Acrobacia", attr: "destreza" },
  { key: "historia", label: "História", attr: "inteligencia" },
  { key: "natureza", label: "Natureza", attr: "inteligencia" },
  { key: "religiao", label: "Religião", attr: "inteligencia" },
  { key: "medicina", label: "Medicina", attr: "sabedoria" },
  { key: "sobrevivencia", label: "Sobrevivência", attr: "sabedoria" },
  { key: "prestidigitacao", label: "Prestidigitação", attr: "destreza" },
  { key: "atuacao", label: "Atuação", attr: "carisma" },
  { key: "lidarComAnimais", label: "Lidar c/ Animais", attr: "sabedoria" },
];

export function SessaoAtiva() {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem("tenantId");
  const usuarioLogado = obterUsuarioLogado();

  const [isMestre, setIsMestre] = useState(false);
  const [cenaAtual, setCenaAtual] = useState("");
  const [midias, setMidias] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [arquivoPreview, setArquivoPreview] = useState(null);
  const [urlPreview, setUrlPreview] = useState("");
  const [contagem, setContagem] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [audioAtivo, setAudioAtivo] = useState("");
  const [conexaoPronta, setConexaoPronta] = useState(null);

  // === CONTROLE DO MOMENTO DE BATALHA DURANTE O STORYTELLING ===
  const [modoBatalha, setModoBatalha] = useState(false);
  const [estadoBatalhaRemoto, setEstadoBatalhaRemoto] = useState(null);

  // === ROLADOR DE DADOS E TESTES DE PERÍCIA NO STORYTELLING ===
  const [roladorAberto, setRoladorAberto] = useState(false);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [fichaAtivaId, setFichaAtivaId] = useState("");
  const [modoD20Story, setModoD20Story] = useState("normal");
  const [rolagensStory, setRolagensStory] = useState([]);

  const audioRef = useRef(null);
  const conexaoRef = useRef(null);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const verificarAcessoEConectar = async () => {
    try {
      const response = await api.get(`/mesas/${tenantId}`);
      const mestre = Boolean(response.data.isMestre);
      setIsMestre(mestre);

      if (mestre) {
        await carregarMidias();
        const resFichas = await api.get(`/characters/mesa/${tenantId}`);
        const lista = Array.isArray(resFichas.data) ? resFichas.data : [];
        setFichasDisponiveis(lista);
        if (lista.length > 0) setFichaAtivaId(String(lista[0].id));
      } else {
        const resMinhas = await api.get(`/characters/mesa/${tenantId}/minhas`);
        const lista = Array.isArray(resMinhas.data) ? resMinhas.data : [];
        setFichasDisponiveis(lista);
        if (lista.length > 0) setFichaAtivaId(String(lista[0].id));
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
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    novaConexao
      .start()
      .then(async () => {
        try {
          await novaConexao.invoke("EntrarNaMesa", tenantId);
        } catch (err) {
          console.error("Falha ao invocar EntrarNaMesa:", err);
        }

        novaConexao.on("ReceberNovaCena", (urlImagem) => {
          setCenaAtual(urlImagem);
        });

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

        novaConexao.on("ModoBatalhaAlterado", (emBatalha, estadoBatalha) => {
          setModoBatalha(Boolean(emBatalha));
          if (estadoBatalha) {
            setEstadoBatalhaRemoto(estadoBatalha);
          }
        });

        novaConexao.on("ReceberConvocacao", () => {
          setModoBatalha(true);
        });

        novaConexao.on("EstadoBatalhaAtualizado", (estado) => {
          if (estado) {
            setEstadoBatalhaRemoto(estado);
          }
        });

        novaConexao.on("ReceberRolagemStorytelling", (rolagem) => {
          if (rolagem) {
            setRolagensStory((prev) => [
              rolagem,
              ...prev.filter((r) => r.id !== rolagem.id).slice(0, 19),
            ]);
          }
        });

        conexaoRef.current = novaConexao;
        setConexaoPronta(novaConexao);
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

  // === ROLAGENS NO MODO STORYTELLING ===
  const fichaSelecionadaStory = fichasDisponiveis.find(
    (f) => String(f.id) === String(fichaAtivaId),
  );

  const publicarRolagemStory = async (pacote) => {
    setRolagensStory((prev) => [pacote, ...prev.slice(0, 19)]);
    if (conexaoRef.current) {
      try {
        await conexaoRef.current.invoke(
          "EnviarRolagemStorytelling",
          tenantId,
          pacote,
        );
      } catch {
        // fallback local se o Hub remoto ainda não tiver sido atualizado
      }
    }
  };

  const rolarDadoLivreStory = async (faces) => {
    const autor =
      fichaSelecionadaStory?.nome ||
      (isMestre ? "Mestre" : usuarioLogado?.nome || "Aventureiro");

    if (faces === 20 && modoD20Story !== "normal") {
      const d1 = rolarDado(20);
      const d2 = rolarDado(20);
      const escolhido =
        modoD20Story === "vantagem" ? Math.max(d1, d2) : Math.min(d1, d2);
      await publicarRolagemStory({
        id: `${Date.now()}-${Math.random()}`,
        autor,
        titulo: `1d20 (${modoD20Story.toUpperCase()})`,
        detalhe: `[${d1}, ${d2}]`,
        total: escolhido,
        critico: escolhido === 20,
        falha: escolhido === 1,
        horario: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      return;
    }

    const valor = rolarDado(faces);
    await publicarRolagemStory({
      id: `${Date.now()}-${Math.random()}`,
      autor,
      titulo: `1d${faces}`,
      detalhe: `[${valor}]`,
      total: valor,
      critico: faces === 20 && valor === 20,
      falha: faces === 20 && valor === 1,
      horario: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  };

  const rolarPericiaStory = async (pericia) => {
    const autor =
      fichaSelecionadaStory?.nome ||
      (isMestre ? "Mestre" : usuarioLogado?.nome || "Aventureiro");

    // Se a ficha tiver valor explícito da perícia, usa ele; senão usa o modificador do atributo base
    const valorPericiaExplicito = Number(
      fichaSelecionadaStory?.[pericia.key] ?? 0,
    );
    const modAtributo = calcularModificador(
      fichaSelecionadaStory?.[pericia.attr] ?? 10,
    );
    const bonus =
      valorPericiaExplicito !== 0 ? valorPericiaExplicito : modAtributo;

    const d1 = rolarDado(20);
    const d2 = rolarDado(20);
    const d20 =
      modoD20Story === "vantagem"
        ? Math.max(d1, d2)
        : modoD20Story === "desvantagem"
          ? Math.min(d1, d2)
          : d1;

    const total = d20 + bonus;
    const strBonus = bonus >= 0 ? `+ ${bonus}` : `- ${Math.abs(bonus)}`;
    const strDados =
      modoD20Story === "normal" ? `1d20[${d20}]` : `2d20[${d1},${d2}→${d20}]`;

    await publicarRolagemStory({
      id: `${Date.now()}-${Math.random()}`,
      autor,
      titulo: `Teste de ${pericia.label}`,
      detalhe: `${strDados} ${strBonus}`,
      total,
      critico: d20 === 20,
      falha: d20 === 1,
      horario: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  };

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

  const invocarMomentoDeBatalha = async (comContagem = false) => {
    const ativarAgora = async () => {
      setModoBatalha(true);
      let estadoSalvo = null;
      try {
        const bruto = localStorage.getItem(`rolemaster_batalha_${tenantId}`);
        if (bruto) estadoSalvo = JSON.parse(bruto);
      } catch {
        estadoSalvo = null;
      }

      if (conexaoRef.current) {
        try {
          await conexaoRef.current.invoke("ConvocarJogadores", tenantId);
        } catch {
          // continua
        }
        try {
          await conexaoRef.current.invoke(
            "AlternarModoBatalha",
            tenantId,
            true,
            estadoSalvo,
          );
        } catch {
          // fallback
        }
      }
    };

    if (!comContagem) {
      await ativarAgora();
      return;
    }

    let tempo = 3;
    setContagem(tempo);

    const intervalo = setInterval(async () => {
      tempo -= 1;
      setContagem(tempo);

      if (tempo === 0) {
        clearInterval(intervalo);
        setContagem(null);
        await ativarAgora();
      }
    }, 1000);
  };

  const encerrarMomentoDeBatalha = async () => {
    setModoBatalha(false);
    if (conexaoRef.current && isMestre) {
      try {
        await conexaoRef.current.invoke(
          "AlternarModoBatalha",
          tenantId,
          false,
          null,
        );
      } catch {
        // ignora
      }
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex flex-col">
      <audio ref={audioRef} loop />

      {modoBatalha ? (
        <TabuleiroBatalha
          tenantId={tenantId}
          isMestre={isMestre}
          conexaoSignalR={conexaoPronta}
          midias={midias}
          cenaStorytelling={cenaAtual}
          estadoExterno={estadoBatalhaRemoto}
          onVoltarStorytelling={encerrarMomentoDeBatalha}
        />
      ) : (
        <>
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: cenaAtual ? `url(${cenaAtual})` : "none",
              backgroundColor: cenaAtual ? "#000" : "#09090b",
            }}
          />

          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {/* Barra superior de atalhos rápidos */}
          <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
            <button
              onClick={() => navigate("/campanha")}
              className="pointer-events-auto bg-black/60 hover:bg-red-900/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-zinc-700 transition-colors text-sm font-semibold"
            >
              ⇦ Retornar à Campanha
            </button>

            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={() => setRoladorAberto(!roladorAberto)}
                className={`px-4 py-2 rounded-lg backdrop-blur-sm border text-sm font-bold transition-all flex items-center gap-2 ${
                  roladorAberto
                    ? "bg-amber-600 border-amber-400 text-white shadow-lg"
                    : "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-amber-400"
                }`}
              >
                🎲 Dados & Testes de Perícia
              </button>

              <button
                onClick={() => void invocarMomentoDeBatalha(false)}
                className="bg-red-700/90 hover:bg-red-600 text-white px-5 py-2 rounded-lg backdrop-blur-sm border border-red-500 transition-all text-sm font-bold shadow-lg shadow-red-950/50 flex items-center gap-2"
              >
                ⚔️ Abrir Tabuleiro de Batalha
              </button>
            </div>
          </div>

          {/* FEED DE ROLAGENS EM TEMPO REAL NO CANTO SUPERIOR ESQUERDO */}
          {rolagensStory.length > 0 && (
            <div className="absolute top-16 left-4 z-40 w-80 space-y-2 pointer-events-none">
              {rolagensStory.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl backdrop-blur-md border shadow-xl flex justify-between items-center ${
                    r.critico
                      ? "bg-emerald-950/90 border-emerald-400 text-emerald-100"
                      : r.falha
                        ? "bg-red-950/90 border-red-500 text-red-100"
                        : "bg-zinc-950/85 border-zinc-700 text-zinc-100"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold uppercase text-amber-400 block truncate">
                      🎲 {r.autor}
                    </span>
                    <span className="text-xs font-bold block truncate">
                      {r.titulo}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {r.detalhe}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-extrabold font-mono">
                      {r.total}
                    </span>
                    {r.critico && (
                      <span className="block text-[9px] text-emerald-300 font-bold">
                        CRÍTICO!
                      </span>
                    )}
                    {r.falha && (
                      <span className="block text-[9px] text-red-300 font-bold">
                        FALHA!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAINEL FLUTUANTE DE ROLAGEM DE DADOS E PERÍCIAS NO STORYTELLING */}
          {roladorAberto && (
            <div className="absolute top-16 right-4 z-50 w-96 bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  🎲 Rolador de Dados & Testes D&D 5e
                </h4>
                <button
                  onClick={() => setRoladorAberto(false)}
                  className="text-zinc-500 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Seletor de Ficha Ativa para Testes */}
              {fichasDisponiveis.length > 0 && (
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">
                    Rolar como Personagem:
                  </label>
                  <select
                    value={fichaAtivaId}
                    onChange={(e) => setFichaAtivaId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    {fichasDisponiveis.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} ({f.classe} Nv {f.nivel})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Modo Vantagem / Normal / Desvantagem */}
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                {["desvantagem", "normal", "vantagem"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModoD20Story(m)}
                    className={`py-1 rounded text-[10px] font-bold uppercase ${
                      modoD20Story === m
                        ? "bg-amber-600 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dados Poliedrais Rápidos */}
              <div>
                <span className="block text-[10px] text-zinc-400 uppercase font-bold mb-1.5">
                  Dados Livres:
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {[4, 6, 8, 10, 12, 20, 100].map((faces) => (
                    <button
                      key={faces}
                      onClick={() => void rolarDadoLivreStory(faces)}
                      className="bg-zinc-900 hover:bg-amber-700 border border-zinc-700 hover:border-amber-400 text-white py-2 rounded-lg text-xs font-bold font-mono transition-colors"
                    >
                      d{faces}
                    </button>
                  ))}
                </div>
              </div>

              {/* Testes de Perícia da Ficha */}
              <div>
                <span className="block text-[10px] text-zinc-400 uppercase font-bold mb-1.5">
                  Testes de Perícia (1d20 + Bônus):
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {PERICIAS_STORYTELLING.map((per) => {
                    const valExplicito = Number(
                      fichaSelecionadaStory?.[per.key] ?? 0,
                    );
                    const modAttr = calcularModificador(
                      fichaSelecionadaStory?.[per.attr] ?? 10,
                    );
                    const bonus = valExplicito !== 0 ? valExplicito : modAttr;
                    return (
                      <button
                        key={per.key}
                        onClick={() => void rolarPericiaStory(per)}
                        className="flex justify-between items-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 transition-colors"
                      >
                        <span className="truncate">{per.label}</span>
                        <span className="font-mono text-amber-400 font-bold ml-1">
                          {bonus >= 0 ? `+${bonus}` : bonus}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isMestre && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-4xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
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
                  Painel de Narração (Storytelling)
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

                          {audioAtivo === midia.caminhoServidor && (
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-[10px] text-zinc-500">
                                Vol
                              </span>
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

              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center gap-3">
                <span className="text-xs text-zinc-500">
                  Invoque o tabuleiro tático a qualquer momento da narrativa:
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => void invocarMomentoDeBatalha(true)}
                    disabled={contagem !== null}
                    className="bg-red-700 hover:bg-red-600 disabled:bg-red-900 text-white font-bold py-2 px-6 rounded shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                  >
                    {contagem !== null
                      ? `Abrindo portais em ${contagem}...`
                      : "⚔️ Invocar Batalha e Convocar Jogadores"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isMestre && !cenaAtual && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-zinc-500 text-xl font-light tracking-widest animate-pulse">
                O Mestre está preparando a cena...
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
