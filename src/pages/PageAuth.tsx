import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bouton } from '@/components/ui/Bouton'
import { ChampTexte } from '@/components/ui/Formulaire'
import { Logo } from '@/components/ui/Logo'
import { ErreurApi } from '@/services/http'
import { useSession } from '@/store/sessionContext'

function Cadre({
  titre,
  sousTitre,
  pied,
  children,
}: {
  titre: string
  sousTitre: string
  pied: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="auth">
      <aside className="auth__marque" aria-hidden="true">
        <span className="auth__facette" />
        <h2>L'utilisateur fait son métier ; SENOVA s'occupe du reste.</h2>
        <p>Clients, devis, factures et paiements, au même endroit.</p>
      </aside>
      <main className="auth__panneau">
        <Logo className="auth__logo" />
        <h1 className="auth__titre">{titre}</h1>
        <p className="auth__sous">{sousTitre}</p>
        {children}
        <p className="auth__pied">{pied}</p>
      </main>
    </div>
  )
}

function useSoumission(action: () => Promise<void>) {
  const [erreur, setErreur] = useState<ErreurApi | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const navigate = useNavigate()
  const lieu = useLocation()
  const depuis = (lieu.state as { depuis?: string } | null)?.depuis ?? '/'

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      await action()
      navigate(depuis, { replace: true })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err : new ErreurApi(0, 'Une erreur est survenue.'))
    } finally {
      setEnvoi(false)
    }
  }
  return { erreur, envoi, soumettre }
}

const erreurChamp = (erreur: ErreurApi | null, champ: string) =>
  erreur?.details.find((d) => d.field === champ)?.message

export function PageConnexion() {
  const { seConnecter } = useSession()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const { erreur, envoi, soumettre } = useSoumission(() => seConnecter(email, motDePasse))

  return (
    <Cadre
      titre="Connexion"
      sousTitre="Retrouvez votre activité là où vous l'avez laissée."
      pied={
        <>
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={soumettre} noValidate>
        {erreur ? <p className="alerte-form" role="alert">{erreur.message}</p> : null}
        <ChampTexte
          libelle="Adresse e-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erreur={erreurChamp(erreur, 'email')}
        />
        <ChampTexte
          libelle="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          erreur={erreurChamp(erreur, 'motDePasse')}
        />
        <Bouton type="submit" variante="primaire" taille="lg" bloc disabled={envoi}>
          {envoi ? 'Connexion…' : 'Se connecter'}
        </Bouton>
      </form>
    </Cadre>
  )
}

export function PageInscription() {
  const { sInscrire } = useSession()
  const [valeurs, setValeurs] = useState({
    nomComplet: '',
    email: '',
    motDePasse: '',
    nomOrganisation: '',
  })
  const { erreur, envoi, soumettre } = useSoumission(() => sInscrire(valeurs))
  const champ = (cle: keyof typeof valeurs) => ({
    value: valeurs[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValeurs((v) => ({ ...v, [cle]: e.target.value })),
    erreur: erreurChamp(erreur, cle),
    required: true,
  })

  return (
    <Cadre
      titre="Créer votre compte"
      sousTitre="Votre espace de gestion est prêt en quelques secondes."
      pied={
        <>
          Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={soumettre} noValidate>
        {erreur ? <p className="alerte-form" role="alert">{erreur.message}</p> : null}
        <ChampTexte libelle="Nom complet" autoComplete="name" {...champ('nomComplet')} />
        <ChampTexte libelle="Nom de votre activité" autoComplete="organization" {...champ('nomOrganisation')} />
        <ChampTexte libelle="Adresse e-mail" type="email" autoComplete="email" {...champ('email')} />
        <ChampTexte
          libelle="Mot de passe"
          type="password"
          autoComplete="new-password"
          aide="8 caractères minimum."
          {...champ('motDePasse')}
        />
        <Bouton type="submit" variante="primaire" taille="lg" bloc disabled={envoi}>
          {envoi ? 'Création…' : 'Créer mon compte'}
        </Bouton>
      </form>
    </Cadre>
  )
}
