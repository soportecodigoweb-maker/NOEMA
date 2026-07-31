'use client';

import { useState, useTransition } from 'react';
import { Save, Plus, Trash2, Check, MessageSquarePlus, LifeBuoy, Eye } from 'lucide-react';
import {
  guardarPlanTerapeutaAction,
  agregarRecursoAction,
  eliminarRecursoAction,
  retroalimentarUsoAction,
  guardarVisibilidadPlanApoyoAction,
  type VisibilidadPlanApoyo,
} from './actions';

interface Recurso {
  id: string;
  tipo: string;
  titulo: string;
  url: string | null;
  nota: string | null;
}
interface Uso {
  id: string;
  fecha: string;
  retroalimentacion: string | null;
}
interface Props {
  vinculacionId: string;
  plan: {
    contacto_nombre: string | null;
    contacto_relacion: string | null;
    contacto_telefono: string | null;
    plan_seguridad: string;
  } | null;
  visibilidad: VisibilidadPlanApoyo;
  recursos: Recurso[];
  usos: Uso[];
}

const OPCIONES_VISIBILIDAD: Array<{ key: keyof VisibilidadPlanApoyo; label: string; desc: string }> = [
  { key: 'ver_lineas_emergencia', label: 'Líneas de emergencia (México)', desc: 'Números de crisis 24/7 y 911.' },
  { key: 'ver_contacto_terapeuta', label: 'Contacto con su terapeuta', desc: 'Llamar o enviarte mensaje a ti.' },
  { key: 'ver_contacto_confianza', label: 'Contacto de confianza y plan de seguridad', desc: 'Persona de confianza y plan personalizado.' },
  { key: 'ver_recursos', label: 'Recursos', desc: 'Los recursos que definas abajo.' },
];

const TIPOS = ['respiracion', 'audio', 'video', 'documento', 'imagen', 'recordatorio', 'enlace', 'otro'];
const TIPO_LABEL: Record<string, string> = {
  respiracion: 'Respiración',
  audio: 'Audio',
  video: 'Video',
  documento: 'Documento',
  imagen: 'Imagen',
  recordatorio: 'Recordatorio',
  enlace: 'Enlace',
  otro: 'Otro',
};

const input = 'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function PlanApoyoTerapeuta({
  vinculacionId,
  plan,
  visibilidad,
  recursos: recursosIni,
  usos,
}: Props) {
  const [, startTransition] = useTransition();

  // Visibilidad: qué secciones ve el paciente.
  const [vis, setVis] = useState<VisibilidadPlanApoyo>(visibilidad);
  const toggleVis = (key: keyof VisibilidadPlanApoyo) => {
    const nuevo = { ...vis, [key]: !vis[key] };
    setVis(nuevo);
    startTransition(() => {
      guardarVisibilidadPlanApoyoAction(vinculacionId, nuevo);
    });
  };

  // Contacto + plan de seguridad
  const [cn, setCn] = useState(plan?.contacto_nombre ?? '');
  const [cr, setCr] = useState(plan?.contacto_relacion ?? '');
  const [ct, setCt] = useState(plan?.contacto_telefono ?? '');
  const [ps, setPs] = useState(plan?.plan_seguridad ?? '');
  const [guardado, setGuardado] = useState(false);

  const guardar = () => {
    startTransition(async () => {
      await guardarPlanTerapeutaAction(vinculacionId, cn, cr, ct, ps);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    });
  };

  // Recursos
  const [recursos, setRecursos] = useState<Recurso[]>(recursosIni);
  const [nt, setNt] = useState('otro');
  const [ntit, setNtit] = useState('');
  const [nurl, setNurl] = useState('');
  const [nnota, setNnota] = useState('');

  const agregarRecurso = () => {
    if (!ntit.trim()) return;
    const tmp = { id: crypto.randomUUID(), tipo: nt, titulo: ntit.trim(), url: nurl.trim() || null, nota: nnota.trim() || null };
    setRecursos((p) => [...p, tmp]);
    setNtit(''); setNurl(''); setNnota('');
    startTransition(async () => {
      const r = await agregarRecursoAction(vinculacionId, tmp.tipo, tmp.titulo, tmp.url ?? '', tmp.nota ?? '');
      if (r.ok && r.id) setRecursos((p) => p.map((x) => (x.id === tmp.id ? { ...x, id: r.id! } : x)));
    });
  };
  const borrarRecurso = (id: string) => {
    setRecursos((p) => p.filter((x) => x.id !== id));
    startTransition(() => { eliminarRecursoAction(id, vinculacionId); });
  };

  return (
    <div className="space-y-8">
      {/* Visibilidad: qué ve el paciente */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h3 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
          <Eye className="size-5 text-noema-sage" /> ¿Qué ve el paciente?
        </h3>
        <p className="mb-3 text-sm text-foreground-muted">
          Elige qué secciones aparecen en el Plan de apoyo del paciente. Se guarda solo.
        </p>
        <div className="space-y-2">
          {OPCIONES_VISIBILIDAD.map((o) => (
            <label
              key={o.key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-noema-deep/10 p-3 hover:border-noema-sage/40"
            >
              <input
                type="checkbox"
                checked={vis[o.key]}
                onChange={() => toggleVis(o.key)}
                className="mt-0.5 size-4 shrink-0 accent-noema-sage"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{o.label}</span>
                <span className="block text-xs text-foreground-muted">{o.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Contacto + plan de seguridad */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h3 className="mb-3 font-serif text-lg text-ink">Contacto de emergencia</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className={input} value={cn} onChange={(e) => setCn(e.target.value)} placeholder="Nombre" />
          <input className={input} value={cr} onChange={(e) => setCr(e.target.value)} placeholder="Relación" />
          <input className={input} type="tel" value={ct} onChange={(e) => setCt(e.target.value)} placeholder="Teléfono" />
        </div>

        <h3 className="mb-2 mt-5 font-serif text-lg text-ink">Plan de seguridad</h3>
        <textarea
          className={`${input} min-h-[140px] leading-relaxed`}
          value={ps}
          onChange={(e) => setPs(e.target.value)}
          placeholder="Estrategias, recordatorios, pasos a seguir, señales de alarma… El paciente podrá verlo y editarlo."
        />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={guardar} className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90">
            <Save className="size-4" /> Guardar
          </button>
          {guardado && (
            <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
              <Check className="size-4" /> Guardado
            </span>
          )}
        </div>
      </section>

      {/* Recursos */}
      <section>
        <h3 className="mb-3 font-serif text-lg text-ink">Recursos para el paciente</h3>
        <div className="space-y-2 rounded-2xl border border-noema-deep/10 bg-white p-4">
          <div className="grid gap-2 sm:grid-cols-[130px_1fr]">
            <select className={input} value={nt} onChange={(e) => setNt(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{TIPO_LABEL[t]}</option>
              ))}
            </select>
            <input className={input} value={ntit} onChange={(e) => setNtit(e.target.value)} placeholder="Título (ej. Audio de respiración 4-7-8)" />
          </div>
          <input className={input} value={nurl} onChange={(e) => setNurl(e.target.value)} placeholder="Enlace (opcional): URL del audio, video, documento…" />
          <input className={input} value={nnota} onChange={(e) => setNnota(e.target.value)} placeholder="Nota o instrucción (opcional)" />
          <button onClick={agregarRecurso} disabled={!ntit.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-noema-sage px-3 py-2 text-sm font-medium text-bone hover:bg-noema-sage/90 disabled:opacity-40">
            <Plus className="size-4" /> Agregar recurso
          </button>
        </div>
        {recursos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {recursos.map((r) => (
              <li key={r.id} className="flex items-start gap-3 rounded-xl border border-noema-deep/10 bg-white px-4 py-3">
                <span className="mt-0.5 shrink-0 rounded bg-noema-sage/10 px-2 py-0.5 text-[11px] text-noema-sage">{TIPO_LABEL[r.tipo] ?? r.tipo}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.titulo}</p>
                  {r.nota && <p className="text-xs text-ink/60">{r.nota}</p>}
                  {r.url && <p className="truncate text-xs text-noema-sage">{r.url}</p>}
                </div>
                <button onClick={() => borrarRecurso(r.id)} aria-label="Eliminar" className="shrink-0 text-ink/30 hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Usos del plan */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
          <LifeBuoy className="size-5 text-noema-clay" /> Veces que usó su Plan de apoyo
        </h3>
        {usos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-6 text-sm text-foreground-muted">
            Tu paciente no ha registrado usos de su plan.
          </p>
        ) : (
          <ul className="space-y-2">
            {usos.map((u) => (
              <UsoItem key={u.id} uso={u} vinculacionId={vinculacionId} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function UsoItem({ uso, vinculacionId }: { uso: Uso; vinculacionId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(uso.retroalimentacion ?? '');
  const [guardado, setGuardado] = useState<string | null>(uso.retroalimentacion);
  const [, startTransition] = useTransition();

  const guardar = () => {
    startTransition(async () => {
      await retroalimentarUsoAction(uso.id, vinculacionId, texto);
      setGuardado(texto.trim() || null);
      setAbierto(false);
    });
  };

  return (
    <li className="rounded-xl border border-noema-clay/20 bg-noema-clay/[0.03] px-4 py-3">
      <p className="text-sm font-medium text-ink">Usó su Plan de apoyo</p>
      <p className="text-xs text-foreground-muted">{uso.fecha}</p>
      {!abierto ? (
        <div className="mt-2">
          {guardado ? (
            <div className="rounded-md bg-white px-3 py-2 text-sm">
              <p className="text-[11px] uppercase tracking-wider text-ink/50">Tu respuesta</p>
              <p className="text-ink/80">{guardado}</p>
              <button onClick={() => setAbierto(true)} className="mt-1 text-xs text-noema-sage hover:underline">Editar</button>
            </div>
          ) : (
            <button onClick={() => setAbierto(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-noema-sage hover:underline">
              <MessageSquarePlus className="size-3.5" /> Responder al paciente
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder="Un mensaje para tu paciente sobre este momento…" className={input} />
          <div className="flex gap-2">
            <button onClick={guardar} className="rounded-md bg-noema-deep px-3 py-1.5 text-xs font-medium text-bone hover:bg-noema-deep/90">Enviar</button>
            <button onClick={() => setAbierto(false)} className="text-xs text-foreground-muted hover:text-ink">Cancelar</button>
          </div>
        </div>
      )}
    </li>
  );
}
