import cardFlipSound from '../assets/audio/card_flip.mp3'

// Volume settings (0-1)
let masterVolume = parseFloat(localStorage.getItem('masterVolume') ?? '1')
let musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.3')
let effectsVolume = parseFloat(localStorage.getItem('effectsVolume') ?? '0.5')

export function getMasterVolume() { return masterVolume }
export function getMusicVolume() { return musicVolume }
export function getEffectsVolume() { return effectsVolume }

export function setMasterVolume(v) {
  masterVolume = v
  localStorage.setItem('masterVolume', v.toString())
}

export function setMusicVolume(v) {
  musicVolume = v
  localStorage.setItem('musicVolume', v.toString())
}

export function setEffectsVolume(v) {
  effectsVolume = v
  localStorage.setItem('effectsVolume', v.toString())
}

export function getEffectiveVolume(type) {
  if (type === 'music') return masterVolume * musicVolume
  if (type === 'effects') return masterVolume * effectsVolume
  return masterVolume
}

const cardFlipAudio = new Audio(cardFlipSound)

export function playCardSound() {
  const sound = cardFlipAudio.cloneNode()
  sound.volume = getEffectiveVolume('effects')
  sound.play().catch(() => {})
}
