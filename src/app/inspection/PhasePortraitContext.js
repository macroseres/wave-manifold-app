import { createContext, useContext } from 'react'

export const PhasePortraitContext = createContext(null)
export const usePhasePortrait = () => useContext(PhasePortraitContext)
