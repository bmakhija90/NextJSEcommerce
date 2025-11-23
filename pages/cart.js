import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Delete, Add, Remove, ShoppingBag } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [shippingConfig, setShippingConfig] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCart();
    fetchShippingConfig();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setFetching(false);
    }
  };

  const fetchShippingConfig = async () => {
    try {
      const response = await fetch('/api/shipping/config');
      if (response.ok) {
        const config = await response.json();
        setShippingConfig(config);
      }
    } catch (error) {
      console.error('Error fetching shipping config:', error);
    }
  };

  // Helper function to get product image URL
  const getProductImage = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return '/placeholder-image.jpg';
    }

    // Handle both string and object formats
    if (typeof product.images[0] === 'string') {
      return product.images[0];
    }

    // Find primary image or use first image
    const primaryImage = product.images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      return primaryImage.url;
    }

    return product.images[0]?.url || '/placeholder-image.jpg';
  };

  const calculateShipping = () => {
    if (!shippingConfig || !cart) {
      return {
        standard: 0,
        express: 0,
        freeThreshold: 50,
      };
    }

    const subtotal = Number(cart.total) || 0;
    const isFreeShipping = subtotal >= shippingConfig.freeShippingThreshold;

    return {
      standard: isFreeShipping ? 0 : (Number(shippingConfig.standardShippingCost) || 0),
      express: isFreeShipping ? 0 : (Number(shippingConfig.expressShippingCost) || 0),
      freeThreshold: Number(shippingConfig.freeShippingThreshold) || 50,
      isFreeEligible: isFreeShipping,
    };
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          productId, 
          quantity: Number(newQuantity) 
        }),
      });

      if (response.ok) {
        fetchCart();
        toast.success('Cart updated');
      }
    } catch (error) {
      toast.error('Error updating cart');
    }
  };

  const removeItem = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        fetchCart();
        toast.success('Item removed from cart');
      }
    } catch (error) {
      toast.error('Error removing item');
    }
  };

  const proceedToCheckout = () => {
    const shippingCost = calculateShipping()[selectedShipping];
    const cartTotal = Number(cart.total) || 0;
    const totalWithShipping = cartTotal + shippingCost;
    
    const orderData = {
      cart,
      shippingMethod: selectedShipping,
      shippingCost,
      totalWithShipping,
    };
    localStorage.setItem('checkoutData', JSON.stringify(orderData));
    router.push('/checkout');
  };

  const shipping = calculateShipping();
  const shippingCost = shipping[selectedShipping];
  const cartTotal = Number(cart?.total) || 0;
  const totalWithShipping = cartTotal + shippingCost;

  if (fetching) {
    return (
      <Layout>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  if (!cart) {
    return (
      <Layout>
        <Container>
          <Typography>Loading...</Typography>
        </Container>
      </Layout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <ShoppingBag sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Add some products to your cart to continue shopping
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
          Shopping Cart
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {cart.items.map((item) => {
              const itemQuantity = Number(item.quantity) || 1;
              const itemPrice = Number(item.product.price) || 0;
              const itemTotal = itemPrice * itemQuantity;

              return (
                <Card key={item.product._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3}>
                        <Box
                          component="img"
                          src={getProductImage(item.product)}
                          alt={item.product.name}
                          sx={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={3}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {item.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          £{itemPrice.toFixed(2)}
                        </Typography>
                      </Grid>

                      <Grid item xs={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.product._id, itemQuantity - 1)}
                            disabled={itemQuantity <= 1}
                          >
                            <Remove />
                          </IconButton>
                          <TextField
                            value={itemQuantity}
                            size="small"
                            sx={{ width: 60 }}
                            inputProps={{ 
                              style: { textAlign: 'center' },
                              min: 1,
                              max: item.product.stock
                            }}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              if (newQuantity >= 1 && newQuantity <= item.product.stock) {
                                updateQuantity(item.product._id, newQuantity);
                              }
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.product._id, itemQuantity + 1)}
                            disabled={itemQuantity >= item.product.stock}
                          >
                            <Add />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Max: {item.product.stock}
                        </Typography>
                      </Grid>

                      <Grid item xs={2}>
                        <Typography variant="h6">
                          £{itemTotal.toFixed(2)}
                        </Typography>
                      </Grid>

                      <Grid item xs={1}>
                        <IconButton
                          color="error"
                          onClick={() => removeItem(item.product._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>£{cartTotal.toFixed(2)}</Typography>
                </Box>

                {/* Shipping Options */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Shipping Method
                  </Typography>
                  
                  {shipping.isFreeEligible && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      You qualify for free shipping!
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box
                      sx={{
                        p: 2,
                        border: selectedShipping === 'standard' ? 2 : 1,
                        borderColor: selectedShipping === 'standard' ? 'primary.main' : 'grey.300',
                        borderRadius: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedShipping === 'standard' ? 'action.selected' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => setSelectedShipping('standard')}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            Standard Shipping
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            3-5 business days
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {shipping.standard === 0 ? 'Free' : `£${shipping.standard.toFixed(2)}`}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        border: selectedShipping === 'express' ? 2 : 1,
                        borderColor: selectedShipping === 'express' ? 'primary.main' : 'grey.300',
                        borderRadius: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedShipping === 'express' ? 'action.selected' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => setSelectedShipping('express')}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            Express Shipping
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            1-2 business days
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {shipping.express === 0 ? 'Free' : `£${shipping.express.toFixed(2)}`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {!shipping.isFreeEligible && cartTotal > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Add £{(shipping.freeThreshold - cartTotal).toFixed(2)} more for free shipping
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Shipping:</Typography>
                  <Typography>
                    {shippingCost === 0 ? 'Free' : `£${shippingCost.toFixed(2)}`}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">£{totalWithShipping.toFixed(2)}</Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={proceedToCheckout}
                  disabled={loading}
                >
                  Proceed to Checkout
                </Button>

                {shipping.isFreeEligible && (
                  <Typography variant="body2" color="success.main" sx={{ mt: 1, textAlign: 'center' }}>
                    🎉 Free shipping applied!
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Continue Shopping Button */}
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => router.push('/products')}
            >
              Continue Shopping
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}