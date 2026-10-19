import { useEffect, useState } from "react";
import { api } from "../services/api";
import { formatarModificador } from "../data/dndPresets";

export function FichaModal({ isOpen, onClose, fichaId, fichaObjeto }) {
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (fichaObjeto) {
      setFicha(fichaObjeto);
    }

    if (fichaId && Number(fichaId) > 0) {
      setLoading(true);
      api
        .get(`/characters/${fichaId}`)
        .then((res) => setFicha(res.data))
        .catch(() => {
          if (!fichaObjeto) {
            alert("Falha ao ler os pergaminhos deste herói.");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, fichaId, fichaObjeto]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors text-xl font-bold"
        >
          ✕
        </button>

        {loading && !ficha ? (
          <p className="text-zinc-500 text-center py-10 animate-pulse">
            Invocando dados da ficha...
          </p>
        ) : !ficha ? (
          <p className="text-zinc-500 text-center py-10">
            Nenhuma ficha vinculada.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-red-500 uppercase">
                {ficha.nome}
              </h2>
              <p className="text-zinc-400 text-sm">
                {ficha.raca || "Aventureiro"} • {ficha.classe || "Guerreiro"} (Nv{" "}
                {ficha.nivel || 1})
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="block text-[10px] text-zinc-500 uppercase">
                  HP Atual / Máx
                </span>
                <span className="text-xl font-bold text-emerald-500">
                  {ficha.pontosDeVidaAtuais} / {ficha.pontosDeVidaMaximos}
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="block text-[10px] text-zinc-500 uppercase">
                  CA
                </span>
                <span className="text-xl font-bold text-zinc-100">
                  🛡️ {ficha.classeArmadura}
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="block text-[10px] text-zinc-500 uppercase">
                  Iniciativa
                </span>
                <span className="text-xl font-bold text-zinc-100">
                  {ficha.iniciativa >= 0 ? `+${ficha.iniciativa}` : ficha.iniciativa}
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="block text-[10px] text-zinc-500 uppercase">
                  Deslocamento
                </span>
                <span className="text-xl font-bold text-sky-400">
                  {ficha.deslocamento || 9}m
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 text-center pt-1">
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
                  className="bg-zinc-950 p-2 rounded border border-zinc-800"
                >
                  <span className="block text-[9px] text-zinc-500 uppercase font-bold">
                    {attr.l}
                  </span>
                  <span className="text-base font-bold text-white block">
                    {formatarModificador(ficha[attr.k] ?? 10)}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ({ficha[attr.k] ?? 10})
                  </span>
                </div>
              ))}
            </div>

            {/* Armas e Equipamentos */}
            {Array.isArray(ficha.equipamento) && ficha.equipamento.length > 0 && (
              <div className="border-t border-zinc-800 pt-3">
                <h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">
                  ⚔️ Armas & Equipamentos
                </h4>
                <div className="space-y-1.5">
                  {ficha.equipamento.map((eq, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded text-xs"
                    >
                      <span className="font-semibold text-zinc-200">
                        {eq.name}
                      </span>
                      <span className="text-red-400 font-mono font-bold">
                        {eq.damage}
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        {eq.properties}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Magias e Habilidades */}
            {Array.isArray(ficha.magia) && ficha.magia.length > 0 && (
              <div className="border-t border-zinc-800 pt-3">
                <h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">
                  ✨ Magias & Habilidades
                </h4>
                <div className="space-y-1.5">
                  {ficha.magia.map((m, i) => (
                    <div
                      key={i}
                      className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold text-purple-400">
                          {m.name}
                        </span>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
