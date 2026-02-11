'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Tag, ArrowRight } from 'lucide-react'
import { useAuctionStore } from '@/lib/stores/auctionStore'
import { Button } from '@/components/ui/button'

export function AuctionList() {
  const { activeAuctions, loading, fetchAuctions, subscribeToAuctions, placeBid } = useAuctionStore()

  useEffect(() => {
    fetchAuctions()
    const unsubscribe = subscribeToAuctions()
    return () => unsubscribe()
  }, [fetchAuctions, subscribeToAuctions])

  if (loading && activeAuctions.length === 0) {
    return <div className="text-white text-center py-4">Chargement des enchères...</div>
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {activeAuctions.map((auction) => (
          <motion.div
            key={auction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Enchère en cours</p>
                <h3 className="text-xl font-bold text-white">
                  {auction.current_lowest_bid || auction.start_price}€
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-orange-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {new Date(auction.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => placeBid(auction.id, (auction.current_lowest_bid || auction.start_price) - 1)}
                className="flex-1 bg-white text-black hover:bg-neutral-200 rounded-xl h-12 font-bold"
              >
                Miser {(auction.current_lowest_bid || auction.start_price) - 1}€
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {activeAuctions.length === 0 && !loading && (
        <div className="text-neutral-500 text-center py-8">
          Aucune enchère disponible pour le moment
        </div>
      )}
    </div>
  )
}
