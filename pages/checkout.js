import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddress, setNewAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
  });
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCart();
    fetchAddresses();
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
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const addressesData = await response.json();
        setAddresses(addressesData);
        if (addressesData.length > 0) {
          const defaultAddress = addressesData.find(addr => addr.isDefault) || addressesData[0];
          setSelectedAddress(defaultAddress._id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let shippingAddress;

      if (useNewAddress) {
        // Validate new address
        if (!newAddress.name || !newAddress.line1 || !newAddress.city || !newAddress.postcode) {
          toast.error('Please fill in all required address fields');
          return;
        }
        shippingAddress = newAddress;
      } else {
        const address = addresses.find(addr => addr._id === selectedAddress);
        if (!address) {
          toast.error('Please select a shipping address');
          return;
        }
        shippingAddress = address;
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress,
          useNewAddress,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        toast.success('Order placed successfully!');
        router.push(`/order-confirmation/${order._id}`);
      } else {
        toast.error('Failed to place order');
      }
    } catch (error) {
      toast.error('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <Container>
          <Typography>Your cart is empty</Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Checkout
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Shipping Address
                </Typography>

                {addresses.length > 0 && (
                  <>
                    <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
                      <FormLabel component="legend">Select Saved Address</FormLabel>
                      <RadioGroup
                        value={useNewAddress ? 'new' : selectedAddress}
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            setUseNewAddress(true);
                          } else {
                            setUseNewAddress(false);
                            setSelectedAddress(e.target.value);
                          }
                        }}
                      >
                        {addresses.map((address) => (
                          <FormControlLabel
                            key={address._id}
                            value={address._id}
                            control={<Radio />}
                            label={
                              <Box>
                                <Typography variant="body1">{address.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {address.line1}, {address.city}, {address.postcode}
                                </Typography>
                              </Box>
                            }
                          />
                        ))}
                        <FormControlLabel
                          value="new"
                          control={<Radio />}
                          label="Use new address"
                        />
                      </RadioGroup>
                    </FormControl>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                {(useNewAddress || addresses.length === 0) && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Address Name (e.g., Home, Work)"
                        fullWidth
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Address Line 1"
                        fullWidth
                        required
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Address Line 2"
                        fullWidth
                        value={newAddress.line2}
                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="City"
                        fullWidth
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="County"
                        fullWidth
                        value={newAddress.county}
                        onChange={(e) => setNewAddress({ ...newAddress, county: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Postcode"
                        fullWidth
                        required
                        value={newAddress.postcode}
                        onChange={(e) => setNewAddress({ ...newAddress, postcode: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Country"
                        fullWidth
                        value={newAddress.country}
                        disabled
                      />
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Method
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  We use Stripe for secure payments. You'll be redirected to Stripe to complete your payment.
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Accepted payment methods: Visa, MasterCard, American Express
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>

                {cart.items.map((item) => (
                  <Box key={item.product._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {item.product.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                      £{(item.product.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>£{cart.total.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Shipping:</Typography>
                  <Typography>£0.00</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">£{cart.total.toFixed(2)}</Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}