import { MapPin, Phone, Clock } from 'lucide-react'

interface StoreData {
  name?: string
  address?: string
  whatsappPhone?: string
  whatsappDDI?: string
  businessHours?: Array<{ day: number; open: string; close: string; closed: boolean }>
}

interface StoreFooterProps {
  store?: StoreData | null
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function StoreFooter({ store }: StoreFooterProps) {
  const todayHours = store?.businessHours?.find((h) => h.day === new Date().getDay())

  return (
    <footer className="bg-white border-t border-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Identidade */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{store?.name ?? 'Celmapel Festas'}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Sua loja de artigos para festas e doces. Qualidade e variedade para tornar seus momentos especiais.
            </p>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Contato</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {store?.whatsappPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-500 shrink-0" />
                  <a
                    href={`https://wa.me/${store.whatsappDDI ?? '55'}${store.whatsappPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-600 transition-colors"
                  >
                    ({store.whatsappPhone.slice(0, 2)}) {store.whatsappPhone.slice(2)}
                  </a>
                </li>
              )}
              {store?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Horários */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Horários</h4>
            {todayHours && (
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">
                  {todayHours.closed
                    ? 'Fechado hoje'
                    : `Hoje: ${todayHours.open} – ${todayHours.close}`}
                </span>
              </div>
            )}
            {store?.businessHours && (
              <ul className="space-y-0.5 text-xs text-gray-500">
                {store.businessHours.map((h) => (
                  <li key={h.day} className="flex gap-2">
                    <span className="w-8">{DAYS[h.day]}</span>
                    <span>{h.closed ? 'Fechado' : `${h.open} – ${h.close}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} {store?.name ?? 'Celmapel Festas'}. Todos os direitos reservados.</p>
          <a href="/politica-de-privacidade" className="hover:text-gray-600 transition-colors">
            Política de Privacidade
          </a>
        </div>
      </div>
    </footer>
  )
}
