// src/game/difficulty.ts
export type BattleModifier = {
  name: string
  apply: (state: any) => void
}

export const baseDifficulty = {
  barSpeed: 1.0,
  reactionWindow: 60, // мс для идеального тайминга
}

export const modifiers: BattleModifier[] = [
  {
    name: "Fast",
    apply: (state) => {
      state.barSpeed *= 1.3
    },
  },
  {
    name: "Reverse",
    apply: (state) => {
      state.reverse = true
    },
  },
  {
    name: "Pulse",
    apply: (state) => {
      state.pulsing = true // бар пульсирует
    },
  },
  {
    name: "Blur",
    apply: (state) => {
      state.reactionWindow *= 0.8 // меньше времени
    },
  },
]

// функция, которая выбирает модификаторы в зависимости от прогресса
export function getBattleState(level: number) {
  const state = { ...baseDifficulty }
  const applied = modifiers.slice(0, Math.min(level, modifiers.length))
  applied.forEach((m) => m.apply(state))
  return state
}
