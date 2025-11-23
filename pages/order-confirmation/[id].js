import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { CheckCircle, ShoppingBag, Home } from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';

export default function OrderConfirmation() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        console.error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <Typography>Loading...</Typography>
        </Container>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <Container>
          <Alert severity="error">Order not found</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Success Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom color="success.main">
            Order Confirmed!
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Thank you for your purchase
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Order ID: #{order._id.slice(-8).toUpperCase()}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Order Summary */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Order Summary
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {item.product?.name || 'Product'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">£{item.price.toFixed(2)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            £{(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="h6">Total:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6">£{order.total.toFixed(2)}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Details */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Status
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography>Payment:</Typography>
                  <Chip 
                    label={order.paymentStatus} 
                    color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>Order:</Typography>
                  <Chip 
                    label={order.status} 
                    color={
                      order.status === 'delivered' ? 'success' :
                      order.status === 'cancelled' ? 'error' : 'primary'
                    }
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Shipping Address
                </Typography>
                <Typography variant="body2">
                  {order.shippingAddress.name}
                </Typography>
                <Typography variant="body2">
                  {order.shippingAddress.line1}
                </Typography>
                {order.shippingAddress.line2 && (
                  <Typography variant="body2">
                    {order.shippingAddress.line2}
                  </Typography>
                )}
                <Typography variant="body2">
                  {order.shippingAddress.city}, {order.shippingAddress.county}
                </Typography>
                <Typography variant="body2">
                  {order.shippingAddress.postcode}
                </Typography>
                <Typography variant="body2">
                  {order.shippingAddress.country}
                </Typography>
              </CardContent>
            </Card>

            {order.trackingInfo && order.trackingInfo.carrier && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tracking Information
                  </Typography>
                  <Typography variant="body2">
                    Carrier: {order.trackingInfo.carrier}
                  </Typography>
                  <Typography variant="body2">
                    Tracking: {order.trackingInfo.trackingNumber}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            variant="contained"
            startIcon={<ShoppingBag />}
            onClick={() => router.push('/profile')}
            sx={{ mr: 2 }}
          >
            View Order History
          </Button>
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => router.push('/')}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    </Layout>
  );
}