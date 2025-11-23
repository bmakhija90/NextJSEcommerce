import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  IconButton,
  CardActionArea,
} from '@mui/material';
import { Favorite, FavoriteBorder, ShoppingCart } from '@mui/icons-material';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkWishlistStatus();
  }, [product._id]);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/wishlist/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsWishlisted(data.isInWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const getImageUrl = () => {
    // Handle different image structures
    if (imageError) {
      return '/placeholder-image.jpg';
    }

    if (!product.images || product.images.length === 0) {
      return '/placeholder-image.jpg';
    }

    // Handle both old string array and new object array formats
    if (typeof product.images[0] === 'string') {
      return product.images[0];
    }

    // Find primary image or use first image
    const primaryImage = product.images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      return primaryImage.url;
    }

    // Use first image if no primary found
    if (product.images[0] && product.images[0].url) {
      return product.images[0].url;
    }

    return '/placeholder-image.jpg';
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
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
          productId: product._id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        toast.success('Product added to cart!');
      } else {
        toast.error('Failed to add product to cart');
      }
    } catch (error) {
      toast.error('Error adding product to cart');
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
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
        body: JSON.stringify({ productId: product._id }),
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

  return (
    <Card
      sx={{
        maxWidth: 345,
        transition: 'all 0.3s ease-in-out',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
        boxShadow: isHovered ? 8 : 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardActionArea onClick={() => router.push(`/product/${product._id}`)}>
        <CardMedia
          component="img"
          height="200"
          image={getImageUrl()}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
          onError={() => setImageError(true)}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="h2" noWrap>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
            {product.description?.substring(0, 100)}...
          </Typography>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            £{product.price}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Typography>
        </CardContent>
      </CardActionArea>
      
      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          fullWidth
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <IconButton 
          onClick={handleWishlist} 
          color={isWishlisted ? 'error' : 'default'}
          disabled={!localStorage.getItem('token')}
        >
          {isWishlisted ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
      </Box>
    </Card>
  );
}