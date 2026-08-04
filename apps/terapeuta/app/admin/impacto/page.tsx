import { Sparkles, HeartHandshake, Stethoscope, NotebookPen, CalendarCheck } from 'lucide-react';
import { crearNoemaAi } from '@noema/ai';
import { impactoTotales } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Impacto · Panel de dueño' };

export default async function ImpactoPage() {
  const t = await impactoTotales();

  const cards = [
    { label: 'Pacientes acompañados', valor: t.pacientesAcompanados, icon: HeartHandshake },
    { label: 'Terapeutas apoyados', valor: t.terapeutas, icon: Stethoscope },
    { label: 'Registros emocionales', valor: t.registros, icon: NotebookPen },
    { label: 'Sesiones realizadas', valor: t.sesiones, icon: CalendarCheck },
  ];

  // Análisis breve con IA (si hay clave).
  let narrativa: string | null = null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const ai = crearNoemaAi({ apiKey });
    const r = await ai.generar({
      audiencia: 'clinico',
      instruccion:
        'Escribe 2-3 frases sobre el impacto de NOEMA a partir de estas cifras agregadas, en tono claro y sobrio, sin exagerar ni inventar datos. Habla del acompañamiento entre sesiones.',
      datos: `Pacientes acompañados (vinculaciones activas): ${t.pacientesAcompanados}. Terapeutas: ${t.terapeutas}. Registros emocionales: ${t.registros}. Sesiones realizadas: ${t.sesiones}. Entradas de diario: ${t.diario}. Mensajes: ${t.mensajes}.`,
      maxTokens: 200,
      temperatura: 0.5,
    });
    if (r.ok && r.texto) narrativa = r.texto.trim();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Sparkles className="size-7 text-noema-sage" /> Impacto
        </h1>
        <p className="text-sm text-foreground-muted">
          Alcance de NOEMA: cuántos procesos se acompañan entre sesiones.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-noema-deep/10 bg-white p-5">
            <c.icon className="size-5 text-noema-sage" strokeWidth={1.8} />
            <p className="mt-2 font-serif text-4xl text-ink">{c.valor.toLocaleString('es-MX')}</p>
            <p className="mt-1 text-xs text-foreground-muted">{c.label}</p>
          </div>
        ))}
      </div>

      {narrativa && (
        <section className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.06] p-6">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg text-ink">
            <Sparkles className="size-5 text-noema-sage" /> Lectura del impacto (IA)
          </h2>
          <p className="text-sm leading-relaxed text-ink/85">{narrativa}</p>
        </section>
      )}
    </div>
  );
}
