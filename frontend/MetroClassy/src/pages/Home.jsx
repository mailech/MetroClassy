import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios'; // Use configured instance
import { FiType, FiAperture, FiAward, FiArrowLeft } from 'react-icons/fi';
import logoLight from '../assets/logo-light-mode.png';
import logoDark from '../assets/logo-dark-mode.png';
import swirlLogo from '../assets/logo-watermark.png';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import TiltCard from '../components/TiltCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    y: -5,
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  },
};

const curatedProducts = [
  {
    id: 'wordmark-1',
    name: 'Wordmark Satin Bomber',
    category: 'Wordmark',
    price: 289,
    description: 'Matte satin jacket with hand-applied lettering embroidery.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'wordmark-2',
    name: 'Letterpress Tote',
    category: 'Wordmark',
    price: 148,
    description: 'Full-grain leather tote featuring debossed MetroClassy letters.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'sigil-1',
    name: 'Infinity Sigil Brooch',
    category: 'Infinity Sigil',
    price: 96,
    description: 'Polished palladium brooch with the iconic infinity ring.',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'sigil-2',
    name: 'Sigil Resin Clutch',
    category: 'Infinity Sigil',
    price: 210,
    description: 'Smoked resin clutch featuring the circular insignia inlay.',
    image: 'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'outline-1',
    name: 'Outline Seal Scarf',
    category: 'Outline Seal',
    price: 120,
    description: 'Featherweight silk scarf with tonal outline repeat.',
    image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'outline-2',
    name: 'Contour Traveler',
    category: 'Outline Seal',
    price: 340,
    description: 'Weekender crafted from nubuck with outline seal hardware.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
];
const trendingProducts = curatedProducts.slice(0, 3);

const saliumHeroProduct = {
  name: 'Heirloom Atelier Trench',
  description:
    'Hand-tailored double-breasted trench featuring embroidered wordmark lining and detachable infinity sigil brooch.',
  price: 520,
  badge: 'Signature Atelier',
};
const interactiveWardrobe = [
  {
    id: 'atelier-coat',
    name: 'Atelier Shadow Coat',
    dna: 'MetroStyle',
    colorStory: 'Graphite / Moonstone',
    price: 450,
    reaction: 'Tap to feel the fabric story',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'anime-knit',
    name: 'Anime Knit Set',
    dna: 'Anime Inspired',
    colorStory: 'Quartz / Neon Lilac',
    price: 280,
    reaction: 'Double tap to bookmark',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'minimal-suit',
    name: 'Minimal Ritual Suit',
    dna: 'Minimalist',
    colorStory: 'Ivory / Soft Gold',
    price: 520,
    reaction: 'Long press for designer notes',
    image:
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
  },
];
const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 150, y: 150 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [interactionMessage, setInteractionMessage] = useState('');
  const messageTimeoutRef = useRef(null);

  // Slider state for Limited Luxe Capsule card
  const [currentSlide, setCurrentSlide] = useState(0);
  const capsuleSlides = [
    '/assets/limited-luxe/product-01.jpeg',
    '/assets/limited-luxe/product-02.jpeg',
    '/assets/limited-luxe/product-03.jpeg',
    '/assets/limited-luxe/product-04.jpeg',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % capsuleSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();
  const { theme } = useTheme();
  const themePrimaryLogo = theme === 'light' ? logoLight : logoDark;
  // Use the same watermark/logo for both themes so the hero card stays consistent
  const heroWatermark = swirlLogo;
  const heroSwirlStyle = { opacity: 0.12 };
  const sectionSwirlStyle = { opacity: 0.12 };
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const brandLogos = [
    { src: themePrimaryLogo, label: 'MetroClassy Wordmark' },
    { src: themePrimaryLogo, label: 'MetroClassy Sigil' },
  ];
  const sectionSurface = theme === 'light' ? 'bg-white text-gray-900' : 'bg-[#060818] text-white';
  const sectionMuted = theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-[#030414] text-white';
  const secondaryText = theme === 'light' ? 'text-gray-500' : 'text-white/70';

  const filterCategories = [
    {
      label: 'Wordmark',
      description: 'Statement staples stamped with the lettering.',
      logo: themePrimaryLogo,
      icon: FiType,
      count: 18,
      slug: 'wordmark',
    },
    {
      label: 'Infinity Sigil',
      description: 'Brooches, jewelry, and hardware featuring the loop.',
      logo: themePrimaryLogo,
      icon: FiAperture,
      count: 12,
      slug: 'infinity-sigil',
    },
    {
      label: 'Outline Seal',
      description: 'Minimal contour pieces for subtle collectors.',
      logo: themePrimaryLogo,
      icon: FiAward,
      count: 9,
      slug: 'outline-seal',
    },
  ];
  const themedFilterCategories = filterCategories.map((category) => {
    // Return category with current theme logo
    return { ...category, logo: themePrimaryLogo };
  });


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axiosInstance.get('/products');
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list.slice(0, 4)); // Show only first 4 products as featured
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products');
        setLoading(false);
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  const handleHeroMouseMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const rotateY = ((x / bounds.width) - 0.5) * 12;
    const rotateX = ((y / bounds.height) - 0.5) * -12;
    setGlowPosition({ x, y });
    setTilt({ x: rotateX, y: rotateY });
  };

  const resetHeroTilt = () => {
    setTilt({ x: 0, y: 0 });
  };

  const filteredCuratedProducts = curatedProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleNavigateToCategory = (categoryLabelOrSlug) => {
    const match = filterCategories.find(
      (cat) => cat.label === categoryLabelOrSlug || cat.slug === categoryLabelOrSlug
    );
    const slug =
      match?.slug || categoryLabelOrSlug.toLowerCase().replace(/\s+/g, '-');
    navigate(`/products?category=${encodeURIComponent(slug)}`);
  };

  const handleCategoryNavigate = (category) => {
    handleCategorySelect(category.label);
    handleNavigateToCategory(category.slug);
  };

  const pushInteractionMessage = (text) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setInteractionMessage(text);
    messageTimeoutRef.current = setTimeout(() => {
      setInteractionMessage('');
    }, 2400);
  };

  const handleInteraction = (e, item) => {
    // Prevent default to ensure our logic runs
    // Note: If you want text selection or other default behaviors, be careful.
    // For cards, usually blocking default is fine.

    const clickCount = e.detail;

    if (clickCount === 1) {
      // Optional: Single click preview or navigate
      // pushInteractionMessage(`Previewing ${item.name}`);
    } else if (clickCount === 2) {
      // Double click: Like
      toggleWishlist(item);
      pushInteractionMessage(`Saved to Wishlist: ${item.name}`);

      // Add a temporary subtle scale animation or heart pop effect if we had a ref
    } else if (clickCount === 3) {
      // Triple click: Add to Bag
      addToCart(item);
      pushInteractionMessage(`Added to Cart: ${item.name}`);
    }
  };

  // Removed old handlers to avoid confusion


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  return (
    <div className="surface min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          {/* =====================================================================================
              DESKTOP HERO VIEW (Hidden on Mobile)
              ===================================================================================== */}
          <motion.div
            className="hidden lg:grid relative gap-10 lg:grid-cols-2 rounded-3xl p-8 sm:p-12 text-white shadow-2xl hero-canvas"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={resetHeroTilt}
            style={{
              backgroundImage: 'linear-gradient(135deg, rgba(34, 29, 58, 0.96) 0%, rgba(54, 42, 99, 0.9) 40%, rgba(44, 86, 150, 0.92) 100%)',
              backgroundBlendMode: 'overlay',
              backgroundSize: 'cover',
            }}
          >
            {/* Ambient orbs for typical desktop view */}
            <motion.div
              className="hero-orb"
              style={{
                y: y1,
                width: '260px',
                height: '260px',
                top: '12%',
                left: '6%',
                background: 'radial-gradient(circle, rgba(120, 96, 255, 0.55), transparent 60%)',
              }}
              aria-hidden="true"
            />
            <motion.div
              className="hero-orb slow"
              style={{
                y: y2,
                width: '320px',
                height: '320px',
                bottom: '8%',
                right: '10%',
                background: 'radial-gradient(circle, rgba(66, 188, 255, 0.45), transparent 60%)',
              }}
              aria-hidden="true"
            />
            <motion.div
              className="hero-orb pulse"
              style={{
                y: y1,
                width: '180px',
                height: '180px',
                bottom: '22%',
                left: '32%',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.16), transparent 70%)',
              }}
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <motion.img
                src={heroWatermark}
                alt="MetroClassy emblem"
                className="w-full max-w-[520px] object-contain"
                style={heroSwirlStyle}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: heroSwirlStyle.opacity, scale: 1 }}
                transition={{ duration: 1 }}
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
            >
              <div
                className="absolute h-64 w-64 rounded-full bg-white/10 blur-3xl transition-all duration-300"
                style={{
                  left: `${glowPosition.x - 128}px`,
                  top: `${glowPosition.y - 128}px`,
                }}
              ></div>
            </div>

            <div className="relative z-10">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-[0.2em] text-indigo-100"
              >
                Crafted for comfort · Designed for you
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mt-6 text-4xl font-extrabold sm:text-5xl md:text-6xl leading-tight"
              >
                Elevate your style with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-cyan-200 pb-1">
                  MetroClassy Signatures
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 text-lg text-indigo-100/90 max-w-xl"
              >
                A curated collection of iconic pieces that blend timeless elegance
                with modern sensibilities. Discover limited-run drops, premium craftsmanship,
                and immersive shopping experiences.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <Link
                  to="/products"
                  className="inline-flex items-center rounded-full bg-white px-8 py-3 text-base font-semibold text-indigo-700 shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Explore Collection
                </Link>
                <Link
                  to="/cart"
                  className="inline-flex items-center rounded-full border border-white/30 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  View Cart
                </Link>
              </motion.div>

              <div className="mt-10 flex flex-wrap gap-6">
                {[
                  { label: 'Premium Drops', value: '120+' },
                  { label: 'Happy Buyers', value: '45K' },
                  { label: 'Design Awards', value: '18' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 * index }}
                    className="flex flex-col"
                  >
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <span className="text-sm text-indigo-100/80">{stat.label}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10">
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-200 mb-4">
                  Our insignia
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  {brandLogos.map((logo, index) => (
                    <motion.div
                      key={logo.label}
                      className="group relative flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.img
                        src={logo.src}
                        alt={logo.label}
                        className="h-10 w-10 object-contain drop-shadow-lg"
                        whileHover={{ rotate: 2 }}
                      />
                      <span className="text-sm font-medium text-indigo-50">
                        {logo.label}
                      </span>
                      <span className="absolute inset-0 rounded-2xl border border-white/20 opacity-0 transition group-hover:opacity-100"></span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <motion.div
              className="relative z-10 flex items-center justify-center"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
            >
              <div className="relative h-[600px] w-full max-w-lg">
                <motion.div
                  className="absolute -top-6 -left-6 h-32 w-32 rounded-3xl bg-white/10 blur-2xl"
                  animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-10 right-0 h-16 w-16 rounded-full border border-white/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="relative h-full w-full rounded-3xl bg-white/5 p-6 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      className="absolute inset-0 z-0"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                    >
                      <img
                        src={capsuleSlides[currentSlide]}
                        alt="Limited Luxe Capsule"
                        className="h-full w-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    </motion.div>
                  </AnimatePresence>

                  <div className="relative z-10 flex h-full flex-col justify-end p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-between"
                    >
                      <div className="rounded-full bg-black/30 px-4 py-2 backdrop-blur-md border border-white/10">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
                          Limited Luxe
                        </span>
                      </div>
                      <Link
                        to="/products?category=limited-luxe"
                        className="flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 text-sm font-bold transition hover:bg-gray-200"
                      >
                        Shop Drop <FiArrowLeft className="rotate-180" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* =====================================================================================
              MOBILE HERO VIEW (Visible ONLY on Mobile)
              ===================================================================================== */}
          <motion.div
            className="lg:hidden relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Background Image Slider (Full Cover) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <img
                  src={capsuleSlides[currentSlide]}
                  alt="MetroMobile"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />

            {/* Mobile Content (Bottom Aligned) */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 pb-8 text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300 mb-2">
                  Premium Collection
                </p>
                <h1 className="text-3xl font-extrabold leading-tight mb-2">
                  MetroClassy<br />Signatures
                </h1>
                <p className="text-sm text-gray-200 mb-6 line-clamp-2">
                  Iconic pieces that blend timeless elegance with modern minimalist vibes.
                </p>

                <div className="flex gap-3">
                  <Link
                    to="/products"
                    className="flex-1 text-center bg-white text-black font-bold py-3 px-6 rounded-full text-sm shadow-lg hover:bg-gray-100 transition"
                  >
                    Explore
                  </Link>
                  <Link
                    to="/cart"
                    className="flex-1 text-center bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-3 px-6 rounded-full text-sm hover:bg-white/30 transition"
                  >
                    Bag
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trending Capsules */}
      <div className={`py-12 transition-colors duration-300 ${sectionSurface}`}>
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-[2.5rem] ${theme === 'light'
            ? 'bg-gradient-to-br from-white via-indigo-50/40 to-white shadow-[0_35px_45px_rgba(15,15,40,0.08)]'
            : 'bg-gradient-to-br from-[#0d1028] via-[#121437] to-[#060818]'
            }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">
                Fresh drops
              </p>
              <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Trending insignia capsules
              </h2>
              <p className={`${secondaryText} mt-1`}>
                A taste of the latest wordmark and sigil edits—kept light to avoid clutter.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Shop all products →
            </Link>
          </div>
          <div className="relative mt-8 grid grid-cols-2 gap-3 gap-y-6 lg:grid-cols-3 lg:gap-6">
            {trendingProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
              >
                <TiltCard
                  onClick={(e) => handleInteraction(e, product)}
                  className={`rounded-3xl border p-6 shadow-lg cursor-pointer h-full ${theme === 'light'
                    ? 'border-gray-100 bg-gradient-to-br from-white via-indigo-50/30 to-white'
                    : 'border-white/10 bg-gradient-to-br from-[#10122d] via-[#0d0f25] to-[#050615]'
                    }`}
                >
                  <div className="aspect-[5/3] w-full overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-110"
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-gray-500">
                      {product.category}
                    </span>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className={`text-sm ${secondaryText} line-clamp-2`}>{product.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-base font-semibold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-200'}`}>
                        ${product.price}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Don't trigger card interaction
                          handleNavigateToCategory(product.category);
                        }}
                        className={`text-xs uppercase tracking-[0.3em] ${secondaryText} hover:text-indigo-400`}
                      >
                        Shop category
                      </button>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Wardrobe (Hidden on Mobile for Sleekness) */}
      <div className={`hidden md:block py-12 transition-colors duration-300 ${sectionMuted}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden rounded-[2.5rem]">
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">
                Responsive wardrobe
              </p>
              <h2 className="text-2xl font-bold">Tap, double tap, press & feel</h2>
              <p className={`${secondaryText} mt-1`}>
                These cards react differently to each gesture so you can preview how interactions will feel in the final product grid.
              </p>
            </div>
            {interactionMessage && (
              <div className={`rounded-full px-5 py-3 text-sm shadow ${theme === 'light' ? 'bg-white text-gray-700' : 'bg-white/10 text-white'}`}>
                {interactionMessage}
              </div>
            )}
          </div>
          <div className="relative mt-8 grid gap-6 md:grid-cols-3">
            {interactiveWardrobe.map((item, idx) => (
              <motion.div
                key={item.id}
                className={`rounded-3xl p-6 shadow-lg border cursor-pointer select-none ${theme === 'light' ? 'border-transparent bg-white text-gray-900' : 'border-white/10 bg-[#0c0f2a]/80 text-white backdrop-blur'
                  }`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handleInteraction(e, item)}
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-500">
                    <span>{item.dna}</span>
                    <span>${item.price}</span>
                  </div>
                  <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {item.name}
                  </h3>
                  <p className={`text-sm ${secondaryText}`}>{item.colorStory}</p>
                  <p className={`text-xs tracking-[0.3em] ${secondaryText}`}>{item.reaction}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Signature Filters + Search */}
      <div className="py-16 bg-gradient-to-b from-indigo-950/80 via-slate-950 to-gray-50 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-indigo-200">
                Signature Insignias
              </p>
              <h2 className="mt-4 text-3xl font-bold">
                Browse by emblem, material, and couture story
              </h2>
              <p className="mt-2 text-indigo-100/80 max-w-2xl">
                Toggle a capsule to preview headline pieces or jump directly to the dedicated category shelf.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search featured items..."
                className="w-full rounded-full border border-white/10 bg-white/10 py-3 pl-5 pr-12 text-sm text-white placeholder:text-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
              />
              <svg
                className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z" />
              </svg>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {themedFilterCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryNavigate(category)}
                  className={`flex items-center gap-3 rounded-3xl px-5 py-3 transition-all border ${selectedCategory === category.label
                    ? 'bg-white text-gray-900 shadow-lg shadow-indigo-700/30 border-indigo-200'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/30'
                    }`}
                >
                  <span className="h-10 w-10 rounded-2xl bg-white/90 flex items-center justify-center overflow-hidden text-indigo-950">
                    {Icon ? (
                      <Icon className="h-5 w-5" />
                    ) : (
                      <img src={category.logo} alt={`${category.label} logo`} className="h-7 w-7 object-contain" />
                    )}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{category.label}</p>
                    <p className="text-xs opacity-70">{category.count} styles</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCuratedProducts.length > 0 ? (
              filteredCuratedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/30">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-indigo-100/80">
                      <span>{product.category}</span>
                      <span>${product.price}</span>
                    </div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-sm text-indigo-100/80">{product.description}</p>
                    <div className="flex items-center gap-4 pt-2">
                      <Link
                        to="/products"
                        className="text-sm font-semibold text-white underline-offset-4 hover:underline"
                      >
                        View detail
                      </Link>
                      <button
                        onClick={() => handleNavigateToCategory(product.category)}
                        className="text-xs uppercase tracking-[0.3em] text-indigo-100/70 hover:text-white"
                      >
                        Shop more →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-white/20 p-10 text-center">
                <p className="text-indigo-100/90">No products match your filters. Try another insignia.</p>
                <button
                  className="mt-4 rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:bg-white/20"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/products')}
              className={`inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              Explore the complete boutique
              <svg
                className="ml-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Salium Font Feature card */}
      <div className={`py-14 transition-colors duration-300 ${sectionMuted}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="salium-card p-10 sm:p-14 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <img
                src={swirlLogo}
                alt=""
                className="w-full max-w-[420px] object-contain"
                style={sectionSwirlStyle}
              />
            </div>
            <div className="salium-card__body space-y-6">
              <p className="text-xs tracking-[0.5em] uppercase text-white/70">
                {saliumHeroProduct.badge}
              </p>
              <h2 className="text-4xl sm:text-5xl leading-tight">
                {saliumHeroProduct.name}
              </h2>
              <p className="text-base text-white/85 max-w-2xl">
                {saliumHeroProduct.description}
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-3xl tracking-[0.4em]">
                  ${saliumHeroProduct.price}
                </span>
                <button
                  onClick={() => navigate('/products?category=wordmark')}
                  className={`rounded-full px-6 py-3 text-sm font-semibold ${theme === 'light' ? 'bg-white/90 text-gray-900 hover:bg-white' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  View capsule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className={`py-12 transition-colors duration-300 ${sectionSurface}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden rounded-[2.5rem]">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <img
              src={swirlLogo}
              alt=""
              className="w-full max-w-[520px] object-contain"
              style={sectionSwirlStyle}
            />
          </div>
          <div className="relative text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}
            >
              Featured Products
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`mt-4 max-w-2xl text-xl mx-auto ${secondaryText}`}
            >
              Check out our most popular products
            </motion.p>
          </div>

          {products.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            >
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  variants={itemVariants}
                  whileHover="hover"
                  className={`group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#0d1028] border-white/10'
                    }`}
                >
                  <Link to={`/product/${product._id}`} className="block">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
                      <img
                        src={product.image || 'https://via.placeholder.com/300x300'}
                        alt={product.name}
                        className="w-full h-48 object-cover object-center group-hover:opacity-75 transition-opacity duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className={`text-sm font-medium line-clamp-2 h-12 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {product.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <p className={`text-lg font-semibold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-300'}`}>
                          ${product.price.toFixed(2)}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No featured products available</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="relative inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
            >
              View All Products
              <svg
                className="ml-2 -mr-1 w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
