import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, getHistory, getLeaderboards, logout } from '../api/client'

const EMPTY_LEADERBOARDS = {
  current_score: [],
  best_streak: [],
  average_score: [],
  daily_challenge: [],
}

const LEADERBOARD_VIEWS = [
  { key: 'current_score', label: 'Score actuel', metric: 'total_score', unit: 'points', empty: 'Aucun score classé' },
  { key: 'best_streak', label: 'Record série', metric: 'best_streak', unit: 'jours', empty: 'Aucune série classée' },
  { key: 'average_score', label: 'Score moyen', metric: 'average_score', unit: 'pts/partie', empty: 'Aucune moyenne classée' },
  { key: 'daily_challenge', label: 'Défi du jour', metric: 'score', unit: 'points', empty: 'Aucun défi joué aujourd’hui' },
]

function TabButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-2.5 py-[0.45rem] rounded-lg font-headline font-bold text-xs tracking-wider transition-colors whitespace-nowrap ${active ? 'bg-primary-container text-on-primary-container' : 'text-outline-variant hover:text-on-surface-variant'}`}>
      {label}
    </button>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')
  const [leaderboardTab, setLeaderboardTab] = useState('current_score')
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [leaderboards, setLeaderboards] = useState(EMPTY_LEADERBOARDS)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    async function load() {
      try {
        const [u, h] = await Promise.all([getMe(), getHistory()])
        setUser(u)
        setHistory(h)
        try {
          setLeaderboards(await getLeaderboards())
        } catch {
          setLeaderboards(EMPTY_LEADERBOARDS)
        }
      } catch {
        logout()
        navigate('/auth')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">Chargement…</div>
  if (!user) return null

  const gamesPlayed = user.games_played || 0
  const gamesWon = user.games_won || 0
  const winRate = Math.round(user.win_rate || 0)
  const totalScore = user.total_score || 0
  const currentStreak = user.current_streak || 0
  const bestStreak = user.best_streak || 0
  const achievements = user.achievements || []
  const unlockedAchievements = achievements.filter(a => a.unlocked).length
  const currentRank = leaderboards.current_score.find(entry => entry.user_id === user.id)?.rank
  const activeLeaderboard = LEADERBOARD_VIEWS.find(view => view.key === leaderboardTab) || LEADERBOARD_VIEWS[0]
  const leaderboardRows = leaderboards[activeLeaderboard.key] || []

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  let totalGuesses = 0
  let wonCount = 0
  history.forEach(h => {
    if (h.is_won && h.attempts_count >= 1 && h.attempts_count <= 6) {
      dist[h.attempts_count]++
      totalGuesses += h.attempts_count
      wonCount++
    }
  })
  const avg = wonCount > 0 ? (totalGuesses / wonCount).toFixed(1) : '-'
  const maxDist = Math.max(...Object.values(dist))
  const bestAttempt = Object.entries(dist).sort((a, b) => b[1] - a[1])[0]?.[0]

  const langFr = history.filter(h => h.language === 'fr').length
  const langEn = history.filter(h => h.language === 'en').length
  const totalLang = langFr + langEn

  const filteredHistory = filter === 'all' ? history : filter === 'won' ? history.filter(h => h.is_won) : history.filter(h => !h.is_won)

  const joined = new Date(user.created_at).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  const numberFmt = new Intl.NumberFormat('fr-FR')

  return (
    <div className="min-h-screen flex flex-col items-center pb-10 bg-surface text-on-surface font-body">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-on-surface text-surface px-4 py-2 rounded-xl font-headline font-bold text-sm shadow-2xl transition-opacity">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-surface-container bg-surface">
        <div className="flex justify-between items-center px-4 h-14 w-full max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="text-xl font-black tracking-tighter font-headline">WORDLE</span>
          <button onClick={() => { logout(); navigate('/auth') }} title="Se déconnecter" className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </header>

      <div className="w-full max-w-lg mx-auto px-4 pt-6 flex flex-col gap-5">
        {/* Profile hero */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 fade-up">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-[-4px] rounded-full border-2 border-primary animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-black font-headline text-on-primary relative z-10">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black font-headline">{user.username}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold font-headline bg-secondary-container text-on-secondary-container">
                  <span className="material-symbols-outlined text-xs">star</span>Pro
                </span>
              </div>
              <p className="text-sm text-on-surface-variant font-body mt-0.5">{user.email}</p>
              <p className="text-xs text-on-surface-variant font-body mt-1">Membre depuis {joined}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <HeroMetric icon="leaderboard" value={numberFmt.format(totalScore)} label="Score" />
            <HeroMetric icon="local_fire_department" value={currentStreak} label="Série" color="text-secondary" />
            <HeroMetric icon="workspace_premium" value={bestStreak} label="Record" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1.5 bg-surface-container-low rounded-xl border border-outline-variant fade-up" style={{ animationDelay: '0.06s' }}>
          <TabButton active={tab === 'stats'} onClick={() => setTab('stats')} label="Stats" />
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} label="Historique" />
          <TabButton active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')} label="Classement" />
          <TabButton active={tab === 'badges'} onClick={() => setTab('badges')} label="Badges" />
          <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} label="Paramètres" />
        </div>

        {/* Stats tab */}
        {tab === 'stats' && (
          <div className="flex flex-col gap-5">
            <div className="fade-up" style={{ animationDelay: '0.1s' }}>
              <p className="section-title">Vue d'ensemble</p>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard value={numberFmt.format(totalScore)} label="Score total" color="text-primary" delay="0.12s" />
                <StatCard value={gamesPlayed} label="Parties jouées" color="text-primary" delay="0.14s" />
                <StatCard value={`${winRate}%`} label="Taux de victoire" color="text-primary" delay="0.16s" />
                <StatCard value={avg} label="Essais moyens" color="text-secondary" delay="0.20s" />
                <StatCard value={gamesWon} label="Victoires totales" color="text-secondary" delay="0.24s" />
                <StatCard value={currentRank ? `#${currentRank}` : '-'} label="Classement" color="text-secondary" delay="0.28s" />
                <StatCard value={`${unlockedAchievements}/${achievements.length || 0}`} label="Badges" color="text-primary" delay="0.32s" />
              </div>
            </div>

            <div className="fade-up" style={{ animationDelay: '0.18s' }}>
              <p className="section-title">Distribution des essais</p>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-2">
                {Array.from({ length: 6 }, (_, i) => {
                  const count = dist[i + 1] || 0
                  const pct = maxDist > 0 ? Math.round((count / maxDist) * 100) : 0
                  const isBest = String(i + 1) === String(bestAttempt)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-headline font-extrabold text-sm text-outline w-3 text-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 flex items-center">
                        <div className={`h-5 rounded flex items-center px-2 text-xs font-bold font-headline ${isBest ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface'}`} style={{ width: `${Math.max(pct, 8)}%`, animationDelay: `${i * 0.07}s` }}>
                          {count}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="fade-up" style={{ animationDelay: '0.22s' }}>
              <p className="section-title">Langues jouées</p>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex gap-3">
                <LangStat flag="🇫🇷" count={langFr} label="Français" pct={totalLang > 0 ? (langFr / totalLang * 100) : 0} delay="0s" />
                <div className="w-px bg-outline-variant" />
                <LangStat flag="🇬🇧" count={langEn} label="English" pct={totalLang > 0 ? (langEn / totalLang * 100) : 0} delay="0.15s" />
              </div>
            </div>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="flex flex-col gap-3 fade-up">
            <div className="flex items-center justify-between">
              <p className="section-title !mb-0">Parties récentes</p>
              <div className="flex gap-1.5">
                {['all', 'won', 'lost'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`text-xs font-headline font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition-colors ${filter === f ? 'bg-primary text-on-primary border-primary' : 'bg-transparent text-outline-variant border-outline-variant'}`}>
                    {f === 'all' ? 'Tout' : f === 'won' ? 'Victoires' : 'Défaites'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {filteredHistory.length === 0 ? (
                <p className="text-center text-outline-variant font-headline text-sm py-8">Aucune partie trouvée</p>
              ) : filteredHistory.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-surface-container-high transition-colors fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {h.secret_word.split('').map((l, j) => (
                      <div key={j} className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold font-headline ${h.is_won ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface'}`}>{l}</div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-headline font-extrabold text-sm text-on-surface">{h.secret_word.toUpperCase()}</span>
                      <span className="text-xs text-outline-variant">{h.language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                      {h.mode === 'daily' && (
                        <span className="text-[0.62rem] font-headline font-extrabold uppercase text-secondary">Défi</span>
                      )}
                    </div>
                    <p className="text-xs text-outline-variant font-body">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {h.is_won ? (
                      <div>
                        <span className="font-headline font-extrabold text-base text-primary">{h.attempts_count}<span className="text-xs text-outline-variant">/6</span></span>
                        <p className="text-[0.68rem] font-headline font-bold text-secondary">+{h.score}</p>
                      </div>
                    ) : (
                      <span className="material-symbols-outlined text-error text-xl">close</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && (
          <div className="flex flex-col gap-3 fade-up">
            <p className="section-title !mb-0">Classement global</p>
            <div className="flex flex-wrap gap-1 p-1.5 bg-surface-container-low rounded-xl border border-outline-variant">
              {LEADERBOARD_VIEWS.map(view => (
                <button
                  key={view.key}
                  onClick={() => setLeaderboardTab(view.key)}
                  className={`px-2.5 py-[0.45rem] rounded-lg font-headline font-bold text-xs transition-colors whitespace-nowrap ${leaderboardTab === view.key ? 'bg-primary-container text-on-primary-container' : 'text-outline-variant hover:text-on-surface-variant'}`}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {leaderboardRows.length === 0 ? (
                <p className="text-center text-outline-variant font-headline text-sm py-8">{activeLeaderboard.empty}</p>
              ) : leaderboardRows.map(entry => (
                activeLeaderboard.key === 'daily_challenge' ? (
                  <DailyLeaderboardRow key={entry.user_id} entry={entry} isCurrentUser={entry.user_id === user.id} />
                ) : (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={entry.user_id === user.id}
                    metric={activeLeaderboard.metric}
                    unit={activeLeaderboard.unit}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {/* Badges tab */}
        {tab === 'badges' && (
          <div className="flex flex-col gap-3 fade-up">
            <div className="flex items-center justify-between">
              <p className="section-title !mb-0">Succès débloqués</p>
              <span className="text-xs font-headline font-extrabold text-primary">{unlockedAchievements}/{achievements.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {achievements.map((achievement, i) => (
                <BadgeCard key={achievement.code} achievement={achievement} delay={`${i * 0.05}s`} />
              ))}
            </div>
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="flex flex-col gap-5 fade-up">
            <div>
              <p className="section-title">Informations du compte</p>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-outline mb-1.5 font-headline">Pseudo</label>
                  <input type="text" defaultValue={user.username} className="input-field" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-outline mb-1.5 font-headline">Email</label>
                  <input type="email" defaultValue={user.email} className="input-field" readOnly />
                </div>
                <div className="flex justify-end">
                  <button onClick={() => showToast('Non disponible pour l\'instant 🔧')} className="btn-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">save</span>Sauvegarder
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="section-title">Changer le mot de passe</p>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-3">
                <input type="password" placeholder="Mot de passe actuel" className="input-field" readOnly />
                <input type="password" placeholder="Nouveau mot de passe" className="input-field" readOnly />
                <div className="flex justify-end">
                  <button onClick={() => showToast('Non disponible pour l\'instant 🔧')} className="btn-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">lock_reset</span>Mettre à jour
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="section-title">Préférences</p>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl px-4">
                <SettingRow label="Langue par défaut" value="Français" action={<span className="text-xs font-headline font-bold px-2.5 py-0.5 rounded-full bg-primary text-on-primary">🇫🇷 FR</span>} />
                <SettingRow label="Animations" value="Effets visuels du jeu" action={<Toggle />} />
                <SettingRow label="Notifications" value="Rappels quotidiens" action={<Toggle />} />
                <SettingRow label="Mode daltonien" value="Contraste élevé" action={<Toggle />} />
              </div>
            </div>

            <div>
              <p className="section-title !text-error">Zone de danger</p>
              <div className="bg-surface-container-lowest border border-error rounded-2xl p-4 flex flex-col gap-2.5">
                <DangerRow label="Supprimer l'historique" desc="Efface toutes les parties sauvegardées" onClick={() => { if (confirm('Supprimer tout l\'historique ?')) showToast('Historique effacé') }} />
                <div className="h-px bg-error/40" />
                <DangerRow label="Supprimer le compte" desc="Action irréversible" onClick={() => { if (confirm('Supprimer définitivement votre compte ?')) { logout(); navigate('/auth') } }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function HeroMetric({ icon, value, label, color = 'text-primary' }) {
  return (
    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant flex flex-col items-center gap-1 min-w-0">
      <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
      <p className={`font-headline font-extrabold text-lg ${color} leading-none truncate max-w-full`}>{value}</p>
      <p className="text-[0.66rem] text-outline font-headline font-semibold tracking-wider uppercase text-center">{label}</p>
    </div>
  )
}

function StatCard({ value, label, color, delay }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex flex-col items-center gap-0.5 relative overflow-hidden" style={{ animationDelay: delay }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      <span className={`font-headline font-extrabold text-3xl ${color} leading-none`}>{value}</span>
      <span className="text-[0.7rem] text-outline font-headline font-semibold tracking-wider uppercase text-center">{label}</span>
    </div>
  )
}

function LeaderboardRow({ entry, isCurrentUser, metric, unit }) {
  const numberFmt = new Intl.NumberFormat('fr-FR')
  const value = metric === 'average_score'
    ? numberFmt.format(entry.average_score)
    : metric === 'best_streak'
      ? entry.best_streak
      : numberFmt.format(entry.total_score)
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isCurrentUser ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-headline font-black text-sm ${isCurrentUser ? 'bg-on-primary text-primary' : 'bg-surface-container-high text-primary'}`}>
        #{entry.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline font-extrabold text-sm truncate">{entry.username}</p>
        <p className={`text-xs font-body ${isCurrentUser ? 'text-on-primary-container' : 'text-outline-variant'}`}>
          {entry.games_won} victoires · {entry.win_rate}% · série {entry.current_streak}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-headline font-extrabold text-base">{value}</p>
        <p className={`text-[0.66rem] font-headline font-bold uppercase ${isCurrentUser ? 'text-on-primary-container' : 'text-secondary'}`}>{unit}</p>
      </div>
    </div>
  )
}

function DailyLeaderboardRow({ entry, isCurrentUser }) {
  const numberFmt = new Intl.NumberFormat('fr-FR')
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isCurrentUser ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-headline font-black text-sm ${isCurrentUser ? 'bg-on-primary text-primary' : 'bg-surface-container-high text-primary'}`}>
        #{entry.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline font-extrabold text-sm truncate">{entry.username}</p>
        <p className={`text-xs font-body ${isCurrentUser ? 'text-on-primary-container' : 'text-outline-variant'}`}>
          {entry.is_won ? `${entry.attempts_count}/6 essais` : 'Défaite'} · Défi du jour
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-headline font-extrabold text-base">{numberFmt.format(entry.score)}</p>
        <p className={`text-[0.66rem] font-headline font-bold uppercase ${isCurrentUser ? 'text-on-primary-container' : 'text-secondary'}`}>points</p>
      </div>
    </div>
  )
}

function BadgeCard({ achievement, delay }) {
  const date = achievement.unlocked_at
    ? new Date(achievement.unlocked_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 fade-up ${achievement.unlocked ? 'bg-surface-container-low border-primary' : 'bg-surface-container-lowest border-outline-variant opacity-60'}`} style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between gap-2">
        <span className={`material-symbols-outlined text-2xl ${achievement.unlocked ? 'text-secondary' : 'text-outline'}`}>
          {achievement.unlocked ? achievement.icon : 'lock'}
        </span>
        <span className={`text-[0.66rem] font-headline font-extrabold uppercase ${achievement.unlocked ? 'text-primary' : 'text-outline'}`}>
          {achievement.unlocked ? 'Débloqué' : 'Verrouillé'}
        </span>
      </div>
      <div>
        <p className="font-headline font-extrabold text-sm text-on-surface">{achievement.label}</p>
        <p className="text-xs text-outline-variant font-body leading-snug">{achievement.description}</p>
      </div>
      {date && <p className="text-[0.68rem] text-secondary font-headline font-bold">Le {date}</p>}
    </div>
  )
}

function LangStat({ flag, count, label, pct, delay }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <span className="text-2xl">{flag}</span>
      <span className="font-headline font-extrabold text-xl text-primary">{count}</span>
      <span className="text-[0.68rem] text-outline font-headline font-semibold tracking-wider uppercase">{label}</span>
      <div className="w-full h-1 bg-outline-variant rounded-full">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%`, animationDelay: delay }} />
      </div>
    </div>
  )
}

function SettingRow({ label, value, action }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-surface-container-low last:border-none">
      <div>
        <p className="font-headline font-bold text-sm text-on-surface">{label}</p>
        <p className="text-xs text-outline-variant font-body">{value}</p>
      </div>
      {action}
    </div>
  )
}

function Toggle() {
  const [on, setOn] = useState(false)
  return (
    <div onClick={() => setOn(!on)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${on ? 'bg-primary' : 'bg-outline-variant'}`}>
      <div className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-on-surface transition-transform ${on ? 'translate-x-5' : ''}`} />
    </div>
  )
}

function DangerRow({ label, desc, onClick }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <p className="font-headline font-bold text-sm text-error">{label}</p>
        <p className="text-xs text-outline-variant font-body">{desc}</p>
      </div>
      <button onClick={onClick} className="bg-transparent text-error font-headline font-bold text-sm px-4 py-1.5 rounded-xl border border-error hover:bg-error/10 transition-colors">
        {label.includes('historique') ? 'Effacer' : 'Supprimer'}
      </button>
    </div>
  )
}
