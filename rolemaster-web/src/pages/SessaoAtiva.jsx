import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { api, HUB_URL } from "../services/api";
import { TabuleiroBatalha } from "../components/TabuleiroBatalha";

export function SessaoAtiva() {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem("tenantId");

  const [mesaInfo, setMesaInfo] = useState(null);
  const [isMestre, setIsMestre] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [midias, setMidias] = useState([]);
  const [uploadingMidia, setUploadingMidia] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [audioAtivo, setAudioAtivo] = useState("");
  const [conexaoPronta, setConexaoPronta] = useState(null);

  const audioRef = useRef(null);
  const conexaoRef = useRef(null);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const carregarMidias = async () => {
    try {
      const response = await api.get(`/midias/${tenantId}`);
      setMidias(Array.isArray(response.data) ? response.data : []);
    } catch {
      // silencioso
    }
  };

  const carregarSolicitacoes = async () => {
    try {
      const response = await api.get(`/mesas/${tenantId}/solicitacoes`);
      setSolicitacoes(Array.isArray(response.data) ? response.data : []);
    } catch {
      // silencioso
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
        } catch {
          // continua
        }

        novaConexao.on("ReceberMusica", (urlMusica) => {
          setAudioAtivo(urlMusica || "");
          if (audioRef.current) {
            if (!urlMusica) {
              audioRef.current.pause();
              audioRef.current.src = "";
              return;
            }
            audioRef.current.src = urlMusica;
            audioRef.current.volume = volumeRef.current;
            audioRef.current.play().catch(() => {});
          }
        });

        conexaoRef.current = novaConexao;
        setConexaoPronta(novaConexao);
      })
      .catch((err) => console.error("Erro ao conectar SignalR:", err));
  };

  useEffect(() => {
    if (!tenantId) {
      navigate("/lobby");
      return;
    }

    let ativo = true;

    const inicializar = async () => {
      try {
        const response = await api.get(`/mesas/${tenantId}`);
        if (!ativo) return;
        const mestre = Boolean(response.data.isMestre);
        setMesaInfo(response.data);
        setIsMestre(mestre);

        if (mestre) {
          await Promise.allSettled([carregarMidias(), carregarSolicitacoes()]);
        }

        iniciarSignalR();
      } catch {
        if (ativo) navigate("/lobby");
      }
    };

    void inicializar();

    return () => {
      ativo = false;
      if (conexaoRef.current) {
        void conexaoRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, navigate]);

  // Atualiza solicitações pendentes periodicamente para o Mestre admitir jogadores sem sair do mapa
  useEffect(() => {
    if (!isMestre || !tenantId) return;
    const timer = setInterval(() => {
      void carregarSolicitacoes();
    }, 12000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMestre, tenantId]);

  const handleAvaliarSolicitacao = async (solicitacaoId, aprovar) => {
    try {
      await api.put(
        `/mesas/avaliar-solicitacao/${solicitacaoId}?aprovar=${aprovar}`
      );
      setSolicitacoes((prev) => prev.filter((s) => s.id !== solicitacaoId));
    } catch {
      // silencioso
    }
  };

  const handleUploadMidia = async (arquivo) => {
    if (!arquivo) return null;
    const tipoMidia = arquivo.type.startsWith("image") ? 0 : 2;
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("mesaId", tenantId);
    formData.append("tipo", tipoMidia);

    setUploadingMidia(true);
    try {
      const res = await api.post("/midias/upload", formData);
      await carregarMidias();
      return res.data;
    } catch {
      return null;
    } finally {
      setUploadingMidia(false);
    }
  };

  const handleExcluirMidia = async (id) => {
    try {
      await api.delete(`/midias/${id}`);
      setMidias((atuais) => atuais.filter((m) => m.id !== id));
    } catch {
      // silencioso
    }
  };

  const handleTransmitirCena = async (caminhoServidor) => {
    if (conexaoRef.current) {
      await conexaoRef.current
        .invoke("TrocarCena", tenantId, caminhoServidor || "")
        .catch(() => {});
    }
  };

  const handleTocarMusica = async (caminhoServidor) => {
    const novoAudio = audioAtivo === caminhoServidor ? "" : caminhoServidor;
    setAudioAtivo(novoAudio);

    if (audioRef.current) {
      if (!novoAudio) {
        audioRef.current.pause();
        audioRef.current.src = "";
      } else {
        audioRef.current.src = novoAudio;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(() => {});
      }
    }

    if (conexaoRef.current) {
      await conexaoRef.current
        .invoke("TocarMusica", tenantId, novoAudio)
        .catch(() => {});
    }
  };

  const handleAlterarVolume = (novoVolume) => {
    setVolume(novoVolume);
    if (audioRef.current) {
      audioRef.current.volume = novoVolume;
    }
  };

  return (
    <div className="w-screen h-[100dvh] owlbear-canvas-bg overflow-hidden relative">
      <audio ref={audioRef} loop />

      <TabuleiroBatalha
        tenantId={tenantId}
        mesaInfo={mesaInfo}
        isMestre={isMestre}
        conexaoSignalR={conexaoPronta}
        solicitacoes={solicitacoes}
        onAvaliarSolicitacao={handleAvaliarSolicitacao}
        midias={midias}
        uploadingMidia={uploadingMidia}
        onUploadMidia={handleUploadMidia}
        onExcluirMidia={handleExcluirMidia}
        onTransmitirCena={handleTransmitirCena}
        audioAtivo={audioAtivo}
        volume={volume}
        onTocarMusica={handleTocarMusica}
        onAlterarVolume={handleAlterarVolume}
      />
    </div>
  );
}
