import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import { Favorite, ShoppingCart, Delete } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        // Fetch product details for wishlist items
        const productsResponse = await fetch('/api/products');
        const allProducts = await productsResponse.json();
        
        const wishlistProducts = allProducts.filter(product => 
          user.wishlist.includes(product._id)
        );
        
        setWishlist(wishlistProducts);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        setWishlist(wishlist.filter(item => item._id !== productId));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Error removing from wishlist');
    }
  };

  const addToCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        toast.success('Product added to cart!');
      }
    } catch (error) {
      toast.error('Error adding to cart');
    }
  };

  if (wishlist.length === 0) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Favorite sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your wishlist is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Add some products to your wishlist to save them for later
          </Typography>
          <Button variant="contained" onClick={() => router.push('/')}>
            Continue Shopping
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Wishlist
        </Typography>

        <Grid container spacing={3}>
          {wishlist.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box
                  component="img"
                  src={product.images[0] || '/placeholder-image.jpg'}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(`/product/${product._id}`)}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description.substring(0, 100)}...
                  </Typography>
                  <Typography variant="h6" color="primary">
                    £{product.price}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCart />}
                    onClick={() => addToCart(product._id)}
                    sx={{ flexGrow: 1 }}
                  >
                    Add to Cart
                  </Button>
                  <IconButton
                    color="error"
                    onClick={() => removeFromWishlist(product._id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Layout>
  );
}