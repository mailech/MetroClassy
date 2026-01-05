import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios'; // Use configured instance
import { FiType, FiAperture, FiAward, FiArrowLeft, FiDisc, FiCommand, FiLayers, FiActivity } from 'react-icons/fi';
import DiscountWheel from '../components/DiscountWheel';
import logoLight from '../assets/logo-light-mode.png';
import logoDark from '../assets/logo-dark-mode.png';
import swirlLogo from '../assets/logo-watermark.png';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import TiltCard from '../components/TiltCard';
import { getImageUrl } from '../utils/imageUtils';

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
    category: 'Abyss',
    price: 289,
    description: 'Matte satin jacket with hand-applied lettering embroidery.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'wordmark-2',
    name: 'Letterpress Tote',
    category: 'Abyss',
    price: 148,
    description: 'Full-grain leather tote featuring debossed MetroClassy letters.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'sigil-1',
    name: 'Infinity Sigil Brooch',
    category: 'Floral Reverie',
    price: 96,
    description: 'Polished palladium brooch with the iconic infinity ring.',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'sigil-2',
    name: 'Sigil Resin Clutch',
    category: 'Floral Reverie',
    price: 210,
    description: 'Smoked resin clutch featuring the circular insignia inlay.',
    image: 'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'outline-1',
    name: 'Outline Seal Scarf',
    category: 'Asphalt Nocturne',
    price: 120,
    description: 'Featherweight silk scarf with tonal outline repeat.',
    image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'outline-2',
    name: 'Contour Traveler',
    category: 'Unvoiced Arc',
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  // Simplified animations: Removed heavy useScroll/useTransform logic for performance
  const brandLogos = [
    { src: themePrimaryLogo, label: 'MetroClassy Wordmark' },
    { src: themePrimaryLogo, label: 'MetroClassy Sigil' },
  ];
  const sectionSurface = theme === 'light' ? 'bg-white text-gray-900' : 'bg-[#060818] text-white';
  const sectionMuted = theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-[#030414] text-white';
  const secondaryText = theme === 'light' ? 'text-gray-500' : 'text-white/70';

  const filterCategories = [
    {
      label: 'Abyss',
      description: 'Deep dive into the unknown aesthetics.',
      logo: themePrimaryLogo,
      icon: FiDisc,
      count: 18,
      slug: 'abyss',
    },
    {
      label: 'Floral Reverie',
      description: 'Nature inspired patterns and flows.',
      logo: themePrimaryLogo,
      icon: FiCommand,
      count: 12,
      slug: 'floral-reverie',
    },
    {
      label: 'Asphalt Nocturne',
      description: 'Urban nightscapes and gritty textures.',
      logo: themePrimaryLogo,
      icon: FiLayers,
      count: 9,
      slug: 'asphalt-nocturne',
    },
    {
      label: 'Unvoiced Arc',
      description: 'Silent geometry and subtle curves.',
      logo: themePrimaryLogo,
      icon: FiActivity,
      count: 7,
      slug: 'unvoiced-arc',
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
    if (selectedCategory === category.label) {
      handleCategorySelect('all');
    } else {
      handleCategorySelect(category.label);
    }
    // handleNavigateToCategory(category.slug); // Stay on page for "Collection edit" section
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

  // Click handler state
  const clickTimeoutRef = useRef(null);

  const handleInteraction = (e, item) => {
    // Prevent default to avoid unwanted selection/behavior
    if (e.preventDefault) e.preventDefault();

    // Check click count from event (standard DOM property)
    // If e.detail is not available (e.g. some synthetic events), default to 1.
    const clickCount = e.detail || 1;

    if (clickCount === 1) {
      // Create a timeout to allow for a potential second click
      clickTimeoutRef.current = setTimeout(() => {
        // If this timer fires, it was a SINGLE click -> Navigate
        navigate(`/product/${item._id || item.id}`);
      }, 250); // 250ms delay is standard for distinguishing clicks
    } else if (clickCount === 2) {
      // Double click detected!
      // Clear the single-click navigation timer
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }

      // Perform Wishlist Toggle
      toggleWishlist(item);
      const action = 'Added to Wishlist'; // We could check `isInWishlist` but this is a simplified feedback
      pushInteractionMessage(`${action}: ${item.name}`);

      // Trigger a custom event for visual feedback (confetti/toast) if configured globally
      const event = new CustomEvent('show-notification', {
        detail: { message: `${item.name} added to wishlist!`, type: 'success' },
      });
      window.dispatchEvent(event);
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
          <div
            className="hidden lg:grid relative gap-10 lg:grid-cols-2 rounded-3xl p-8 sm:p-12 text-white shadow-2xl hero-canvas"
            style={{
              backgroundImage: 'linear-gradient(135deg, rgba(34, 29, 58, 0.96) 0%, rgba(54, 42, 99, 0.9) 40%, rgba(44, 86, 150, 0.92) 100%)',
              backgroundBlendMode: 'overlay',
              backgroundSize: 'cover',
            }}
          >
            {/* Ambient orbs - Reduced blur for performance */}
            <div
              className="hero-orb absolute rounded-full blur-[40px] will-change-transform"
              style={{
                width: '260px',
                height: '260px',
                top: '12%',
                left: '6%',
                background: 'radial-gradient(circle, rgba(120, 96, 255, 0.4), transparent 70%)',
              }}
              aria-hidden="true"
            />
            <div
              className="hero-orb absolute rounded-full blur-[45px] will-change-transform"
              style={{
                width: '320px',
                height: '320px',
                bottom: '8%',
                right: '10%',
                background: 'radial-gradient(circle, rgba(66, 188, 255, 0.3), transparent 70%)',
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

            <div
              className="relative z-10 flex items-center justify-center transition-transform duration-300 hover:scale-[1.01]"
            >
              <div className="relative h-[600px] w-full max-w-lg">
                <motion.div
                  className="absolute -top-6 -left-6 h-32 w-32 rounded-3xl bg-white/10 blur-xl will-change-transform"
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
            </div>
          </div>

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
            {products.slice(0, 3).map((product, idx) => ( // Use dynamic products
              <motion.div
                key={product._id} // Use _id
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
                      src={getImageUrl(product.images?.[0] || product.image)}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x600?text=No+Image';
                      }}
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
                        ₹{product.price}
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



      {/* Metro Rewards / Discount Wheel Section */}
      <div className="py-16 bg-gray-900 border-y border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest uppercase">
                Member Perks
              </span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Unlock Exclusive <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  Rewards Daily
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-md">
                Spin the wheel to win exclusive discounts, free shipping, and limited edition access. One spin available per user.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Instant Win</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Valid on all items</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20"></div>
              <DiscountWheel />
            </div>
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
                The Collection edit
              </h2>
              <p className="mt-2 text-indigo-100/80 max-w-2xl">
                Toggle a capsule to preview headline pieces or jump directly to the dedicated category shelf.
              </p>
            </div>
            {/* Search removed as per new design */}
          </div>

          <div className="mt-10 flex gap-4 overflow-x-auto pb-4 sm:flex-wrap sm:overflow-visible sm:pb-0 no-scrollbar snap-x">
            {themedFilterCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryNavigate(category)}
                  className={`flex-shrink-0 snap-start flex items-center gap-3 rounded-3xl px-5 py-3 transition-all border ${selectedCategory === category.label
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
