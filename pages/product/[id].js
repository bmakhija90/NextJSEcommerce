import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Divider,
  TextField,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  ShoppingCart,
  ArrowBack,
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
      checkWishlist();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const checkWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/wishlist/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsWishlisted(data.isInWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const getProductImages = () => {
    if (!product || !product.images) return [];

    // Handle both old string array and new object array formats
    if (product.images.length > 0 && typeof product.images[0] === 'string') {
      return product.images.map((url, index) => ({
        url,
        alt: product.name,
        isPrimary: index === 0,
      }));
    }

    return product.images;
  };

  const getMainImageUrl = () => {
    const images = getProductImages();
    if (images.length === 0) return '/placeholder-image.jpg';

    // Use the selected image index
    if (images[selectedImageIndex] && images[selectedImageIndex].url) {
      return images[selectedImageIndex].url;
    }

    // Fallback to primary image or first image
    const primaryImage = images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      return primaryImage.url;
    }

    return images[0].url || '/placeholder-image.jpg';
  };

  const handleImageThumbnailClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: id,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        toast.success('Product added to cart!');
      } else {
        toast.error('Failed to add product to cart');
      }
    } catch (error) {
      toast.error('Error adding product to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsWishlisted(data.isInWishlist);
        toast.success(data.isInWishlist ? 'Added to wishlist!' : 'Removed from wishlist');
      }
    } catch (error) {
      toast.error('Error updating wishlist');
    }
  };

  if (!product) {
    return (
      <Layout>
        <Container>
          <Typography>Loading...</Typography>
        </Container>
      </Layout>
    );
  }

  const images = getProductImages();

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 3 }}
        >
          Back to Products
        </Button>

        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box
                component="img"
                src={getMainImageUrl()}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  borderRadius: 2,
                }}
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            </Box>

            {images.length > 1 && (
              <ImageList cols={4} gap={8} sx={{ m: 0 }}>
                {images.map((image, index) => (
                  <ImageListItem 
                    key={index}
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedImageIndex === index ? 2 : 1,
                      borderColor: selectedImageIndex === index ? 'primary.main' : 'grey.300',
                      borderRadius: 1,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'scale(1.05)',
                      },
                    }}
                    onClick={() => handleImageThumbnailClick(index)}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: 80,
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Chip label={product.category} color="primary" sx={{ mb: 2 }} />
            
            <Typography variant="h4" component="h1" gutterBottom>
              {product.name}
            </Typography>

            <Typography variant="h3" color="primary" gutterBottom>
              £{product.price}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quantity
              </Typography>
              <TextField
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                inputProps={{ min: 1, max: product.stock }}
                sx={{ width: 100 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {product.stock} items in stock
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                disabled={loading || product.stock === 0}
                sx={{ flexGrow: 1 }}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              <IconButton
                size="large"
                onClick={handleWishlist}
                color={isWishlisted ? 'error' : 'default'}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                {isWishlisted ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}