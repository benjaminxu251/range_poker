import { useState, useEffect, useRef } from 'react'
import { EasyGame } from './components/EasyGame.jsx'
import { HardGame } from './components/HardGame.jsx'
import {
  getMasterVolume, setMasterVolume,
  getMusicVolume, setMusicVolume,
  getEffectsVolume, setEffectsVolume,
  getEffectiveVolume, playCardSound
} from './utils/sound.js'
import balatroTheme from './assets/audio/balatro_theme.mp3'

const SCREENS = {
  MAIN_MENU: 'mainMenu',
  MODE_SELECT: 'modeSelect',
  SETTINGS: 'settings',
  CREDITS: 'credits',
  EASY_GAME: 'easyGame',
  HARD_GAME: 'hardGame',
}

function MenuButton({ children, onClick, variant = 'primary' }) {
  const baseClasses = 'w-64 py-4 px-8 text-xl font-serif rounded-lg transition-all duration-200 ease-out border-2'
  const variants = {
    primary: 'bg-emerald-800 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-400 text-amber-100 hover:scale-105 hover:shadow-lg hover:shadow-emerald-900/50',
    secondary: 'bg-slate-700 hover:bg-slate-600 border-slate-500 hover:border-slate-400 text-slate-200 hover:scale-105',
    back: 'bg-slate-800 hover:bg-slate-700 border-slate-600 hover:border-slate-500 text-slate-300 hover:scale-105',
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

function MainMenu({ onNavigate, onShowRules }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-5xl font-serif text-amber-100 mb-8 tracking-wide">
        Range Poker
      </h1>
      <MenuButton onClick={() => onNavigate(SCREENS.MODE_SELECT)}>
        Play
      </MenuButton>
      <MenuButton onClick={onShowRules} variant="secondary">
        Rules
      </MenuButton>
      <MenuButton onClick={() => onNavigate(SCREENS.SETTINGS)} variant="secondary">
        Settings
      </MenuButton>
      <MenuButton onClick={() => onNavigate(SCREENS.CREDITS)} variant="secondary">
        Credits
      </MenuButton>
    </div>
  )
}

function ModeSelect({ onNavigate }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-4xl font-serif text-amber-100 mb-8 tracking-wide">
        Select Mode
      </h1>
      <MenuButton onClick={() => onNavigate(SCREENS.EASY_GAME)}>
        Easy
      </MenuButton>
      <MenuButton onClick={() => onNavigate(SCREENS.HARD_GAME)}>
        Hard
      </MenuButton>
      <div className="mt-4">
        <MenuButton onClick={() => onNavigate(SCREENS.MAIN_MENU)} variant="back">
          Back
        </MenuButton>
      </div>
    </div>
  )
}

function VolumeSlider({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-4 w-64">
      <span className="text-slate-300 w-20 text-sm">{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className="flex-1 accent-amber-500"
      />
      <span className="text-slate-400 w-8 text-sm text-right">{Math.round(value * 100)}%</span>
    </div>
  )
}

function Settings({ onNavigate, onVolumeChange }) {
  const [tutorialsReset, setTutorialsReset] = useState(false)
  const [master, setMaster] = useState(getMasterVolume)
  const [music, setMusic] = useState(getMusicVolume)
  const [effects, setEffects] = useState(getEffectsVolume)

  const handleResetTutorials = () => {
    localStorage.removeItem('easyNuxStep')
    localStorage.removeItem('hardNuxStep')
    setTutorialsReset(true)
    setTimeout(() => setTutorialsReset(false), 2000)
  }

  const handleMasterChange = (v) => {
    setMaster(v)
    setMasterVolume(v)
    onVolumeChange?.()
  }

  const handleMusicChange = (v) => {
    setMusic(v)
    setMusicVolume(v)
    onVolumeChange?.()
  }

  const handleEffectsChange = (v) => {
    setEffects(v)
    setEffectsVolume(v)
    playCardSound()
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-4xl font-serif text-amber-100 mb-8">Settings</h1>

      <div className="flex flex-col gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-600">
        <h2 className="text-lg font-serif text-amber-200 mb-2">Volume</h2>
        <VolumeSlider label="Master" value={master} onChange={handleMasterChange} />
        <VolumeSlider label="Music" value={music} onChange={handleMusicChange} />
        <VolumeSlider label="Effects" value={effects} onChange={handleEffectsChange} />
      </div>

      <div className="flex flex-col items-center gap-3 mt-4">
        <MenuButton onClick={handleResetTutorials} variant="secondary">
          {tutorialsReset ? 'Tutorials Reset!' : 'Reset Tutorials'}
        </MenuButton>
        <p className="text-slate-500 text-sm">Show in-game hints again</p>
      </div>

      <div className="mt-8">
        <MenuButton onClick={() => onNavigate(SCREENS.MAIN_MENU)} variant="back">
          Back
        </MenuButton>
      </div>
    </div>
  )
}

function Credits({ onNavigate }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-4xl font-serif text-amber-100 mb-8">Credits</h1>
      <p className="text-slate-400 text-lg mb-8">Credits coming soon...</p>
      <MenuButton onClick={() => onNavigate(SCREENS.MAIN_MENU)} variant="back">
        Back
      </MenuButton>
    </div>
  )
}

function RulesDialog({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border-2 border-slate-600 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 animate-deal"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-3xl font-serif text-amber-100 mb-6 text-center">How to Play</h2>

        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-xl font-serif text-emerald-400 mb-2">Goal</h3>
            <p>Build the best 5-card poker hand to beat the dealer.</p>
          </div>

          <div>
            <h3 className="text-xl font-serif text-emerald-400 mb-2">Easy Mode</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>A card is revealed from the deck</li>
              <li><span className="text-emerald-300">Take</span> it for your hand, or <span className="text-amber-300">Pass</span> it to the dealer</li>
              <li>Repeat until you have 5 cards</li>
              <li>Dealer draws up to 8 cards total</li>
              <li>Best 5-card hands are compared</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-serif text-emerald-400 mb-2">Hard Mode</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Select which cards you want to "stop on"</li>
              <li>Cards are dealt until one matches your selection</li>
              <li>You get the matching card; dealer gets all cards before it</li>
              <li>Repeat until you have 5 cards</li>
              <li>Dealer draws up to 8, then showdown</li>
            </ol>
            <p className="text-xs text-slate-400 mt-2">
              Tip: Narrow selections mean more cards to the dealer!
            </p>
          </div>

          <div>
            <h3 className="text-xl font-serif text-emerald-400 mb-2">Hand Rankings</h3>
            <div className="text-sm grid grid-cols-2 gap-1">
              <span>Royal Flush</span><span className="text-slate-400">A-K-Q-J-10 suited</span>
              <span>Straight Flush</span><span className="text-slate-400">5 consecutive suited</span>
              <span>Four of a Kind</span><span className="text-slate-400">4 same rank</span>
              <span>Full House</span><span className="text-slate-400">3 + 2 of a kind</span>
              <span>Flush</span><span className="text-slate-400">5 same suit</span>
              <span>Straight</span><span className="text-slate-400">5 consecutive</span>
              <span>Three of a Kind</span><span className="text-slate-400">3 same rank</span>
              <span>Two Pair</span><span className="text-slate-400">2 + 2 of a kind</span>
              <span>One Pair</span><span className="text-slate-400">2 same rank</span>
              <span>High Card</span><span className="text-slate-400">Highest card</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 rounded-lg text-slate-200 font-serif text-lg transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  )
}

function MuteButton({ muted, onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-amber-100 transition-colors z-50"
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )}
    </button>
  )
}

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.MAIN_MENU)
  const [displayedScreen, setDisplayedScreen] = useState(SCREENS.MAIN_MENU)
  const [transitionState, setTransitionState] = useState('idle') // 'idle' | 'exiting' | 'entering'
  const [muted, setMuted] = useState(() => localStorage.getItem('muted') === 'true')
  const [audioStarted, setAudioStarted] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio(balatroTheme)
    audio.loop = true
    audio.volume = getEffectiveVolume('music')
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const updateMusicVolume = () => {
    if (audioRef.current) {
      audioRef.current.volume = getEffectiveVolume('music')
    }
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted
    }
    localStorage.setItem('muted', muted.toString())
  }, [muted])

  const startAudio = () => {
    if (!audioStarted && audioRef.current) {
      audioRef.current.play().catch(() => {})
      setAudioStarted(true)
    }
  }

  const navigateTo = (screen) => {
    if (screen === displayedScreen || transitionState !== 'idle') return

    setCurrentScreen(screen)
    setTransitionState('exiting')

    // After exit animation, swap screens and enter
    setTimeout(() => {
      setDisplayedScreen(screen)
      setTransitionState('entering')

      // After enter animation, go idle
      setTimeout(() => {
        setTransitionState('idle')
      }, 250)
    }, 200)
  }

  const renderScreen = (screen) => {
    switch (screen) {
      case SCREENS.MAIN_MENU:
        return <MainMenu onNavigate={navigateTo} onShowRules={() => setShowRules(true)} />
      case SCREENS.MODE_SELECT:
        return <ModeSelect onNavigate={navigateTo} />
      case SCREENS.SETTINGS:
        return <Settings onNavigate={navigateTo} onVolumeChange={updateMusicVolume} />
      case SCREENS.CREDITS:
        return <Credits onNavigate={navigateTo} />
      case SCREENS.EASY_GAME:
        return <EasyGame onNavigate={navigateTo} backScreen={SCREENS.MODE_SELECT} />
      case SCREENS.HARD_GAME:
        return <HardGame onNavigate={navigateTo} backScreen={SCREENS.MODE_SELECT} />
      default:
        return <MainMenu onNavigate={navigateTo} />
    }
  }

  const transitionClass = transitionState === 'exiting' ? 'screen-exit' : transitionState === 'entering' ? 'screen-enter' : ''

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center"
      onClick={startAudio}
    >
      <MuteButton muted={muted} onClick={() => setMuted(m => !m)} />
      <div className={`text-center ${transitionClass}`}>
        {renderScreen(displayedScreen)}
      </div>
      {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
    </div>
  )
}

export default App
