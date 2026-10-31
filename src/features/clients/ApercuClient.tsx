import type { ReactNode } from 'react'
import { Badge } from '@/ui/Badge'
import type { Client } from '@shared/clients'

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="fiche-section">
      <h2 className="fiche-section__titre">{titre}</h2>
      {children}
    </section>
  )
}

function Champ({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="fiche-champ">
      <dt>{libelle}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Vue d'ensemble : entreprise, adresses, contacts et notes, en sections à filet. */
export function ApercuClient({ client }: { client: Client }) {
  const adresses = client.adresses ?? []
  const contacts = client.contacts ?? []
  return (
    <div className="fiche-grille">
      {client.nature === 'entreprise' ? (
        <Section titre="Entreprise">
          <dl className="fiche-champs">
            <Champ libelle="SIREN">{client.siren ?? '—'}</Champ>
            <Champ libelle="SIRET">{client.siret ?? '—'}</Champ>
            <Champ libelle="TVA intracommunautaire">{client.tvaIntracom ?? '—'}</Champ>
          </dl>
        </Section>
      ) : null}

      <Section titre="Adresses">
        {adresses.length === 0 ? (
          <p className="client-vide">Aucune adresse enregistrée.</p>
        ) : (
          <ul className="fiche-blocs">
            {adresses.map((a) => (
              <li key={a.id}>
                <p className="fiche-blocs__titre">
                  {a.libelle}
                  {a.parDefaut ? <Badge ton="info">Par défaut</Badge> : null}
                </p>
                <address>
                  {a.ligne1}
                  {a.ligne2 ? <br /> : null}
                  {a.ligne2}
                  <br />
                  {a.codePostal} {a.ville}
                  {a.pays && a.pays !== 'FR' ? ` (${a.pays})` : ''}
                </address>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section titre="Contacts">
        {contacts.length === 0 ? (
          <p className="client-vide">Aucun contact secondaire.</p>
        ) : (
          <ul className="fiche-blocs">
            {contacts.map((c) => (
              <li key={c.id}>
                <p className="fiche-blocs__titre">
                  {c.nom}
                  {c.role ? <span className="client-vide"> · {c.role}</span> : null}
                </p>
                {c.telephone ? (
                  <p>
                    <a href={`tel:${c.telephone}`}>{c.telephone}</a>
                  </p>
                ) : null}
                {c.email ? (
                  <p>
                    <a href={`mailto:${c.email}`}>{c.email}</a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section titre="Notes internes">
        {client.notes ? <p className="fiche-notes">{client.notes}</p> : <p className="client-vide">Aucune note.</p>}
      </Section>
    </div>
  )
}
