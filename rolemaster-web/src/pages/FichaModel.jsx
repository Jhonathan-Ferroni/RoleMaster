import { useEffect, useState } from "react";
import { api } from "../services/api";

export function FichaModal({ isOpen, onClose, fichaId }) {
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && fichaId) {
      setLoading(true);
      api
        .get(`/characters/${fichaId}`)
        .then((res) => setFicha(res.data))
        .catch(() => alert("Falha ao ler os pergaminhos deste herói."))
        .finally(() => setLoading(false));
    }
  }, [isOpen, fichaId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors text-xl font-bold"
        >
          ✕
        </button>

        {loading || !ficha ? (
          <p className="text-zinc-500 text-center py-10 animate-pulse">
            Invocando dados...
          </p>
        ) : (
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-red-500 uppercase">
                {ficha.nome}
              </h2>
              <p className="text-zinc-400 text-sm">
                {ficha.raca} • {ficha.classe} (Nv {ficha.nivel})
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="block text-[10px] text-zinc-500 uppercase">
                  HP Atual
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  {ficha.pontosDeVidaAtuais}
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="block text-[10px] text-zinc-500 uppercase">
                  CA
                </span>
                <span className="text-2xl font-bold text-zinc-100">
                  {ficha.classeArmadura}
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="block text-[10px] text-zinc-500 uppercase">
                  Iniciativa
                </span>
                <span className="text-2xl font-bold text-zinc-100">
                  {ficha.iniciativa}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 text-center pt-2">
              {[
                "forca",
                "destreza",
                "constituicao",
                "inteligencia",
                "sabedoria",
                "carisma",
              ].map((attr) => (
                <div
                  key={attr}
                  className="bg-zinc-950 p-2 rounded border border-zinc-800"
                >
                  <span className="block text-[9px] text-zinc-500 uppercase">
                    {attr.substring(0, 3)}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {ficha[attr]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
