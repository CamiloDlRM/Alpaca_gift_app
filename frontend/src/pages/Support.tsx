import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const FAQS = [
  { q: '¿Cómo reclama el destinatario su regalo?', a: 'El destinatario recibe un link único de claim. Al abrirlo, verá los detalles del regalo y deberá completar un proceso de verificación de identidad (KYC) y firmar un acuerdo antes de que se ejecute la inversión.' },
  { q: '¿Qué pasa si el destinatario no reclama el regalo?', a: 'El regalo queda en estado PENDING indefinidamente. El link de claim no expira. Puedes copiar y reenviar el link desde la sección "Mis Regalos" en cualquier momento.' },
  { q: '¿Puedo cancelar un regalo después de enviarlo?', a: 'Si el regalo está en estado PENDING (no ha sido reclamado), contacta a soporte para procesarlo. Una vez que el destinatario inicia el proceso de claim no es posible cancelarlo.' },
  { q: '¿Qué es la comisión del 2.5%?', a: 'Los usuarios del plan gratuito pagan una comisión del 2.5% sobre el monto del regalo para cubrir los costos operativos. Con el plan PRO ($9.99/mes) no hay comisiones y puedes enviar regalos ilimitados.' },
  { q: '¿Mis pagos son seguros?', a: 'Sí. Los pagos son procesados por Stripe, el estándar de la industria para pagos online. WealthGift nunca almacena datos de tu tarjeta.' },
  { q: '¿Cómo veo el rendimiento de un regalo que envié?', a: 'Una vez que el regalo está en estado INVESTED, aparece un botón "Ver" en la sección "Mis Regalos" y en el Dashboard. Desde ahí puedes ver el valor actual y el historial de precios del ETF.' },
  { q: '¿El destinatario puede vender su inversión?', a: 'Sí. Desde su portafolio de destinatario, puede ejecutar una venta que procesa la transferencia del valor actual en 1-3 días hábiles.' },
  { q: '¿Qué ETFs están disponibles?', a: 'Actualmente ofrecemos 9 ETFs: VOO, VTI (Large Cap), QQQ, VGT (Technology), IWM (Small Cap), AGG, BND (Bonds), VEA, VWO (International). Visita el Centro de Educación para conocer cada uno en detalle.' },
];

export default function Support() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // Stub — in production connect to email/ticket system
    setSent(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Soporte</h1>
          <p className="text-gray-500 mb-8">¿Tienes alguna duda? Estamos aquí para ayudarte.</p>

          {/* FAQ */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preguntas frecuentes</h2>
          <div className="space-y-2 mb-10">
            {FAQS.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                >
                  <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIdx === i && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <p className="pt-4 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Contact form */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactar soporte</h2>
          {sent ? (
            <Card className="p-8 text-center bg-green-50 border-green-200">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-green-800 mb-1">Mensaje enviado</h3>
              <p className="text-green-700 text-sm">Te responderemos en menos de 24 horas hábiles.</p>
            </Card>
          ) : (
            <Card className="p-6">
              <form onSubmit={handleSend} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Asunto</label>
                  <input
                    className="rounded-lg border border-gray-200 py-3 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                    placeholder="¿En qué te podemos ayudar?"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Mensaje</label>
                  <textarea
                    className="rounded-lg border border-gray-200 py-3 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
                    rows={5}
                    placeholder="Describe tu problema o pregunta con el mayor detalle posible..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Enviar mensaje</Button>
              </form>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
