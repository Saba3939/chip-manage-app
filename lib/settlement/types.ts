/**
 * 清算データの型定義
 */

export type SettlementParticipant = {
  userId: string
  displayName: string
  initialChips: number
  finalChips: number
  difference: number
  settlementAmount: number
  currentPoints: number
  pointsAfterSettlement: number
}

export type SettlementData = {
  sessionId: string
  sessionName: string | null
  participants: SettlementParticipant[]
  totalInitial: number
  totalFinal: number
  totalDifference: number
  totalSettlement: number
  rate: number | null
  isValid: boolean // チップ総数が一致するか
  createdAt: string
}

export type SettlementResult = {
  data: SettlementData | null
  error: string | null
}
