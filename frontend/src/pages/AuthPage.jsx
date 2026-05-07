import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/client'

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [strength, setStrength] = useState(0)

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 2800)
  }

  function calcStrength(pw) {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    setStrength(s)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setErrors({})
    if (!loginEmail) { setErrors({ loginEmail: 'Email requis' }); return }
    if (!loginPassword) { setErrors({ loginPassword: 'Mot de passe requis' }); return }
    setLoading(true)
    try {
      await login(loginEmail, loginPassword)
      showToast('Connecté !')
      setTimeout(() => navigate('/'), 800)
    } catch (err) {
      showToast(err.message, true)
      setErrors({ loginEmail: true, loginPassword: true })
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setErrors({})
    if (!/^[a-zA-Z0-9]{3,20}$/.test(regUsername)) { setErrors({ regUsername: 'Pseudo invalide' }); return }
    if (!regEmail.includes('@')) { setErrors({ regEmail: 'Email invalide' }); return }
    if (regPassword.length < 6) { setErrors({ regPassword: 'Mot de passe trop court (6 min.)' }); return }
    if (regPassword !== regConfirm) { setErrors({ regConfirm: 'Les mots de passe ne correspondent pas' }); return }
    setLoading(true)
    try {
      await register(regUsername, regEmail, regPassword)
      showToast(`Compte créé ! Bienvenue ${regUsername}`)
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      showToast(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  const colors = ['#93000a', '#ba7517', '#6aaa64', '#1D9E75']
  const labels = ['Très faible', 'Faible', 'Bon', 'Excellent']

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface text-on-surface font-body">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-2 rounded-xl font-headline font-bold text-sm shadow-2xl ${toast.isError ? 'bg-error-container text-on-error-container' : 'bg-on-surface text-surface'}`}>
          {toast.msg}
        </div>
      )}

      {/* Logo */}
      <div className="mb-8 card-enter" style={{ animationDelay: '0s' }}>
        <div className="flex justify-center gap-1.5 mb-3">
          {['W','O','R','D','L','E'].map((l, i) => (
            <div key={i} className={`w-9 h-9 flex items-center justify-center text-base font-black font-headline rounded-lg ${
              [0,3,5].includes(i) ? 'bg-primary-container text-on-primary-container' : i===1 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface'
            }`}>{l}</div>
          ))}
        </div>
        <p className="text-center text-on-surface-variant text-xs font-body tracking-widest uppercase">Connectez-vous pour sauvegarder votre historique</p>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-2xl card-enter" style={{ animationDelay: '0.08s' }}>
        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-surface-container-low">
          <button onClick={() => setTab('login')} className={`tab-btn flex-1 py-2 rounded-lg font-headline font-bold text-sm tracking-wider ${tab==='login' ? 'bg-primary-container text-on-primary-container' : 'text-outline-variant hover:text-on-surface-variant'}`}>Connexion</button>
          <button onClick={() => setTab('register')} className={`tab-btn flex-1 py-2 rounded-lg font-headline font-bold text-sm tracking-wider ${tab==='register' ? 'bg-primary-container text-on-primary-container' : 'text-outline-variant hover:text-on-surface-variant'}`}>Créer un compte</button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="p-6 flex flex-col gap-5 card-enter">
            <div>
              <label className="block text-xs font-bold font-headline tracking-widest uppercase text-outline mb-1">Email</label>
              <div className="relative">
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email"
                  className={`input-field ${errors.loginEmail ? 'border-error-container shadow-[0_0_0_3px_rgba(147,0,10,0.15)]' : ''}`} />
                <Icon name="mail" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold font-headline tracking-widest uppercase text-outline">Mot de passe</label>
                <button type="button" onClick={() => showToast('Fonctionnalité à venir 🔧')} className="text-[0.72rem] text-primary bg-transparent border-none cursor-pointer font-headline font-semibold">Oublié ?</button>
              </div>
              <div className="relative">
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  className={`input-field ${errors.loginPassword ? 'border-error-container shadow-[0_0_0_3px_rgba(147,0,10,0.15)]' : ''}`} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <div className="flex items-center gap-3 text-outline-variant text-xs font-headline">
              <div className="flex-1 h-px bg-outline-variant" />ou<div className="flex-1 h-px bg-outline-variant" />
            </div>
            <button type="button" onClick={() => navigate('/')} className="btn-ghost">
              <span className="flex items-center justify-center gap-1.5">
                <Icon name="sports_esports" className="text-base" />
                Jouer sans compte
              </span>
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="p-6 flex flex-col gap-4 card-enter">
            <div>
              <label className="block text-xs font-bold font-headline tracking-widest uppercase text-outline mb-1">Pseudo</label>
              <div className="relative">
                <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="WordleMaster42" autoComplete="username"
                  className={`input-field ${errors.regUsername ? 'border-error-container' : ''}`} />
              </div>
              <p className="text-xs mt-1 text-outline-variant font-body">3 à 20 caractères, lettres et chiffres uniquement</p>
            </div>
            <div>
              <label className="block text-xs font-bold font-headline tracking-widest uppercase text-outline mb-1">Email</label>
              <div className="relative">
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email"
                  className={`input-field ${errors.regEmail ? 'border-error-container' : ''}`} />
                <Icon name="mail" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold font-headline tracking-widest uppercase text-outline mb-1">Mot de passe</label>
              <div className="relative">
                <input type="password" value={regPassword} onChange={e => { setRegPassword(e.target.value); calcStrength(e.target.value) }} placeholder="••••••••" autoComplete="new-password"
                  className={`input-field ${errors.regPassword ? 'border-error-container' : ''}`} />
              </div>
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-[3px] rounded-full flex-1 transition-colors duration-300" style={{ background: i <= strength ? colors[strength-1] : '#41493e' }} />
                  ))}
                </div>
                <p className="text-xs text-outline-variant font-body">
                  {regPassword.length === 0 ? '' : (labels[strength-1] || 'Très faible')}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold font-headline tracking-widest uppercase text-outline mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password"
                  className={`input-field ${errors.regConfirm ? 'border-error-container' : ''}`} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-xs text-on-surface-variant text-center font-body card-enter" style={{ animationDelay: '0.16s' }}>
        Vos données ne sont jamais partagées. 🔒
      </p>
    </div>
  )
}
