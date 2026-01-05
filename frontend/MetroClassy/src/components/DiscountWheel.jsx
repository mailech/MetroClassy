import { useEffect, useMemo, useState } from 'react';
import axios from '../utils/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';

const fallbackSegments = [
  { label: '5% off', reward: 'Enjoy 5% off', couponCode: 'METRO5', probability: 0.25, color: '#c0b6ff' },
  { label: 'Free Shipping', reward: 'Free shipping', couponCode: 'SHIPFREE', probability: 0.25, color: '#ffc0cb' },
  { label: '10% off', reward: 'Limited 10% drop', couponCode: 'METRO10', probability: 0.25, color: '#a5f3fc' },
  { label: 'Try Again', reward: 'Better luck next time', couponCode: 'TRYAGAIN', probability: 0.25, color: '#f5f5f5' },
];

const DiscountWheel = () => {
  const [segments, setSegments] = useState(fallbackSegments);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(0); // Track spins count
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await axios.get('/discount-wheel');
        if (data?.segments?.length) {
          setSegments(data.segments.filter((seg) => seg.active !== false));
        }
        // Check usage/spins
        try {
          const { data: usageData } = await axios.get('/discount-wheel/check-usage');
          // Backend now returns spinsAvailable
          setSpinsLeft(usageData.spinsAvailable !== undefined ? usageData.spinsAvailable : (usageData.hasUsed ? 0 : 1));
        } catch (err) {
          console.log('Usage check skipped or failed', err);
        }
      } catch (error) {
        console.error('Failed to load discount wheel config', error);
      }
    };

    fetchConfig();
  }, []);

  const [rotation, setRotation] = useState(0);

  const gradientString = useMemo(() => {
    const colors = segments.map((seg) => seg.color || '#ffffff');
    const slice = 360 / colors.length;
    return colors
      .map((color, index) => {
        const start = index * slice;
        const end = start + slice;
        return `${color} ${start}deg ${end}deg`;
      })
      .join(', ');
  }, [segments]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const spinWheel = async () => {
    if (isSpinning || spinsLeft <= 0) return;
    setIsSpinning(true);
    setError('');

    try {
      // 1. Call backend to get the result
      const { data } = await axios.post('/discount-wheel/spin');

      if (!data.success) {
        throw new Error(data.message || 'Spin failed');
      }

      const wonSegment = data.segment;

      // 2. Calculate rotation to land on the winner
      // Find index of the won segment
      const segmentIndex = segments.findIndex(s => s.couponCode === wonSegment.couponCode);
      const segmentCount = segments.length;
      const sliceAngle = 360 / segmentCount;

      // To bring the segment to top (pointer), we rotate so that the segment's center aligns with top.
      // Conic gradient starts 0deg at top and goes CW. 
      // Segment i starts at i*slice and ends at (i+1)*slice. Center is (i+0.5)*slice.
      // We want this center to be at 0deg (Top).
      // So we need to rotate the WHEEL counter-clockwise by centerAngle. 
      // Or Clockwise by (360 - centerAngle).
      // Add extra spins (5 * 360).

      const centerAngle = (segmentIndex + 0.5) * sliceAngle;

      // Add random jitter within the slice (+/- 40% of slice width) to look natural
      const jitter = (Math.random() - 0.5) * (sliceAngle * 0.8);

      const targetRotation = 1800 + (360 - centerAngle) + jitter; // 5 full spins + alignment

      setRotation(targetRotation);

      setTimeout(() => {
        setSelectedSegment(wonSegment);
        setIsSpinning(false);
        // Keep the rotation, don't reset to 0
        // ... (rest of logic)
        setShowWinnerModal(true);
        // Update spins left from backend response
        if (data.spinsAvailable !== undefined) {
          setSpinsLeft(data.spinsAvailable);
        } else {
          setSpinsLeft(prev => Math.max(0, prev - 1));
        }

        // Optional: Dispatch event for notifications
        const event = new CustomEvent('show-notification', {
          detail: {
            message: `You unlocked ${wonSegment.label}!`,
            type: 'success',
          },
        });
        window.dispatchEvent(event);
      }, 3000);

    } catch (err) {
      console.error('Spin error:', err);
      setIsSpinning(false);
      setError(err.response?.data?.message || err.message || 'Failed to spin. Please try again.');

      if (err.response?.data?.spinsAvailable !== undefined) {
        setSpinsLeft(err.response.data.spinsAvailable);
      }
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold tracking-[0.2em] uppercase text-white/80">Discount Wheel</h3>
      <p className="text-sm text-white/70 mt-2 max-w-md">
        Spin to reveal an instant perk. {spinsLeft > 0 ? `You have ${spinsLeft} spins remaining today.` : "No spins available."}
      </p>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col lg:flex-row items-center gap-8">
        {/* Wheel Graphic */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
          <div
            className="h-56 w-56 rounded-full border-4 border-white/10 shadow-2xl relative z-10"
            style={{
              background: `conic-gradient(${gradientString})`,
              transition: isSpinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0, 1)' : 'none',
              transform: `rotate(${rotation}deg)`,
            }}
          />

          {/* Center Knob */}
          <div className="absolute h-12 w-12 bg-white text-indigo-900 border-4 border-indigo-100 flex items-center justify-center rounded-full font-bold shadow-lg z-20">
            METRO
          </div>

          {/* Indicator */}
          <div className="absolute -top-6 z-30 filter drop-shadow-md">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white" />
          </div>
        </div>

        {/* Action / Legend */}
        <div className="flex-1 space-y-3 w-full max-w-sm">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {segments.slice(0, 4).map((segment) => (
              <div key={segment.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-xs text-white/70 truncate">{segment.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-indigo-200 font-semibold uppercase tracking-wider mb-2 px-1">
            <span>Result</span>
            <span>{spinsLeft} Spins Left</span>
          </div>

          <button
            onClick={spinWheel}
            disabled={isSpinning || spinsLeft <= 0}
            className={`w-full relative overflow-hidden group rounded-full py-3.5 text-sm font-bold tracking-wider transition-all
              ${isSpinning || spinsLeft <= 0
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white text-indigo-950 hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/20'
              }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSpinning ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Spinning...
                </>
              ) : spinsLeft <= 0 ? (
                'No Spins Left'
              ) : (
                'SPIN THE WHEEL'
              )}
            </span>
          </button>

          {spinsLeft <= 0 && !isSpinning && (
            <p className="text-center text-xs text-white/50">
              Check your rewards in the checkout page or profile.
            </p>
          )}
        </div>
      </div>

      {/* Winner Modal Overlay */}
      <AnimatePresence>
        {showWinnerModal && selectedSegment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 text-center shadow-2xl"
            >
              <button
                onClick={() => setShowWinnerModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>

              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4 text-3xl">
                🎉
              </div>

              <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedSegment.label}</h4>
              <p className="text-gray-600 mb-6">{selectedSegment.reward}</p>

              <div className="bg-gray-100 rounded-xl p-3 mb-6 flex items-center justify-between border border-gray-200 dashed-border">
                <span className="font-mono font-bold text-lg text-indigo-600 tracking-wider">
                  {selectedSegment.couponCode}
                </span>
                <button
                  onClick={() => handleCopy(selectedSegment.couponCode)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                  title="Copy Code"
                >
                  {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Continue Shopping
                </button>
                <p className="text-xs text-center text-gray-500">
                  Code copied? Apply it at checkout!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscountWheel;

