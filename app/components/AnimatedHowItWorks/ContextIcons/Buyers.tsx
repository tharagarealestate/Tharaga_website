import React from 'react'
import { motion } from 'framer-motion'

export type BuyerProps = { x: number; delay?: number; color?: string }

const Buyer: React.FC<BuyerProps> = ({ x, delay = 0, color = '#FF6B35' }) => {
  return (
    <motion.g initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.55, ease: 'easeOut' }}>
      <circle cx={x} cy={200} r={18} stroke="#111827" strokeWidth="3" fill="none" />
      <motion.rect x={x - 24} y={220} width={48} height={34} rx={8} stroke="#111827" strokeWidth="3" fill="none" animate={{ y: [220, 218, 220] }} transition={{ delay, repeat: Infinity, duration: 2.2 }} />
      <motion.circle cx={x + 22} cy={184} r={8} fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} />
      <motion.g stroke={color} strokeWidth={3} strokeLinecap="round">
        <path d={`M${x + 18} 184 l3 3`} />
        <path d={`M${x + 21} 187 l6 -8`} />
      </motion.g>
    </motion.g>
  )
}

export const BuyersGroup: React.FC<{ color?: string }> = ({ color = '#FF6B35' }) => {
  return (
    <svg aria-hidden="true" viewBox="0 0 300 300" className="w-full h-full">
      <Buyer x={110} delay={0.1} color={color} />
      <Buyer x={150} delay={0.25} color={color} />
      <Buyer x={190} delay={0.4} color={color} />
    </svg>
  )
}

export default BuyersGroup
