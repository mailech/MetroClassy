import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail, FiPhone, FiMapPin, FiSun, FiMoon } from 'react-icons/fi';
import logoPrimary from '../../assets/logo-classy.png';
import logoBadge from '../../assets/logo-badge.png';
import logoCraftedMain from '../../assets/logo-crafted-main.png';
import { useTheme } from '../../context/ThemeContext';

const Footer = () => {
  const { theme, toggleTheme } = useTheme();
  const crestLogo = theme === 'light' ? logoBadge : logoPrimary;
  const currentYear = new Date().getFullYear();
  const footerLogos = [
    { src: crestLogo, label: 'Wordmark' },
    { src: logoBadge, label: 'Sigil' },
  ];

  const navigation = {
    main: [
      { name: 'Home', href: '/' },
      { name: 'Products', href: '/products' },
      { name: 'About', href: '#' },
      { name: 'Contact', href: '#' },
      { name: 'Terms & Conditions', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
    social: [
      {
        name: 'Facebook',
        href: '#',
        icon: FiFacebook,
      },
      {
        name: 'Instagram',
        href: '#',
        icon: FiInstagram,
      },
      {
        name: 'Twitter',
        href: '#',
        icon: FiTwitter,
      },
      {
        name: 'LinkedIn',
        href: '#',
        icon: FiLinkedin,
      },
    ],
    contact: [
      {
        icon: FiMapPin,
        text: 'khaliyamari, Dibrugarh, Assam',
      },
      {
        icon: FiPhone,
        text: '8812888298',
      },
      {
        icon: FiMail,
        text: 'metroclassy1223@gmail.com',
      },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-5">
          {/* About */}
          <div className="space-y-3 pl-4">
            <img
              src={logoCraftedMain}
              alt="MetroClassy signature"
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
            <p className="text-gray-400 text-sm leading-relaxed">
              Crafted for comfort, designed for you. Discover couture-grade drops that
              bring the MetroClassy lifestyle to every wardrobe.
            </p>
            <div className="flex space-x-3">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" />
                </a>
              ))}
            </div>

          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-1.5 text-sm">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
            <ul className="space-y-2.5 text-sm">
              {navigation.contact.map((item, index) => (
                <li key={index} className="flex items-start">
                  <item.icon className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-400">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-3">
              Subscribe to our newsletter for the latest updates and offers.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-3 py-2 rounded-l-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm rounded-r-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* =======================
            MOBILE FOOTER
           ======================= */}
        <div className="md:hidden flex flex-col items-center text-center space-y-8">
          <img
            src={logoCraftedMain}
            alt="MetroClassy"
            className="h-12 w-auto object-contain opacity-80"
          />

          {/* Minimal Mobile Navigation */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {navigation.main.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-gray-300 hover:text-white"
              >
                {item.name === 'Home' ? 'Shop' : item.name}
              </Link>
            ))}
          </div>

          {/* Social Icons Row */}
          <div className="flex gap-6">
            {navigation.social.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="bg-white/5 p-3 rounded-full text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.name}
              >
                <item.icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          {/* Newsletter input condensed */}
          <div className="w-full max-w-xs">
            <form className="relative">
              <input
                type="email"
                placeholder="Join the newsletter"
                className="w-full bg-gray-800 text-sm text-white rounded-full py-3 px-5 border border-gray-700 focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="absolute right-1 top-1 bottom-1 bg-indigo-600 text-white rounded-full px-4 text-xs font-bold uppercase tracking-wider">
                OK
              </button>
            </form>
          </div>


        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-center text-gray-500 text-[11px] tracking-[0.2em]">
              &copy; {currentYear} MetroClassy. All rights reserved.
            </p>
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-700 text-gray-100 hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
