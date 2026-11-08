import { useEffect, useState } from "react";
import { api } from "../services/api";
import { formatarModificador } from "../data/dndPresets";
import {
  gerarPdfFichaAnoUm,
  calcularFichaAnoUm,
} from "../data/anoUmPresets";

export function FichaModal({ isOpen, onClose, fichaId, fichaObjeto }) {
  const [fichaRemota, setFichaRemota] = useState(null);
  const [idCarregado, setIdCarregado] = useState(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const precisaBuscar = Boolean(isOpen && fichaId && Number(fichaId) > 0);

  useEffect(() => {
    if (!precisaBuscar) return;

    let ativo = true;
    api
      .get(`/characters/${fichaId}`)
      .then((res) => {
        if (ativo) {
          setFichaRemota(res.data);
          setIdCarregado(fichaId);
        }
      })
      .catch(() => {
        if (ativo) setIdCarregado(fichaId);
      });

    return () => {
      ativo = false;
    };
  }, [precisaBuscar, fichaId]);

  const ficha =
    precisaBuscar && idCarregado === fichaId && fichaRemota
      ? fichaRemota
      : fichaObjeto || null;
  const loading = precisaBuscar && idCarregado !== fichaId && !fichaObjeto;

  let dadosAnoUm = null;
  if (ficha?.outrasProficienciasEIdiomas) {
    try {
      const parsed = JSON.parse(ficha.outrasProficienciasEIdiomas);
      if (parsed && parsed.sistema === "ano1") {
        dadosAnoUm = {
          ...parsed,
          retratoBase64:
            parsed.retratoBase64 ||
            (ficha.aparenciaDoPersonagem?.startsWith("data:image/")
              ? ficha.aparenciaDoPersonagem
              : ""),
        };
      }
    } catch {
      dadosAnoUm = null;
    }
  }

  const calcAnoUm = dadosAnoUm ? calcularFichaAnoUm(dadosAnoUm) : null;

  const handleBaixarPdfAnoUm = async () => {
    if (!dadosAnoUm || !calcAnoUm || gerandoPdf) return;
    setGerandoPdf(true);
    try {
      await gerarPdfFichaAnoUm(dadosAnoUm, calcAnoUm);
    } finally {
      setGerandoPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85dvh] overflow-y-auto custom-scrollbar"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-colors"
        >
          ✕
        </button>

        {loading && !ficha ? (
          <p className="text-zinc-400 text-center py-10 text-sm">
            Carregando ficha...
          </p>
        ) : !ficha ? (
          <p className="text-zinc-500 text-center py-10 text-sm">
            Nenhuma ficha vinculada.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3 pr-8">
              {(dadosAnoUm?.retratoBase64 ||
                ficha.aparenciaDoPersonagem?.startsWith("data:image/")) && (
                <img
                  src={dadosAnoUm?.retratoBase64 || ficha.aparenciaDoPersonagem}
                  alt={ficha.nome}
                  className="w-16 h-20 object-cover rounded-xl border border-red-500/40 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-white truncate">
                  {ficha.nome}
                </h2>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {ficha.raca || "Aventureiro"} • {ficha.classe || "Guerreiro"} (Nível{" "}
                  {ficha.nivel || 1})
                </p>
                {dadosAnoUm && (
                  <button
                    type="button"
                    onClick={() => void handleBaixarPdfAnoUm()}
                    disabled={gerandoPdf}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>🧟</span>
                    <span>
                      {gerandoPdf ? "Gerando PDF..." : "Baixar PDF Zumbi (Ano 1)"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {dadosAnoUm && calcAnoUm && (
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-red-200 font-bold">
                  <span>🧟 DOSSIÊ ANO UM (1950)</span>
                  <span>
                    Moral {dadosAnoUm.moralAtual ?? 3}/6 • Consciência{" "}
                    {dadosAnoUm.conscienciaAtual ?? 1}/12
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-zinc-950/80 rounded-lg py-1.5 border border-white/5">
                    <span className="block text-[9px] text-zinc-400">FÍSICO (FIS)</span>
                    <strong className="text-red-300">
                      {calcAnoUm.atributosFinais.fisico} ({calcAnoUm.conversao.fisico.bonusTexto})
                    </strong>
                  </div>
                  <div className="bg-zinc-950/80 rounded-lg py-1.5 border border-white/5">
                    <span className="block text-[9px] text-zinc-400">INTELIGÊNCIA</span>
                    <strong className="text-sky-300">
                      {calcAnoUm.atributosFinais.inteligencia} ({calcAnoUm.conversao.inteligencia.bonusTexto})
                    </strong>
                  </div>
                  <div className="bg-zinc-950/80 rounded-lg py-1.5 border border-white/5">
                    <span className="block text-[9px] text-zinc-400">SOCIAL (SOC)</span>
                    <strong className="text-amber-300">
                      {calcAnoUm.atributosFinais.social} ({calcAnoUm.conversao.social.bonusTexto})
                    </strong>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {calcAnoUm.pvPartes.map((m) => (
                    <div
                      key={m.id}
                      className="bg-zinc-950/70 rounded px-2 py-1 border border-white/5 flex justify-between"
                    >
                      <span className="text-zinc-400 truncate">{m.nome}:</span>
                      <strong className="text-emerald-300">{m.pvMax} PV</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="bg-zinc-950/80 border border-white/5 p-2.5 rounded-xl">
                <span className="block text-[10px] text-zinc-500">PV</span>
                <span className="text-base font-bold text-emerald-400">
                  {ficha.pontosDeVidaAtuais}/{ficha.pontosDeVidaMaximos}
                </span>
              </div>
              <div className="bg-zinc-950/80 border border-white/5 p-2.5 rounded-xl">
                <span className="block text-[10px] text-zinc-500">CA</span>
                <span className="text-base font-bold text-zinc-100">
                  {ficha.classeArmadura}
                </span>
              </div>
              <div className="bg-zinc-950/80 border border-white/5 p-2.5 rounded-xl">
                <span className="block text-[10px] text-zinc-500">Iniciativa</span>
                <span className="text-base font-bold text-zinc-100">
                  {ficha.iniciativa >= 0 ? `+${ficha.iniciativa}` : ficha.iniciativa}
                </span>
              </div>
              <div className="bg-zinc-950/80 border border-white/5 p-2.5 rounded-xl">
                <span className="block text-[10px] text-zinc-500">Mov.</span>
                <span className="text-base font-bold text-sky-400">
                  {ficha.deslocamento || 9}m
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 text-center">
              {[
                { k: "forca", l: "FOR" },
                { k: "destreza", l: "DES" },
                { k: "constituicao", l: "CON" },
                { k: "inteligencia", l: "INT" },
                { k: "sabedoria", l: "SAB" },
                { k: "carisma", l: "CAR" },
              ].map((attr) => (
                <div
                  key={attr.k}
                  className="bg-zinc-950/80 p-2 rounded-xl border border-white/5"
                >
                  <span className="block text-[9px] text-zinc-500 font-bold">
                    {attr.l}
                  </span>
                  <span className="text-sm font-bold text-indigo-300 block">
                    {formatarModificador(ficha[attr.k] ?? 10)}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {ficha[attr.k] ?? 10}
                  </span>
                </div>
              ))}
            </div>

            {Array.isArray(ficha.equipamento) && ficha.equipamento.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-zinc-400">
                  Armas & Ataques
                </h4>
                {ficha.equipamento.map((eq, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-zinc-950/80 border border-white/5 px-3 py-2 rounded-xl text-xs"
                  >
                    <span className="font-medium text-zinc-200">{eq.name}</span>
                    <span className="text-indigo-300 font-mono font-semibold">
                      {eq.damage}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {Array.isArray(ficha.magia) && ficha.magia.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-zinc-400">
                  Magias & Habilidades
                </h4>
                {ficha.magia.map((m, i) => (
                  <div
                    key={i}
                    className="bg-zinc-950/80 border border-white/5 px-3 py-2 rounded-xl text-xs"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-zinc-200">{m.name}</span>
                      <span className="text-zinc-500 text-[10px]">
                        Nv {m.slot ?? 0}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        {m.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
