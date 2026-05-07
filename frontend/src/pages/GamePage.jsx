import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame, submitGuess, getGameState } from '../api/client'

const WORD_LENGTH = 5
const MAX_ATTEMPTS = 6
const KEYBOARDS = {
  en: [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫'],
  ],
  fr: [
    ['A','Z','E','R','T','Y','U','I','O','P'],
    ['Q','S','D','F','G','H','J','K','L','M'],
    ['ENTER','W','X','C','V','B','N','⌫'],
  ],
}
const LABELS = {
  fr: { win: 'Bravo !', lose: 'Dommage...' },
  en: { win: 'You won!', lose: 'Better luck next time!' },
}

function createEmptyBoard() {
  return Array.from({ length: MAX_ATTEMPTS }, () => (
    Array.from({ length: WORD_LENGTH }, () => ({ letter: '', status: 'empty' }))
  ))
}

function priority(status) {
  return { CORRECT: 3, MISPLACED: 2, ABSENT: 1 }[status] || 0
}

function Tile({ letter, status, delay, pop }) {
  const base = 'aspect-square flex items-center justify-center text-2xl font-black font-headline rounded-xl transition-all duration-150'
  const styles = {
    empty: 'bg-surface-container-low border border-outline-variant/20',
    pending: 'bg-surface-container-low border-2 border-outline-variant text-on-surface',
    CORRECT: 'bg-primary-container text-on-primary-container',
    MISPLACED: 'bg-secondary-container text-on-secondary-container',
    ABSENT: 'bg-surface-container-highest text-on-surface',
  }
  const hasDelay = delay !== undefined
  return (
    <div className={`${base} ${styles[status] || styles.empty} ${pop ? 'animate-pop' : ''} ${hasDelay ? 'tile-flip' : ''}`} style={{ animationDelay: hasDelay ? `${delay}ms` : undefined }}>
      {letter}
    </div>
  )
}

export default function GamePage() {
  const navigate = useNavigate()
  const [gameId, setGameId] = useState(() => localStorage.getItem('wordle_game_id'))
  const [language, setLanguage] = useState(() => localStorage.getItem('wordle_language') || 'fr')
  const [board, setBoard] = useState(createEmptyBoard)
  const [currentRow, setCurrentRow] = useState(0)
  const [currentInput, setCurrentInput] = useState('')
  const [keyStates, setKeyStates] = useState({})
  const [isOver, setIsOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLangOverlay, setShowLangOverlay] = useState(() => !localStorage.getItem('wordle_game_id'))
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null) // { type: 'win'|'lose', word: string }
  const [shakeRow, setShakeRow] = useState(null)
  const [revealingRow, setRevealingRow] = useState(null)

  const showToastMsg = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const initBoard = useCallback(() => {
    setBoard(createEmptyBoard())
    setCurrentRow(0)
    setCurrentInput('')
    setKeyStates({})
    setIsOver(false)
    setModal(null)
    setRevealingRow(null)
  }, [])

  const startGame = useCallback(async (lang) => {
    setLanguage(lang)
    setShowLangOverlay(false)
    initBoard()
    try {
      const data = await createGame(lang)
      setGameId(data.game_id)
      localStorage.setItem('wordle_game_id', data.game_id)
      localStorage.setItem('wordle_language', lang)
    } catch {
      showToastMsg('Impossible de joindre l\'API')
    }
  }, [initBoard, showToastMsg])

  function giveUp() {
    localStorage.removeItem('wordle_game_id')
    localStorage.removeItem('wordle_language')
    setGameId(null)
    setShowLangOverlay(true)
  }

  useEffect(() => {
    let ignore = false

    async function restoreSavedGame() {
      const savedId = localStorage.getItem('wordle_game_id')
      const savedLang = localStorage.getItem('wordle_language') || 'fr'
      if (!savedId) return

      try {
        const data = await getGameState(savedId)
        if (ignore) return

        const newBoard = createEmptyBoard()
        const newKeyStates = {}
        data.attempts.forEach((attempt, row) => {
          attempt.word.split('').forEach((letter, col) => {
            const status = attempt.feedback[col]
            newBoard[row][col] = { letter, status }
            if (!newKeyStates[letter] || priority(status) > priority(newKeyStates[letter])) {
              newKeyStates[letter] = status
            }
          })
        })

        setGameId(savedId)
        setLanguage(savedLang)
        setBoard(newBoard)
        setCurrentRow(data.attempts.length)
        setCurrentInput('')
        setIsOver(data.is_over)
        setKeyStates(newKeyStates)
        setModal(data.is_over ? { type: data.is_won ? 'win' : 'lose', word: data.secret_word } : null)
        setShowLangOverlay(false)
      } catch {
        if (ignore) return
        localStorage.removeItem('wordle_game_id')
        localStorage.removeItem('wordle_language')
        setGameId(null)
        setShowLangOverlay(true)
      }
    }

    restoreSavedGame()
    return () => { ignore = true }
  }, [])

  const handleLetter = useCallback((letter) => {
    setCurrentInput(prev => {
      if (isSubmitting || isOver || prev.length >= WORD_LENGTH) return prev
      return prev + letter
    })
  }, [isOver, isSubmitting])

  const handleBackspace = useCallback(() => {
    if (isSubmitting || isOver) return
    setCurrentInput(prev => prev.slice(0, -1))
  }, [isOver, isSubmitting])

  const doSubmit = useCallback(async () => {
    if (isSubmitting || isOver) return
    setIsSubmitting(true)
    const guess = currentInput
    const rowIndex = currentRow
    try {
      const data = await submitGuess(gameId, guess)

      setBoard(prev => {
        const newBoard = prev.map(row => row.slice())
        newBoard[rowIndex] = newBoard[rowIndex].map((tile, c) => (
          c < WORD_LENGTH ? { letter: guess[c], status: data.feedback[c] } : tile
        ))
        return newBoard
      })
      setRevealingRow(rowIndex)
      setTimeout(() => setRevealingRow(null), WORD_LENGTH * 200 + 500)

      setKeyStates(prev => {
        const newKeyStates = { ...prev }
        data.feedback.forEach((status, c) => {
          const letter = guess[c]
          if (!newKeyStates[letter] || priority(status) > priority(newKeyStates[letter])) {
            newKeyStates[letter] = status
          }
        })
        return newKeyStates
      })
      setIsOver(data.is_over)
      if (data.is_over) {
        localStorage.removeItem('wordle_game_id')
        localStorage.removeItem('wordle_language')
        setTimeout(() => setModal({ type: data.is_won ? 'win' : 'lose', word: data.secret_word }), WORD_LENGTH * 200 + 300)
      }
      setCurrentInput('')
      setCurrentRow(prev => prev + 1)
    } catch (err) {
      setShakeRow(currentRow)
      setTimeout(() => setShakeRow(null), 400)
      showToastMsg(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setIsSubmitting(false)
    }
  }, [currentInput, currentRow, gameId, isOver, isSubmitting, showToastMsg])

  const handleEnter = useCallback(() => {
    if (isSubmitting || isOver || !gameId) return
    if (currentInput.length < WORD_LENGTH) {
      setShakeRow(currentRow)
      setTimeout(() => setShakeRow(null), 400)
      showToastMsg(language === 'fr' ? 'Mot trop court' : 'Not enough letters')
      return
    }
    doSubmit()
  }, [currentInput.length, currentRow, doSubmit, gameId, isOver, isSubmitting, language, showToastMsg])

  useEffect(() => {
    function onKeyDown(e) {
      if (isOver || isSubmitting) return
      if (e.key === 'Enter') handleEnter()
      else if (e.key === 'Backspace') handleBackspace()
      else if (/^[a-zA-ZÀ-ÿ]$/.test(e.key)) handleLetter(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOver, isSubmitting, handleEnter, handleBackspace, handleLetter])

  const rows = KEYBOARDS[language]

  return (
    <div className="min-h-screen flex flex-col items-center bg-surface text-on-surface font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-surface-container bg-surface">
        <div className="flex justify-between items-center px-4 h-14 w-full max-w-lg mx-auto">
          <span className="text-xl font-black tracking-tighter text-on-surface font-headline">WORDLE</span>
          <div className="flex items-center gap-2">
            <button onClick={giveUp} title="Abandonner / Rejouer" className="p-2 rounded-xl hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-xl">refresh</span>
            </button>
            <button onClick={() => navigate('/profile')} title="Mon profil" className="p-2 rounded-xl hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-xl">account_circle</span>
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => startGame('fr')} className={`px-3 py-1 rounded-xl text-sm font-bold font-headline transition-all ${language==='fr' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>FR</button>
              <button onClick={() => startGame('en')} className={`px-3 py-1 rounded-xl text-sm font-bold font-headline transition-all ${language==='en' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>EN</button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-on-surface text-surface px-4 py-2 rounded-xl text-sm font-bold font-headline shadow-xl">
          {toast}
        </div>
      )}

      {/* Lang overlay */}
      {showLangOverlay && (
        <div className="fixed inset-0 z-[60] bg-surface flex flex-col items-center justify-center gap-8 p-4">
          <h1 className="text-4xl font-black tracking-tighter text-on-surface font-headline">WORDLE</h1>
          <p className="text-on-surface-variant text-center max-w-xs">Choisissez votre langue pour commencer</p>
          <div className="flex gap-4">
            <button onClick={() => startGame('fr')} className="px-8 py-4 bg-primary-container text-on-primary-container font-black font-headline rounded-2xl text-xl hover:opacity-90 active:scale-95 transition-all">🇫🇷 FR</button>
            <button onClick={() => startGame('en')} className="px-8 py-4 bg-surface-container-high text-on-surface font-black font-headline rounded-2xl text-xl hover:bg-surface-bright active:scale-95 transition-all">🇬🇧 EN</button>
          </div>
        </div>
      )}

      {/* Game board */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center justify-center p-4 gap-6">
        <div className="grid grid-rows-6 gap-1.5 w-full max-w-[320px]">
          {board.map((row, r) => (
            <div key={r} className={`grid grid-cols-5 gap-1.5 ${shakeRow === r ? 'animate-shake' : ''}`}>
              {row.map((tile, c) => (
                <Tile key={c} letter={r === currentRow ? currentInput[c] || '' : tile.letter} status={r === currentRow ? (currentInput[c] ? 'pending' : 'empty') : tile.status} delay={r === revealingRow ? c * 200 : undefined} pop={r === currentRow && c === currentInput.length - 1} />
              ))}
            </div>
          ))}
        </div>

        {/* Keyboard */}
        <section className="w-full bg-surface-container-low p-3 rounded-3xl flex flex-col gap-1.5">
          {rows.map((letters, i) => (
            <div key={i} className="flex justify-center gap-1 w-full">
              {letters.map(letter => {
                const isWide = letter === 'ENTER' || letter === '⌫'
                const status = keyStates[letter]
                const base = `key-press h-14 flex items-center justify-center rounded-xl text-sm font-bold font-headline transition-all duration-200 cursor-pointer ${isWide ? 'px-3 flex-[1.5]' : 'flex-1 max-w-[42px]'}`
                const styles = {
                  CORRECT: 'bg-primary-container text-on-primary-container',
                  MISPLACED: 'bg-secondary-container text-on-secondary-container',
                  ABSENT: 'bg-surface-variant text-on-surface opacity-60',
                }
                return (
                  <button key={letter} disabled={isSubmitting || isOver} onClick={() => {
                    if (letter === 'ENTER') handleEnter()
                    else if (letter === '⌫') handleBackspace()
                    else handleLetter(letter)
                  }} className={`${base} ${isSubmitting || isOver ? 'opacity-60 cursor-not-allowed' : ''} ${styles[status] || 'bg-surface-container-high text-on-surface hover:bg-surface-bright'}`}>
                    {letter === '⌫' ? <span className="material-symbols-outlined text-base">backspace</span> : letter}
                  </button>
                )
              })}
            </div>
          ))}
        </section>
      </main>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden">
            {modal.type === 'win' ? (
              <>
                <div className="h-28 bg-gradient-to-br from-primary to-primary-container flex flex-col items-center justify-center text-on-primary p-4">
                  <span className="material-symbols-outlined text-4xl mb-1">emoji_events</span>
                  <h2 className="text-2xl font-black font-headline tracking-tight">{LABELS[language].win}</h2>
                </div>
                <div className="p-6 flex flex-col items-center gap-4">
                  <p className="text-on-surface-variant text-sm">Le mot était</p>
                  <div className="flex gap-1.5">
                    {modal.word.split('').map((l, i) => (
                      <div key={i} className="w-12 h-14 bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-black font-headline rounded-xl">{l}</div>
                    ))}
                  </div>
                  <div className="flex gap-2 w-full">
                    <button onClick={() => startGame('fr')} className="flex-1 py-3 bg-primary-container text-on-primary-container font-black font-headline rounded-xl hover:opacity-90 active:scale-95 transition-all">🇫🇷 FR</button>
                    <button onClick={() => startGame('en')} className="flex-1 py-3 bg-surface-container-high text-on-surface font-black font-headline rounded-xl hover:bg-surface-bright active:scale-95 transition-all">🇬🇧 EN</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-error text-5xl">sentiment_dissatisfied</span>
                <h2 className="text-2xl font-black font-headline">{LABELS[language].lose}</h2>
                <p className="text-on-surface-variant text-sm">Le mot était</p>
                <div className="flex gap-1.5">
                  {modal.word.split('').map((l, i) => (
                    <div key={i} className="w-12 h-14 bg-error-container text-on-error-container flex items-center justify-center text-2xl font-black font-headline rounded-xl">{l}</div>
                  ))}
                </div>
                <div className="flex gap-2 w-full">
                  <button onClick={() => startGame('fr')} className="flex-1 py-3 bg-primary-container text-on-primary-container font-black font-headline rounded-xl hover:opacity-90 active:scale-95 transition-all">🇫🇷 FR</button>
                  <button onClick={() => startGame('en')} className="flex-1 py-3 bg-surface-container-high text-on-surface font-black font-headline rounded-xl hover:bg-surface-bright active:scale-95 transition-all">🇬🇧 EN</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
