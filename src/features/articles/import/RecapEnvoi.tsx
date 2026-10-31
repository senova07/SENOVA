import type { Arret, BilanEnvoi } from './envoi'

export interface Recap extends BilanEnvoi {
  /** Lignes d'échec avec leur rang (1 = première ligne du tableau avant l'envoi) et leur nom. */
  detail: { id: string; rang: number; nom: string; message: string }[]
  /** Lignes valides au-delà du plafond par envoi, restées dans le tableau. */
  reportees: number
}

const CAUSE: Record<Arret, string> = {
  session: 'session expirée : reconnectez-vous, vos lignes sont conservées sur cet appareil',
  limite: 'trop de requêtes : patientez un moment puis relancez, ces lignes sont conservées',
  interrompu: 'envoi interrompu',
}

/** Récapitulatif honnête : créés, en échec (avec le message de l'API), non envoyés, reportés. */
export function RecapEnvoi({ recap, onFermer }: { recap: Recap; onFermer(): void }) {
  const n = recap.crees.length
  const e = recap.echecs.length
  const s = (k: number) => (k > 1 ? 's' : '')
  return (
    <section className="recap" role="status" aria-label="Récapitulatif de l'enregistrement" data-ton={e || recap.nonEnvoyees ? 'alerte' : 'ok'}>
      <div className="recap__tete">
        <p className="recap__titre">
          {n} article{s(n)} créé{s(n)}, {e} en échec
          {recap.nonEnvoyees && recap.arret ? `, ${recap.nonEnvoyees} non envoyé${s(recap.nonEnvoyees)} (${CAUSE[recap.arret]})` : ''}
        </p>
        <button type="button" className="recap__fermer" onClick={onFermer}>Fermer</button>
      </div>
      {recap.reportees ? <p className="recap__aide">{recap.reportees} autre{s(recap.reportees)} ligne{s(recap.reportees)} valide{s(recap.reportees)} restent dans le tableau : l'envoi est limité à 1 000 lignes à la fois. Relancez l'enregistrement.</p> : null}
      {e ? (
        <>
          <p className="recap__aide">Les lignes en échec restent dans le tableau : corrigez-les puis relancez l'enregistrement.</p>
          <ul className="recap__liste">
            {recap.detail.map((d) => (
              <li key={d.id}><strong>Ligne {d.rang} · {d.nom || 'sans nom'}</strong> : {d.message}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}
