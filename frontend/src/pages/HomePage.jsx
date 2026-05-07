import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, getLeaderboards, isLoggedIn } from '../api/client'

const EMPTY_LEADERBOARDS = {
  current_score: [],
  best_streak: [],
  average_score: [],
  daily_challenge: [],
}

function todayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export default function HomePage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(() => localStorage.getItem('wordle_language') || 'fr')
  const [leaderboards, setLeaderboards] = useState(EMPTY_LEADERBOARDS)
  const [history, setHistory] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const data = await getLeaderboards()
        if (!ignore) setLeaderboards(data)
      } catch {
        if (!ignore) setLeaderboards(EMPTY_LEADERBOARDS)
      }

      if (!isLoggedIn()) return
      try {
        const data = await getHistory()
        if (!ignore) setHistory(data)
      } catch {
        if (!ignore) setHistory([])
      }
    }

    load()
    return () => { ignore = true }
  }, [])

  const hasPlayedDaily = useMemo(() => {
    const today = todayKey()
    return history.some(item => item.mode === 'daily' && item.daily_date === today && item.language === language)
  }, [history, language])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  function startClassic() {
    clearSavedGame()
    navigate(`/game?mode=classic&lang=${language}`)
  }

  function startDaily() {
    if (!isLoggedIn()) {
      navigate('/auth')
      return
    }
    if (hasPlayedDaily) {
      showToast('Défi du jour déjà joué')
      return
    }
    clearSavedGame()
    navigate(`/game?mode=daily&lang=${language}`)
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-on-surface text-surface px-4 py-2 rounded-xl font-headline font-bold text-sm shadow-xl">
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-surface-container bg-surface">
        <div className="flex justify-between items-center px-4 h-14 w-full max-w-5xl mx-auto">
          <span className="text-xl font-black tracking-tighter text-on-surface font-headline">WORDLE</span>
          <div className="flex items-center gap-2">
            <LanguageButton value="fr" active={language === 'fr'} onClick={() => setLanguage('fr')} />
            <LanguageButton value="en" active={language === 'en'} onClick={() => setLanguage('en')} />
            <button onClick={() => navigate('/profile')} title="Mon profil" className="p-2 rounded-xl hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-xl">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-5 items-start">
        <section className="flex flex-col gap-5">
          <div className="fade-up">
            <p className="section-title">Aujourd'hui</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <ModeCard
                icon="today"
                title="Défi du jour"
                desc="Même mot pour tout le monde, une tentative de classement par jour, points doublés."
                action={hasPlayedDaily ? 'Déjà joué' : 'Jouer le défi'}
                disabled={hasPlayedDaily}
                highlight
                onClick={startDaily}
              />
              <ModeCard
                icon="grid_view"
                title="Partie classique"
                desc="Une partie libre pour s'entraîner, progresser et alimenter ton score global."
                action="Jouer"
                onClick={startClassic}
              />
            </div>
          </div>

          <div className="fade-up" style={{ animationDelay: '0.08s' }}>
            <p className="section-title">Aperçu</p>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
              <div className="grid grid-cols-5 gap-1.5 max-w-[300px] mx-auto">
                {['D', 'E', 'F', 'I', '!'].map((letter, index) => (
                  <div
                    key={letter}
                    className={`aspect-square rounded-xl flex items-center justify-center font-headline font-black text-2xl ${index < 3 ? 'bg-primary-container text-on-primary-container' : index === 3 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface'}`}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <HomeMetric icon="leaderboard" value={leaderboards.current_score[0]?.total_score || 0} label="Top score" />
                <HomeMetric icon="local_fire_department" value={leaderboards.best_streak[0]?.best_streak || 0} label="Top série" />
                <HomeMetric icon="workspace_premium" value={leaderboards.daily_challenge[0]?.score || 0} label="Défi" />
              </div>
            </div>
          </div>
        </section>

        <section className="fade-up" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="section-title !mb-0">Classement du défi</p>
            <button onClick={() => navigate('/profile')} className="text-xs font-headline font-bold text-primary hover:opacity-80">
              Tous les classements
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {leaderboards.daily_challenge.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-outline">emoji_events</span>
                <p className="mt-2 font-headline font-extrabold text-sm">Aucun score aujourd'hui</p>
                <p className="text-xs text-outline-variant mt-1">Le premier joueur du défi prendra la tête.</p>
              </div>
            ) : leaderboards.daily_challenge.slice(0, 8).map(entry => (
              <DailyRow key={entry.user_id} entry={entry} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function clearSavedGame() {
  localStorage.removeItem('wordle_game_id')
  localStorage.removeItem('wordle_game_mode')
  localStorage.removeItem('wordle_daily_date')
}

function LanguageButton({ value, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-xl text-sm font-bold font-headline transition-all ${active ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
      {value.toUpperCase()}
    </button>
  )
}

function ModeCard({ icon, title, desc, action, onClick, highlight = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-2xl border p-4 flex flex-col gap-4 min-h-[180px] transition-all active:scale-[0.99] ${highlight ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
        {highlight && <span className="text-xs font-headline font-extrabold uppercase">x2</span>}
      </div>
      <div className="flex-1">
        <h1 className="font-headline font-black text-2xl leading-tight">{title}</h1>
        <p className={`text-sm mt-2 leading-snug ${highlight ? 'text-on-primary-container' : 'text-outline-variant'}`}>{desc}</p>
      </div>
      <span className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-headline font-extrabold text-sm ${highlight ? 'bg-on-primary text-primary' : 'bg-primary-container text-on-primary-container'}`}>
        {action}
      </span>
    </button>
  )
}

function HomeMetric({ icon, value, label }) {
  return (
    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant flex flex-col items-center gap-1 min-w-0">
      <span className="material-symbols-outlined text-xl text-primary">{icon}</span>
      <p className="font-headline font-extrabold text-lg text-primary leading-none truncate max-w-full">{value}</p>
      <p className="text-[0.66rem] text-outline font-headline font-semibold tracking-wider uppercase text-center">{label}</p>
    </div>
  )
}

function DailyRow({ entry }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-surface-container-low border-outline-variant hover:bg-surface-container-high transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-headline font-black text-sm bg-surface-container-high text-primary">
        #{entry.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline font-extrabold text-sm truncate">{entry.username}</p>
        <p className="text-xs text-outline-variant font-body">
          {entry.is_won ? `${entry.attempts_count}/6 essais` : 'Défaite'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-headline font-extrabold text-base">{entry.score}</p>
        <p className="text-[0.66rem] font-headline font-bold uppercase text-secondary">points</p>
      </div>
    </div>
  )
}
