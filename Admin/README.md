# MetroClassy Admin Console

Admin panel for managing MetroClassy e-commerce platform.

## Features

- **Dashboard**: Overview with key metrics, charts, and recent products
- **Product Management**: Full CRUD operations for products
- **Discount Wheel Editor**: Configure discount wheel segments with visual preview
- **Analytics**: Comprehensive analytics with charts and insights

## Tech Stack

- **Vite** + **React** + **Tailwind CSS** for UI
- **React Query** for data fetching and caching
- **Framer Motion** for animations
- **Recharts** for data visualizations
- **React Router** for navigation
- **Axios** for API calls

## Getting Started

### Installation

```bash
cd Admin
npm install
```

### Development

```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

### Build

```bash
npm run build
```

## Project Structure

```
Admin/
├── src/
│   ├── api/              # API utilities
│   ├── components/       # Reusable components
│   │   ├── layout/      # Layout components (Sidebar, Header)
│   │   └── Notification.jsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── ProductEdit.jsx
│   │   ├── DiscountWheel.jsx
│   │   └── Analytics.jsx
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
└── vite.config.js
```

## Backend Integration

The admin panel connects to the backend API at `http://localhost:5000/api`. Make sure the backend server is running before using the admin panel.

### Available Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/discount-wheel` - Get wheel configuration
- `PUT /api/discount-wheel` - Update wheel configuration

## Features Overview

### Dashboard
- Product statistics (total, inventory value, low stock)
- Revenue overview
- Category distribution charts
- Recent products table

### Products
- List all products with search and filtering
- Create new products
- Edit existing products
- Delete products
- Stock level indicators

### Discount Wheel
- Visual segment editor
- Probability management (auto-normalization)
- Add/remove segments
- Color customization
- Active/inactive toggle
- Visual preview

### Analytics
- Category distribution (pie charts)
- Stock level analysis
- Revenue by category
- Price distribution
- Top products ranking
- Monthly trends

## Notes

- Authentication is currently deferred per the project roadmap
- All API calls use axios with base URL configuration
- React Query handles caching and automatic refetching
- Notifications use custom events for global state management
