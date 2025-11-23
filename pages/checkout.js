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
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

const steps = ['Shipping Address', 'Payment', 'Confirmation'];

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
  const [activeStep, setActiveStep] = useState(0);
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
        } else {
          // If no addresses, automatically show new address form
          setUseNewAddress(true);
        }
      } else {
        // If API fails or no addresses, show new address form
        setUseNewAddress(true);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setUseNewAddress(true);
    }
  };

  const validateAddress = (address) => {
    const requiredFields = ['name', 'line1', 'city', 'postcode'];
    for (const field of requiredFields) {
      if (!address[field]?.trim()) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let shippingAddress;

      if (useNewAddress) {
        // Validate new address
        const validationError = validateAddress(newAddress);
        if (validationError) {
          toast.error(validationError);
          setLoading(false);
          return;
        }
        shippingAddress = newAddress;
      } else {
        const address = addresses.find(addr => addr._id === selectedAddress);
        if (!address) {
          toast.error('Please select a shipping address');
          setLoading(false);
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
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) {
    return (
      <Layout>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading...</Typography>
        </Container>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Add some items to your cart before checking out
          </Typography>
          <Button variant="contained" onClick={() => router.push('/products')}>
            Continue Shopping
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Progress Stepper */}
        <Box sx={{ mb: 6 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Checkout
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Shipping & Payment */}
          <Grid item xs={12} lg={8}>
            {/* Shipping Address Card */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Shipping Address
                </Typography>

                {addresses.length > 0 ? (
                  <>
                    <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
                      <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                        Select Saved Address
                      </FormLabel>
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
                          <Paper
                            key={address._id}
                            sx={{
                              p: 2,
                              mb: 2,
                              border: selectedAddress === address._id && !useNewAddress ? 2 : 1,
                              borderColor: selectedAddress === address._id && !useNewAddress ? 'primary.main' : 'grey.300',
                              borderRadius: 2,
                              backgroundColor: selectedAddress === address._id && !useNewAddress ? 'action.selected' : 'background.paper',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                            onClick={() => {
                              setUseNewAddress(false);
                              setSelectedAddress(address._id);
                            }}
                          >
                            <FormControlLabel
                              value={address._id}
                              control={<Radio />}
                              label={
                                <Box sx={{ ml: 1 }}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {address.name}
                                    {address.isDefault && (
                                      <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
                                        (Default)
                                      </Typography>
                                    )}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {address.line1}
                                    {address.line2 && `, ${address.line2}`}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {address.city}, {address.county} {address.postcode}
                                  </Typography>
                                </Box>
                              }
                              sx={{ width: '100%', m: 0 }}
                            />
                          </Paper>
                        ))}
                        
                        <Paper
                          sx={{
                            p: 2,
                            border: useNewAddress ? 2 : 1,
                            borderColor: useNewAddress ? 'primary.main' : 'grey.300',
                            borderRadius: 2,
                            backgroundColor: useNewAddress ? 'action.selected' : 'background.paper',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                          onClick={() => setUseNewAddress(true)}
                        >
                          <FormControlLabel
                            value="new"
                            control={<Radio />}
                            label={
                              <Typography variant="body1" fontWeight="medium" sx={{ ml: 1 }}>
                                Use new address
                              </Typography>
                            }
                            sx={{ width: '100%', m: 0 }}
                          />
                        </Paper>
                      </RadioGroup>
                    </FormControl>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No saved addresses found. Please add a new shipping address.
                  </Alert>
                )}

                {(useNewAddress || addresses.length === 0) && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {addresses.length > 0 ? 'New Address' : 'Shipping Address'}
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          label="Address Name (e.g., Home, Work)"
                          fullWidth
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                          placeholder="Enter a name for this address"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Address Line 1 *"
                          fullWidth
                          required
                          value={newAddress.line1}
                          onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                          placeholder="Street address, P.O. box, company name"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Address Line 2"
                          fullWidth
                          value={newAddress.line2}
                          onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                          placeholder="Apartment, suite, unit, building, floor, etc."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="City *"
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
                          label="Postcode *"
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
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Payment Method
                </Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  We use Stripe for secure payments. You'll be redirected to Stripe to complete your payment.
                </Alert>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Accepted payment methods:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight="medium">Visa</Typography>
                    <Typography variant="body2" fontWeight="medium">MasterCard</Typography>
                    <Typography variant="body2" fontWeight="medium">American Express</Typography>
                    <Typography variant="body2" fontWeight="medium">Stripe</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Order Summary */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ position: 'sticky', top: 100, borderRadius: 2, boxShadow: 3 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Order Summary
                  </Typography>
                </Box>

                <Box sx={{ p: 3, maxHeight: '300px', overflow: 'auto' }}>
                  {cart.items.map((item) => (
                    <Box key={item.product._id} sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body1" fontWeight="medium" sx={{ lineHeight: 1.3 }}>
                          {item.product.name}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          £{(item.product.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Qty: {item.quantity}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          £{item.product.price.toFixed(2)} each
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Divider />

                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      £{cart.total.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1">Shipping:</Typography>
                    <Typography variant="body1" fontWeight="medium" color="success.main">
                      Free
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1">Tax:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      £{(cart.total * 0.2).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Total:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      £{(cart.total * 1.2).toFixed(2)}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: 2,
                    }}
                  >
                    {loading ? 'Processing...' : `Place Order • £${(cart.total * 1.2).toFixed(2)}`}
                  </Button>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                    By placing your order, you agree to our Terms of Service and Privacy Policy
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Continue Shopping Button */}
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2, py: 1.5, borderRadius: 2 }}
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