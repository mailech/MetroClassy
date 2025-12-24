import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2, FiUpload, FiX, FiExternalLink } from 'react-icons/fi';
import { adminProductsApi, adminCategoriesApi } from '../api/admin';
import { useState, useEffect } from 'react';

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: productData, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminProductsApi.getById(id),
    enabled: isEditing,
  });

  // Fetch categories from API - refetch on window focus to get latest categories
  const { data: categoriesData, refetch: refetchCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCategoriesApi.getAll(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to get latest categories
  });

  const categories = categoriesData?.categories || categoriesData || [];

  // Listen for category updates and refetch immediately
  useEffect(() => {
    const handleCategoriesUpdate = async () => {
      // Force a hard refetch - clear cache and refetch
      queryClient.removeQueries({ queryKey: ['admin-categories'] });
      await queryClient.refetchQueries({ queryKey: ['admin-categories'], type: 'active' });
      await refetchCategories({ cancelRefetch: false });
    };

    window.addEventListener('categories-updated', handleCategoriesUpdate);
    // Also refetch on mount
    refetchCategories({ cancelRefetch: false });

    return () => {
      window.removeEventListener('categories-updated', handleCategoriesUpdate);
    };
  }, [refetchCategories, queryClient]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: 'electronics',
    countInStock: '',
    brand: '',
    gender: '',
    sku: '',
    discountPrice: '',
    isActive: true,
    sizes: [],
    colors: [],
  });

  // Available preset sizes
  const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

  // Temporary state for adding custom colors
  const [newColor, setNewColor] = useState({ name: '', class: '' });

  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]); // Preview URLs for selected files
  const [pendingImageFiles, setPendingImageFiles] = useState([]); // Files waiting to be uploaded
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImageFiles, setMainImageFiles] = useState([]); // Multiple files for new products
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    stock: '',
    sku: '',
    price: '',
    isActive: true,
  });

  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.product?.name || '',
        price: productData.product?.price || '',
        description: productData.product?.description || '',
        image: productData.product?.image || '',
        category: productData.product?.category || 'electronics',
        countInStock: productData.product?.countInStock || '',
        brand: productData.product?.brand || '',
        gender: productData.product?.gender || '',
        sku: productData.product?.sku || '',
        discountPrice: productData.product?.discountPrice || '',
        isActive: productData.product?.isActive !== false,
        sizes: productData.product?.sizes || [],
        colors: productData.product?.colors || [],
      });
      setVariants(productData.variants || []);
      setImages(productData.images || []);
    }
  }, [productData]);

  // Update required attribute on URL input based on file upload
  useEffect(() => {
    const imageInput = document.getElementById('image');
    if (imageInput) {
      if (mainImageFile) {
        imageInput.removeAttribute('required');
        imageInput.setCustomValidity('');
      } else {
        imageInput.setAttribute('required', 'required');
      }
    }
  }, [mainImageFile]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return adminProductsApi.update(id, data);
      }
      return adminProductsApi.create(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message: `Product ${isEditing ? 'updated' : 'created'} successfully`,
            type: 'success',
          },
        })
      );
      if (!isEditing) {
        navigate(`/admin/products/edit/${data._id}`);
      }
    },
    onError: (error) => {
      // Extract user-friendly error message
      let errorMessage = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} product`;

      // Make error messages more user-friendly
      if (errorMessage.includes('validation failed')) {
        // Extract the actual error from validation messages
        const match = errorMessage.match(/:\s*(.+)$/);
        if (match) {
          errorMessage = match[1].replace(/Path `(.+?)`/, 'The $1 field');
        }
      }

      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message: errorMessage,
            type: 'error',
          },
        })
      );
    },
  });

  const variantMutation = useMutation({
    mutationFn: (variantData) => {
      if (variantData._id) {
        return adminProductsApi.updateVariant(variantData._id, variantData);
      }
      return adminProductsApi.addVariant(id, variantData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Variant saved successfully', type: 'success' },
        })
      );
    },
  });

  const imageUploadMutation = useMutation({
    mutationFn: (formData) => adminProductsApi.uploadImages(id, formData),
    onSuccess: (data) => {
      // Add uploaded images to the images array
      const uploadedImages = data.images.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `http://localhost:5000${img.url}`,
      }));
      setImages([...images, ...uploadedImages]);
      // Clear previews
      setImagePreviews([]);
      setPendingImageFiles([]);
      queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Images uploaded successfully', type: 'success' },
        })
      );
    },
    onError: (error) => {
      // Clear previews on error
      setImagePreviews([]);
      setPendingImageFiles([]);
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: error.response?.data?.message || 'Failed to upload images', type: 'error' },
        })
      );
    },
  });

  const handleMainImageUpload = async (files) => {
    const fileArray = Array.isArray(files) ? files : (files ? [files] : []);
    if (fileArray.length === 0) return;

    // Validate all files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validFiles = [];
    const invalidFiles = [];

    fileArray.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (invalid type)`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large)`);
        return;
      }
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message: `Invalid files: ${invalidFiles.join(', ')}. Only JPEG, PNG, WebP under 5MB allowed`,
            type: 'error'
          },
        })
      );
    }

    if (validFiles.length === 0) return;

    setUploadingMainImage(true);
    try {
      if (isEditing && id) {
        // If editing, upload all images to product images endpoint
        const uploadFormData = new FormData();
        validFiles.forEach(file => {
          uploadFormData.append('images', file);
        });
        const response = await adminProductsApi.uploadImages(id, uploadFormData);
        if (response.images && response.images.length > 0) {
          // Set first image as main image
          const imageUrl = `http://localhost:5000${response.images[0].url}`;
          setFormData({ ...formData, image: imageUrl });
          setMainImagePreview(imageUrl);
          // Add all uploaded images to images array
          const uploadedImages = response.images.map(img => ({
            ...img,
            url: img.url.startsWith('http') ? img.url : `http://localhost:5000${img.url}`,
          }));
          setImages(prev => [...prev, ...uploadedImages]);
        }
      } else {
        // For new products, store files and create previews
        const firstFile = validFiles[0];
        const imageUrl = URL.createObjectURL(firstFile);
        setMainImageFile(firstFile); // Store first as main
        setMainImageFiles(validFiles); // Store all files for upload after creation
        setMainImagePreview(imageUrl);
        setFormData({ ...formData, image: '' }); // Clear URL field
        // Clear validation error on URL input since we have files
        const imageInput = document.getElementById('image');
        if (imageInput) {
          imageInput.setCustomValidity('');
          imageInput.removeAttribute('required');
        }
      }
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Failed to upload image', type: 'error' },
        })
      );
    } finally {
      setUploadingMainImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that we have an image (either URL or file)
    if (!formData.image && !mainImageFile && mainImageFiles.length === 0) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Please provide an image URL or upload an image', type: 'error' },
        })
      );
      return;
    }

    // If we have image files for a new product, we need to create the product first
    // then upload the images
    if (!isEditing && (mainImageFile || mainImageFiles.length > 0)) {
      // Create product first with a placeholder image
      // We'll update it with the real image URL after upload
      const submitData = {
        ...formData,
        image: 'https://via.placeholder.com/400?text=Uploading...', // Temporary placeholder
        price: parseFloat(formData.price),
        countInStock: parseInt(formData.countInStock),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        // Convert empty gender string to null
        gender: formData.gender === '' ? null : formData.gender,
        // Remove empty optional fields
        brand: formData.brand || undefined,
        sku: formData.sku || undefined,
      };

      try {
        // Create product
        const createdProduct = await adminProductsApi.create(submitData);

        // Upload all images (main + additional)
        const filesToUpload = mainImageFiles.length > 0 ? mainImageFiles : (mainImageFile ? [mainImageFile] : []);
        if (filesToUpload.length > 0) {
          const uploadFormData = new FormData();
          filesToUpload.forEach(file => {
            uploadFormData.append('images', file);
          });
          const imageResponse = await adminProductsApi.uploadImages(createdProduct._id, uploadFormData);

          if (imageResponse.images && imageResponse.images.length > 0) {
            // Update product with main image URL (first uploaded image)
            const imageUrl = `http://localhost:5000${imageResponse.images[0].url}`;
            await adminProductsApi.update(createdProduct._id, { image: imageUrl });
          }
        }

        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-product', createdProduct._id] });
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: { message: 'Product created successfully', type: 'success' },
          })
        );
        navigate(`/admin/products/edit/${createdProduct._id}`);
      } catch (error) {
        let errorMessage = error.response?.data?.message || 'Failed to create product';

        // Make error messages more user-friendly
        if (errorMessage.includes('validation failed')) {
          const match = errorMessage.match(/:\s*(.+)$/);
          if (match) {
            errorMessage = match[1].replace(/Path `(.+?)`/, 'The $1 field');
          }
        }

        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: { message: errorMessage, type: 'error' },
          })
        );
      }
      return;
    }

    // For editing or if no file upload (using URL)
    // Make sure we don't submit blob URLs
    let imageUrl = formData.image;
    if (imageUrl && imageUrl.startsWith('blob:')) {
      // If it's a blob URL and we're editing, we should have uploaded it already
      // If not, we need to handle it
      if (!isEditing) {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: { message: 'Please wait for image upload to complete', type: 'error' },
          })
        );
        return;
      }
      // For editing, if blob URL, skip it (use existing image)
      imageUrl = productData?.product?.image || '';
    }

    const submitData = {
      ...formData,
      image: imageUrl,
      price: parseFloat(formData.price),
      countInStock: parseInt(formData.countInStock),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
      // Convert empty gender string to null
      gender: formData.gender === '' ? null : formData.gender,
      // Remove empty optional fields
      brand: formData.brand || undefined,
      sku: formData.sku || undefined,
      sizes: formData.sizes,
      colors: formData.colors,
    };
    mutation.mutate(submitData);
  };

  const handleAddVariant = () => {
    if (!id) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Please save the product first', type: 'error' },
        })
      );
      return;
    }

    const variantData = {
      ...newVariant,
      stock: parseInt(newVariant.stock) || 0,
      price: newVariant.price ? parseFloat(newVariant.price) : undefined,
    };

    variantMutation.mutate(variantData, {
      onSuccess: () => {
        setNewVariant({ size: '', color: '', stock: '', sku: '', price: '', isActive: true });
      },
    });
  };

  const handleDeleteVariant = async (variantId) => {
    if (window.confirm('Delete this variant?')) {
      try {
        await adminProductsApi.deleteVariant(variantId);
        setVariants(variants.filter((v) => v._id !== variantId));
        queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: { message: 'Failed to delete variant', type: 'error' },
          })
        );
      }
    }
  };

  const handleImageUpload = (e) => {
    if (!id) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Please save the product first', type: 'error' },
        })
      );
      return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large)`);
        return;
      }
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message: `Invalid files: ${invalidFiles.join(', ')}. Only JPEG, PNG, WebP under 5MB allowed`,
            type: 'error'
          },
        })
      );
    }

    if (validFiles.length === 0) return;

    // Create preview URLs immediately
    const previewIds = validFiles.map((_, index) => `preview-${Date.now()}-${index}`);
    const previews = validFiles.map((file, index) => ({
      id: previewIds[index],
      url: URL.createObjectURL(file),
      name: file.name,
      file: file,
      isPending: true,
    }));

    // Add to previews state
    setImagePreviews(prev => [...prev, ...previews]);
    setPendingImageFiles(prev => [...prev, ...validFiles]);

    // Upload files
    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append('images', file);
    });

    // Store preview IDs to remove after upload
    const uploadedPreviewIds = previewIds;

    imageUploadMutation.mutate(formData, {
      onSuccess: (data) => {
        // Remove the previews that were just uploaded (they're now in the images array)
        setImagePreviews(prev => prev.filter(p => !uploadedPreviewIds.includes(p.id)));
        // Remove the uploaded files from pending list
        setPendingImageFiles(prev => {
          const fileNames = validFiles.map(f => f.name);
          return prev.filter(file => !fileNames.includes(file.name));
        });
        // Clear file input
        if (e.target) {
          e.target.value = '';
        }
      },
      onError: () => {
        // Remove failed previews
        setImagePreviews(prev => prev.filter(p => !uploadedPreviewIds.includes(p.id)));
        // Remove failed files from pending list
        setPendingImageFiles(prev => {
          const fileNames = validFiles.map(f => f.name);
          return prev.filter(file => !fileNames.includes(file.name));
        });
        // Clear file input
        if (e.target) {
          e.target.value = '';
        }
      },
    });
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Delete this image?')) {
      try {
        await adminProductsApi.deleteImage(imageId);
        setImages(images.filter((img) => img._id !== imageId));
        queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: { message: 'Failed to delete image', type: 'error' },
          })
        );
      }
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/admin/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-white/10"
              style={{ color: 'var(--text-secondary)' }}
            >
              <FiArrowLeft className="text-xl" />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
              {isEditing ? 'Update product information' : 'Add a new product to your inventory'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="admin-card space-y-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="admin-label">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="admin-input"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label htmlFor="sku" className="admin-label">SKU</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="admin-input"
                placeholder="PROD-001"
              />
            </div>

            <div>
              <label htmlFor="price" className="admin-label">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                step="0.01"
                className="admin-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="discountPrice" className="admin-label">Discount Price ($)</label>
              <input
                type="number"
                id="discountPrice"
                name="discountPrice"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                min="0"
                step="0.01"
                className="admin-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="category" className="admin-label">Category *</label>
              <div className="flex items-center space-x-2">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="admin-input flex-1"
                >
                  <option value="">Select a category</option>
                  {/* Original hardcoded categories */}
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="books">Books</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                  {/* Dynamic categories from database */}
                  {categories.map((cat) => {
                    const catSlug = cat.slug || cat.name?.toLowerCase();
                    // Only show if not in the hardcoded list above
                    if (!['electronics', 'clothing', 'books', 'home', 'other'].includes(catSlug)) {
                      return (
                        <option key={cat._id || cat.id || cat.slug} value={cat.slug || cat.name}>
                          {cat.name}
                        </option>
                      );
                    }
                    return null;
                  })}
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    // Force a hard refresh
                    queryClient.removeQueries({ queryKey: ['admin-categories'] });
                    await queryClient.refetchQueries({ queryKey: ['admin-categories'] });
                    await refetchCategories({ cancelRefetch: false });
                    window.dispatchEvent(
                      new CustomEvent('show-notification', {
                        detail: { message: 'Categories refreshed', type: 'success' },
                      })
                    );
                  }}
                  disabled={categoriesLoading}
                  className="px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                  title="Refresh categories list"
                >
                  {categoriesLoading ? '⏳' : '🔄'}
                </button>
                <Link
                  to="/admin/categories"
                  target="_blank"
                  className="px-3 py-2 text-sm rounded-lg border transition-colors inline-flex items-center hover:opacity-80"
                  style={{
                    borderColor: 'var(--primary-600)',
                    color: 'var(--primary-600)',
                    backgroundColor: 'transparent'
                  }}
                  title="Open Categories page in new tab to create new category"
                  onClick={(e) => {
                    // Open in new tab and notify user
                    e.preventDefault();
                    window.open('/admin/categories', '_blank');
                    window.dispatchEvent(
                      new CustomEvent('show-notification', {
                        detail: { message: 'Categories page opened in new tab. Create category and come back to refresh.', type: 'info' },
                      })
                    );
                  }}
                >
                  <FiPlus className="mr-1" />
                  Add Category
                  <FiExternalLink className="ml-1 text-xs" />
                </Link>
              </div>
              {categories.length === 0 && (
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  No categories found. <Link to="/admin/categories" className="text-primary-600 hover:underline">Click "Add" button to create one</Link>
                </p>
              )}
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                💡 Available: Electronics, Clothing, Books, Home, Other. Need more? Click "Add Category" → Create → It appears automatically (or click 🔄)
              </p>
            </div>

            <div>
              <label htmlFor="countInStock" className="admin-label">Stock Quantity *</label>
              <input
                type="number"
                id="countInStock"
                name="countInStock"
                value={formData.countInStock}
                onChange={(e) => setFormData({ ...formData, countInStock: e.target.value })}
                required
                min="0"
                className="admin-input"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="brand" className="admin-label">Brand</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="admin-input"
                placeholder="Brand name"
              />
            </div>

            <div>
              <label htmlFor="gender" className="admin-label">
                Gender <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(Optional - only for clothing)</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="admin-input"
              >
                <option value="">Not Applicable (leave empty for items)</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Select a gender option only for clothing items. Leave empty for electronics, books, home items, etc.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="admin-label">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows="4"
              className="admin-input"
              placeholder="Detailed product description"
            />
          </div>
        </div>

        {/* Variants: Sizes & Colors */}
        <div className="admin-card space-y-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Variants</h2>

          {/* Sizes */}
          <div>
            <label className="admin-label mb-2 block">Sizes</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    const currentSizes = formData.sizes || [];
                    const newSizes = currentSizes.includes(size)
                      ? currentSizes.filter(s => s !== size)
                      : [...currentSizes, size];
                    setFormData({ ...formData, sizes: newSizes });
                  }}
                  className={`px-3 py-1 rounded border text-sm transition-colors ${(formData.sizes || []).includes(size)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {/* Custom Size Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom size (e.g. 42)"
                className="admin-input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.target.value.trim();
                    if (val && !formData.sizes.includes(val)) {
                      setFormData({ ...formData, sizes: [...(formData.sizes || []), val] });
                      e.target.value = '';
                    }
                  }
                }}
              />
              <p className="text-xs self-center" style={{ color: 'var(--text-tertiary)' }}>Press Enter to add</p>
            </div>

            {(formData.sizes || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm self-center" style={{ color: 'var(--text-secondary)' }}>Selected:</span>
                {(formData.sizes || []).map(size => (
                  <span key={size} className="px-2 py-1 bg-primary-900/30 text-primary-200 rounded text-xs flex items-center gap-1 border border-primary-800">
                    {size}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) })}
                      className="hover:text-white"
                    >
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 my-4"></div>

          {/* Colors */}
          <div>
            <label className="admin-label mb-2 block">Colors</label>
            <div className="flex gap-2 mb-4 items-end">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Color Name (e.g. Midnight Blue)</label>
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="admin-input"
                  placeholder="Color Name"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Color Code (Hex/Class)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-10 p-1 rounded bg-transparent border border-gray-600 cursor-pointer"
                    onChange={(e) => setNewColor({ ...newColor, class: e.target.value })}
                    title="Pick a color"
                  />
                  <input
                    type="text"
                    value={newColor.class}
                    onChange={(e) => setNewColor({ ...newColor, class: e.target.value })}
                    className="admin-input flex-1"
                    placeholder="#000000 or bg-blue-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newColor.name && newColor.class) {
                    setFormData({
                      ...formData,
                      colors: [...(formData.colors || []), { ...newColor }]
                    });
                    setNewColor({ name: '', class: '' });
                  }
                }}
                disabled={!newColor.name || !newColor.class}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed h-10"
              >
                Add Color
              </button>
            </div>

            {(formData.colors || []).length > 0 ? (
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {(formData.colors || []).map((color, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded border border-gray-700 bg-black/20">
                    <div
                      className="w-8 h-8 rounded-full border border-gray-500 shadow-sm"
                      style={{ backgroundColor: color.class.startsWith('#') ? color.class : undefined }}
                    >
                      {/* If it's a tailwind class, we can't easily preview it inline style without compiling, 
                           so we blindly apply it if it doesn't look like hex. 
                           But for Admin simple color picker, we prefer Hex. 
                        */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{color.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{color.class}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newColors = [...formData.colors];
                        newColors.splice(idx, 1);
                        setFormData({ ...formData, colors: newColors });
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No colors added.</p>
            )}
          </div>

        </div>

        <div>
          <label htmlFor="image" className="admin-label">Main Image *</label>
          <div className="space-y-3">
            {/* File Upload */}
            <div>
              <label
                htmlFor="image-upload"
                className="admin-button-secondary inline-flex items-center cursor-pointer"
              >
                <FiUpload className="mr-2" />
                {uploadingMainImage ? 'Uploading...' : 'Upload from Computer'}
              </label>
              <input
                type="file"
                id="image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleMainImageUpload(files);
                  }
                  // Reset input value to allow re-selecting same files
                  e.target.value = '';
                }}
                className="hidden"
                disabled={uploadingMainImage}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {isEditing
                  ? 'Upload multiple images (max 10, 5MB each). First image will be set as main image. Or enter a URL below.'
                  : 'Upload multiple images (max 10, 5MB each). First image will be set as main image. Or enter a URL below (Max 5MB, JPEG/PNG/WebP)'}
              </p>
              {mainImageFiles.length > 1 && !isEditing && (
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--primary-600)' }}>
                  ✓ {mainImageFiles.length} image(s) ready to upload
                </p>
              )}
            </div>

            {/* URL Input */}
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={(e) => {
                setFormData({ ...formData, image: e.target.value });
                setMainImagePreview(e.target.value);
                setMainImageFile(null);
                // Re-enable required if URL is cleared
                if (e.target.value) {
                  e.target.setCustomValidity('');
                }
              }}
              required={!mainImageFile && mainImageFiles.length === 0}
              onInvalid={(e) => {
                // Custom validation message
                if (!mainImageFile && mainImageFiles.length === 0 && !e.target.value) {
                  e.target.setCustomValidity('Please provide an image URL or upload an image file');
                }
              }}
              className="admin-input"
              placeholder="https://example.com/image.jpg"
            />

            {/* Preview */}
            {(mainImagePreview || formData.image) && (
              <div className="mt-2">
                <img
                  src={mainImagePreview || formData.image}
                  alt="Preview"
                  className="h-32 w-32 object-contain rounded-lg"
                  style={{ borderColor: 'var(--border-color)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {mainImageFile && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Main Image: {mainImageFile.name}
                  </p>
                )}
                {mainImageFiles.length > 1 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      Selected Images ({mainImageFiles.length}):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {mainImageFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-16 h-16 object-contain rounded"
                            style={{ borderColor: 'var(--border-color)' }}
                          />
                          {index === 0 && (
                            <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      All {mainImageFiles.length} images will be uploaded
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isActive" className="admin-label mb-0 ml-2">
            Product is active
          </label>
        </div>


        {/* Variants (only when editing) */}
        {isEditing && (
          <div className="admin-card space-y-6">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Product Variants</h2>

            {/* Add Variant Form */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <input
                type="text"
                placeholder="Size"
                value={newVariant.size}
                onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                className="admin-input"
              />
              <input
                type="text"
                placeholder="Color"
                value={newVariant.color}
                onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                className="admin-input"
              />
              <input
                type="number"
                placeholder="Stock"
                value={newVariant.stock}
                onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                min="0"
                className="admin-input"
              />
              <input
                type="text"
                placeholder="SKU"
                value={newVariant.sku}
                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                className="admin-input"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="admin-button-primary flex items-center justify-center"
                disabled={variantMutation.isPending}
              >
                <FiPlus className="mr-2" />
                Add
              </button>
            </div>

            {/* Variants List */}
            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div
                    key={variant._id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center space-x-4">
                      <span style={{ color: 'var(--text-primary)' }}>{variant.size || 'N/A'}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{variant.color || 'N/A'}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Stock: {variant.stock}</span>
                      {variant.sku && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>SKU: {variant.sku}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteVariant(variant._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Images - Show for both new and existing products */}
        <div className="admin-card space-y-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Product Images
            {!isEditing && mainImageFiles.length > 0 && (
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                ({mainImageFiles.length} ready to upload)
              </span>
            )}
          </h2>

          {!isEditing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                💡 <strong>Note:</strong> Upload images here. All images will be saved when you create the product.
                The first image will be set as the main product image.
              </p>
            </div>
          )}

          <div>
            <label className="admin-label">Upload Images</label>
            <div className="mt-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="admin-input"
                disabled={imageUploadMutation.isPending}
              />
              <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                You can upload multiple images (max 10, 5MB each)
              </p>
            </div>
          </div>

          {/* Pending Upload Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Uploading {imagePreviews.length} image(s)...
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview) => (
                  <div key={preview.id} className="relative group">
                    <img
                      src={preview.url}
                      alt={preview.name || 'Preview'}
                      className="w-full h-32 object-cover rounded-lg border opacity-75"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-yellow-600 text-white rounded">
                      Uploading...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show selected images for new products */}
          {!isEditing && mainImageFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Selected Images ({mainImageFiles.length}):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mainImageFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg border"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-primary-600 text-white rounded">
                        Main
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const newFiles = mainImageFiles.filter((_, i) => i !== index);
                        setMainImageFiles(newFiles);
                        if (index === 0 && newFiles.length > 0) {
                          // If removing main image, set new first as main
                          setMainImageFile(newFiles[0]);
                          setMainImagePreview(URL.createObjectURL(newFiles[0]));
                        } else if (newFiles.length === 0) {
                          setMainImageFile(null);
                          setMainImagePreview(null);
                        }
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove this image"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                ✓ All {mainImageFiles.length} image(s) will be uploaded when you save the product
              </p>
            </div>
          )}

          {/* Uploaded Images (for existing products) */}
          {isEditing && images.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Uploaded Images ({images.length}):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image._id} className="relative group">
                    <img
                      src={image.url.startsWith('http') ? image.url : `http://localhost:5000${image.url}`}
                      alt={image.altText || 'Product image'}
                      className="w-full h-32 object-cover rounded-lg border"
                      style={{ borderColor: 'var(--border-color)' }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found';
                      }}
                    />
                    {image.isMain && (
                      <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-primary-600 text-white rounded">
                        Main
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteImage(image._id)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete this image"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload section - show for editing or if no images selected */}
          {(isEditing || (!isEditing && mainImageFiles.length === 0)) && (
            <div>
              <label className="admin-label">Upload Images</label>
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={isEditing ? handleImageUpload : handleMainImageUpload}
                  className="admin-input"
                  disabled={imageUploadMutation.isPending || uploadingMainImage}
                />
                <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  You can upload multiple images (max 10, 5MB each). {!isEditing && 'First image will be set as main image.'}
                </p>
              </div>
            </div>
          )}

          {/* Pending Upload Previews (only when editing) */}
          {isEditing && imagePreviews.length > 0 && (
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Uploading {imagePreviews.length} image(s)...
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview) => (
                  <div key={preview.id} className="relative group">
                    <img
                      src={preview.url}
                      alt={preview.name || 'Preview'}
                      className="w-full h-32 object-cover rounded-lg border opacity-75"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-yellow-600 text-white rounded">
                      Uploading...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {images.length === 0 && mainImageFiles.length === 0 && imagePreviews.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
              <p>No images selected yet. Select images above to upload.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <Link to="/admin/products">
            <button type="button" className="admin-button-secondary">
              Cancel
            </button>
          </Link>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={mutation.isPending}
            className="admin-button-primary flex items-center"
          >
            <FiSave className="mr-2" />
            {mutation.isPending
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Product'
                : 'Create Product'}
          </motion.button>
        </div>
      </form>
    </motion.div >
  );
}
