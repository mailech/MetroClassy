import { useEffect, useMemo, useState } from 'react';
import axios from '../utils/axios';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await axios.get('/discount-wheel');
        if (data?.segments?.length) {
          setSegments(data.segments.filter((seg) => seg.active !== false));
        }
      } catch (error) {
        console.error('Failed to load discount wheel config', error);
      }
    };

    fetchConfig();
  }, []);

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

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const random = Math.random();
    let cumulative = 0;
    let target = segments[segments.length - 1];
    for (const seg of segments) {
      cumulative += seg.probability;
      if (random <= cumulative) {
        target = seg;
        break;
      }
    }

    setTimeout(() => {
      setSelectedSegment(target);
      setIsSpinning(false);

      const event = new CustomEvent('show-notification', {
        detail: {
          message: `You unlocked ${target.label} (${target.couponCode})`,
          type: target.label.toLowerCase().includes('try') ? 'info' : 'success',
        },
      });
      window.dispatchEvent(event);
    }, 2000);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur">
      <h3 className="text-lg font-semibold tracking-[0.2em] uppercase text-white/80">Discount Wheel</h3>
      <p className="text-sm text-white/70 mt-2">
        Spin once per session to reveal an instant perk. Configured via MongoDB so your rewards persist.
      </p>
      <div className="mt-6 flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex items-center justify-center">
          <div
            className="h-48 w-48 rounded-full border border-white/30 shadow-inner"
            style={{
              background: `conic-gradient(${gradientString})`,
              transition: 'transform 2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              transform: isSpinning ? 'rotate(1080deg)' : 'rotate(0deg)',
            }}
          />
          <div className="absolute h-10 w-10 bg-white text-gray-900 flex items-center justify-center rounded-full font-semibold">
            Spin
          </div>
          <div className="absolute -top-5 h-10 w-1 bg-white rounded-full" />
        </div>
        <div className="flex-1 space-y-3">
          {segments.map((segment) => (
            <motion.div
              key={segment.label}
              className={`flex items-center justify-between rounded-2xl px-4 py-3`}
              style={{ backgroundColor: `${segment.color}20`, border: `1px solid ${segment.color}50` }}
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <p className="text-sm font-semibold">{segment.label}</p>
                <p className="text-xs text-white/70">{segment.reward}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.3em]">{Math.round(segment.probability * 100)}%</span>
            </motion.div>
          ))}
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className="w-full rounded-full bg-white/90 py-3 text-sm font-semibold text-gray-900 hover:bg-white disabled:opacity-60"
          >
            {isSpinning ? 'Spinning...' : 'Spin wheel'}
          </button>
          {selectedSegment && (
            <p className="text-sm text-white/90">
              Latest reward: <span className="font-semibold">{selectedSegment.label}</span> · Code:{' '}
              <span className="font-mono">{selectedSegment.couponCode}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountWheel;

