import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';

const ARTICLES = [
  {
    id: 1, emoji: '📈', category: 'Fundamentos',
    title: '¿Qué es un ETF?',
    summary: 'Un ETF (Exchange-Traded Fund) es un fondo de inversión que cotiza en bolsa como una acción. Agrupa múltiples activos en un solo instrumento.',
    content: `Un ETF combina las ventajas de los fondos mutuos con la flexibilidad de las acciones. Al comprar un ETF como el VOO (S&P 500), estás invirtiendo en las 500 empresas más grandes de EE.UU. con una sola transacción.\n\n**Ventajas:**\n• Diversificación instantánea\n• Bajos costos (comisiones desde 0.03%)\n• Liquidez — se compra y vende durante el horario de mercado\n• Transparencia — sabes exactamente qué tienes\n\n**Ejemplo:** Si giftas $100 en VOO, ese dinero queda invertido en Apple, Microsoft, Amazon y otras 497 empresas al mismo tiempo.`,
  },
  {
    id: 2, emoji: '🔄', category: 'Fundamentos',
    title: 'El Poder del Interés Compuesto',
    summary: 'El interés compuesto es cuando tus ganancias generan más ganancias. Einstein lo llamó "la octava maravilla del mundo".',
    content: `El interés compuesto funciona así: si inviertes $100 y ganas 10%, tienes $110. El siguiente año ganas 10% sobre $110, no sobre $100 — son $11 de ganancia, no $10.\n\n**Con el tiempo, la diferencia es enorme:**\n• $100 a 10% anual durante 10 años = $259\n• $100 a 10% anual durante 20 años = $672\n• $100 a 10% anual durante 30 años = $1,745\n\nPor eso regalar inversiones a niños y jóvenes es tan poderoso — tienen décadas por delante.`,
  },
  {
    id: 3, emoji: '🛡️', category: 'Estrategia',
    title: 'Diversificación 101',
    summary: 'No pongas todos los huevos en la misma canasta. La diversificación reduce el riesgo sin sacrificar rentabilidad.',
    content: `La diversificación significa distribuir tu inversión entre diferentes activos para que si uno cae, los otros te protejan.\n\n**Tipos de diversificación:**\n• **Por sector:** Tecnología (QQQ), Bonos (AGG), Internacional (VEA)\n• **Por tamaño:** Grandes empresas (VOO), Pequeñas (IWM)\n• **Por geografía:** EEUU (VTI), Mercados emergentes (VWO)\n\nUn portafolio diversificado típico para un regalo de largo plazo podría ser 80% acciones (VOO) + 20% bonos (BND).`,
  },
  {
    id: 4, emoji: '📅', category: 'Estrategia',
    title: 'Cuándo es el Mejor Momento para Invertir',
    summary: 'La respuesta que nadie quiere escuchar: el mejor momento fue ayer. El segundo mejor es hoy.',
    content: `Tratar de "cronometrar el mercado" — esperar la caída perfecta para comprar — es una estrategia que casi siempre falla, incluso para profesionales.\n\n**Lo que los datos dicen:**\n• El mercado de EE.UU. ha subido en promedio ~10% anual en los últimos 100 años\n• Incluso si compras justo antes de una crisis, históricamente recuperas la inversión en 3-5 años\n• Cada año que esperas sin invertir es un año de capitalización perdida\n\n**Conclusión:** La consistencia y el tiempo en el mercado importan más que el momento perfecto de entrada.`,
  },
  {
    id: 5, emoji: '🎁', category: 'WealthGift',
    title: 'Por Qué Regalar Inversiones',
    summary: 'Los regalos en efectivo se gastan. Los regalos en juguetes se olvidan. Las inversiones crecen.',
    content: `Cuando regalas $100 en un ETF a un niño de 10 años que lo mantiene hasta los 40:\n\n• A una tasa histórica del 10% anual, esos $100 se convierten en **$1,745**\n• El regalo inicial ya no importa — importa el tiempo\n\n**Casos de uso perfectos:**\n• Cumpleaños de sobrinos/ahijados\n• Baby showers — el bebé tiene 18 años para que crezca\n• Graduaciones — empieza el camino financiero con el pie derecho\n• Aniversarios — un regalo que representa el futuro juntos\n\nRegalar inversiones es regalar educación financiera y oportunidad al mismo tiempo.`,
  },
  {
    id: 6, emoji: '🔢', category: 'ETFs Disponibles',
    title: 'Guía de los ETFs en WealthGift',
    summary: 'Conoce cada uno de los 9 ETFs disponibles: qué contienen, su riesgo y para quién son ideales.',
    content: `**Acciones Grandes (baja volatilidad, largo plazo):**\n• VOO — S&P 500: Las 500 empresas más grandes de EE.UU.\n• VTI — Mercado total: Todo el mercado accionario americano (~4,000 empresas)\n\n**Tecnología (mayor crecimiento, mayor riesgo):**\n• QQQ — Nasdaq 100: Apple, Microsoft, Nvidia, Google...\n• VGT — Solo tecnología: Más concentrado que QQQ\n\n**Otros:**\n• IWM — Empresas pequeñas: Mayor potencial, más volatilidad\n• AGG / BND — Bonos: Bajo riesgo, para perfiles conservadores\n• VEA — Mercados desarrollados: Europa, Japón, Australia\n• VWO — Mercados emergentes: China, India, Brasil`,
  },
];

export default function Education() {
  const [openId, setOpenId] = useState<number | null>(null);
  const categories = [...new Set(ARTICLES.map(a => a.category))];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Centro de Educación</h1>
          <p className="text-gray-500 mb-8">Todo lo que necesitas saber sobre inversiones y ETFs.</p>

          {categories.map(cat => (
            <div key={cat} className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</h2>
              <div className="space-y-3">
                {ARTICLES.filter(a => a.category === cat).map(article => (
                  <Card key={article.id} className="overflow-hidden">
                    <button
                      className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => setOpenId(openId === article.id ? null : article.id)}
                    >
                      <span className="text-3xl flex-shrink-0">{article.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{article.title}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{article.summary}</div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openId === article.id ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openId === article.id && (
                      <div className="px-5 pb-5 border-t border-gray-100">
                        <div className="pt-4 text-sm text-gray-700 space-y-2 whitespace-pre-line leading-relaxed">
                          {article.content}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
