"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import axiosInstance from "../../utils/axios";
import { useNavigate } from "react-router-dom";

// Types
export interface Product {
    _id: string;
    id?: string;
    name: string;
    description: string;
    category: string;
    price: number;
    image: string;
    rating?: number;
}

function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

function ActionSearchBar() {
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [results, setResults] = useState<Product[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const debouncedQuery = useDebounce(query, 300);

    // Fetch products on mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axiosInstance.get('/products');
                const list = Array.isArray(data) ? data : data?.products || [];
                setProducts(list);
            } catch (err) {
                console.error("Failed to fetch products for search", err);
            }
        };
        fetchProducts();
    }, []);

    // Initialize Fuse
    const fuse = useMemo(() => {
        return new Fuse(products, {
            keys: ['name', 'category', 'description'],
            threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
            includeScore: true
        });
    }, [products]);

    // Perform Search
    useEffect(() => {
        if (!debouncedQuery) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        // Simulate a tiny delay for effect or just run immediately
        const searchResults = fuse.search(debouncedQuery);
        const topResults = searchResults.slice(0, 5).map(res => res.item);

        setResults(topResults);
        setIsLoading(false);
    }, [debouncedQuery, fuse]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleSelectProduct = (product: Product) => {
        const pid = product._id || product.id;
        navigate(`/product/${pid}`);
        setQuery("");
        setIsFocused(false);
    };

    const container = {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.3 },
                staggerChildren: 0.05,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: { height: { duration: 0.2 }, opacity: { duration: 0.1 } },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: -5, transition: { duration: 0.1 } },
    };

    return (
        <div className="w-full max-w-xl mx-auto relative z-50">
            <div className="relative flex flex-col items-center">
                <div className="w-full relative">
                    <Input
                        type="text"
                        placeholder="Search for products..."
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className="pl-4 pr-10 py-3 h-12 text-base rounded-xl shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 backdrop-blur-md focus-visible:ring-indigo-500 transition-all font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isFocused && (query.length > 0 || results.length > 0) && (
                        <motion.div
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0b0d1a] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
                            variants={container}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                        >
                            {results.length > 0 ? (
                                <motion.ul className="py-2">
                                    {results.map((product) => (
                                        <motion.li
                                            key={product._id || product.id}
                                            variants={item}
                                            className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent blur before click
                                                handleSelectProduct(product);
                                            }}
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={product.image || 'https://via.placeholder.com/100'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {product.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {product.category}
                                                </p>
                                            </div>
                                            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                ₹{product.price}
                                            </div>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            ) : query.length > 1 && !isLoading ? (
                                <motion.div
                                    variants={item}
                                    className="p-6 text-center text-gray-500 text-sm"
                                >
                                    No products found for "{query}"
                                </motion.div>
                            ) : null}

                            <div className="bg-gray-50 dark:bg-white/5 px-4 py-2 text-[10px] text-gray-400 flex justify-between uppercase tracking-wider font-medium">
                                <span>Deep Search Active</span>
                                <span>Press ESC to close</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export { ActionSearchBar };
