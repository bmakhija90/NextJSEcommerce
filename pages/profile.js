import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Avatar,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Edit, Delete, Add, ShoppingBag, LocalShipping, CheckCircle, Person } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const orderSteps = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];

function OrderTimeline({ order }) {
  const getActiveStep = (status) => {
    const statusMap = {
      'pending': 0,
      'confirmed': 1,
      'processing': 1,
      'shipped': 2,
      'delivered': 3,
      'cancelled': -1
    };
    return statusMap[status] || 0;
  };

  const activeStep = getActiveStep(order.status);

  if (order.status === 'cancelled') {
    return (
      <Box sx={{ mt: 2 }}>
        <Chip 
          label="Cancelled" 
          color="error" 
          variant="filled"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ minHeight: '120px' }}>
        {orderSteps.map((step, index) => (
          <Step key={step} completed={index <= activeStep}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: '0.875rem',
                  fontWeight: index <= activeStep ? 'bold' : 'normal',
                }
              }}
            >
              {step}
            </StepLabel>
            {index === activeStep && order.updatedAt && (
              <StepContent>
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(order.updatedAt).toLocaleDateString('en-GB')}
                </Typography>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'info',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <ShoppingBag />,
      'processing': <ShoppingBag />,
      'shipped': <LocalShipping />,
      'delivered': <CheckCircle />,
      'cancelled': <Delete />
    };
    return icons[status] || <ShoppingBag />;
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2, '&:last-child': { mb: 0 } }}>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Badge
                color={getStatusColor(order.status)}
                badgeContent={getStatusIcon(order.status)}
                sx={{ mr: 2 }}
              >
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <ShoppingBag />
                </Avatar>
              </Badge>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Order #{order._id.slice(-8).toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip 
                    label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                    color={getStatusColor(order.status)}
                    variant="filled"
                    size="small"
                  />
                  <Chip 
                    label={`${order.items.reduce((sum, item) => sum + item.quantity, 0)} items`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip 
                    label={`£${order.total.toFixed(2)}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {!expanded && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {order.items.slice(0, 2).map((item, index) => (
                      <Chip
                        key={index}
                        label={`${item.product.name} × ${item.quantity}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {order.items.length > 2 && (
                      <Chip
                        label={`+${order.items.length - 2} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <OrderTimeline order={order} />
          </Grid>
        </Grid>

        {expanded && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Order Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" gutterBottom>
                      Shipping Address
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {order.shippingAddress?.name}<br />
                      {order.shippingAddress?.line1}<br />
                      {order.shippingAddress?.line2 && <>{order.shippingAddress.line2}<br /></>}
                      {order.shippingAddress?.city}, {order.shippingAddress?.county}<br />
                      {order.shippingAddress?.postcode}<br />
                      {order.shippingAddress?.country}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" gutterBottom>
                      Order Items
                    </Typography>
                    <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                      {order.items.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, pb: 1, borderBottom: index < order.items.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Qty: {item.quantity}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            £{(item.product.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        Total
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        £{order.total.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ borderRadius: 2 }}
          >
            {expanded ? 'Show Less' : 'View Full Details'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    isDefault: false,
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
    fetchOrders();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: '',
      line1: '',
      line2: '',
      city: '',
      county: '',
      postcode: '',
      country: 'United Kingdom',
      isDefault: false,
    });
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      county: address.county || '',
      postcode: address.postcode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingAddress 
        ? `/api/user/addresses/${editingAddress._id}`
        : '/api/user/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        toast.success(editingAddress ? 'Address updated' : 'Address added');
        setAddressDialogOpen(false);
        fetchUserProfile();
      }
    } catch (error) {
      toast.error('Error saving address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Address deleted');
        fetchUserProfile();
      }
    } catch (error) {
      toast.error('Error deleting address');
    }
  };

  const getUserInitials = (user) => {
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  if (!user) {
    return (
      <Layout>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading...</Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          My Profile
        </Typography>

        {/* Identity Card - Personal Info */}
        {tabValue === 0 && (
          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '4px solid rgba(255,255,255,0.3)',
                      fontSize: '2.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getUserInitials(user)}
                  </Avatar>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {user.name}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                    {user.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Member Since
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {new Date(user.createdAt).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Total Orders
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {orders.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Saved Addresses
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.addresses?.length || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Paper sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  py: 2.5,
                  minHeight: '64px',
                  px: 3,
                }
              }}
            >
              <Tab icon={<Person sx={{ mr: 1 }} />} iconPosition="start" label="Personal Info" />
              <Tab icon={<Add sx={{ mr: 1 }} />} iconPosition="start" label="Addresses" />
              <Tab icon={<ShoppingBag sx={{ mr: 1 }} />} iconPosition="start" label="Order History" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
                      Contact Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Full Name
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          {user.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Email Address
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
                      Account Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Member Since
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          {new Date(user.createdAt).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Account Status
                        </Typography>
                        <Chip label="Active" color="success" size="medium" sx={{ fontWeight: 'bold' }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              {/* Sticky Header */}
              <Box sx={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                bgcolor: 'background.paper', 
                pb: 3,
                mb: 3,
                borderBottom: 1,
                borderColor: 'divider'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" fontWeight="bold">
                    Saved Addresses
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddAddress}
                    sx={{ borderRadius: 2 }}
                    size={isMobile ? "medium" : "large"}
                  >
                    Add New Address
                  </Button>
                </Box>
              </Box>

              {/* Address Grid */}
              <Grid container spacing={3}>
                {user.addresses?.map((address) => (
                  <Grid item xs={12} md={6} lg={4} key={address._id}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: 3, 
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      }
                    }}>
                      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                            {address.name}
                            {address.isDefault && (
                              <Chip 
                                label="Default" 
                                color="primary" 
                                size="small" 
                                sx={{ ml: 1, fontWeight: 'bold' }} 
                              />
                            )}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditAddress(address)}
                              color="primary"
                              sx={{ bgcolor: 'action.hover' }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAddress(address._id)}
                              sx={{ bgcolor: 'action.hover' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1, lineHeight: 1.6 }}>
                          <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {address.line1}
                          </Typography>
                          {address.line2 && (
                            <Typography variant="body1" fontWeight="medium" gutterBottom>
                              {address.line2}
                            </Typography>
                          )}
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            {address.city}, {address.county}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            {address.postcode}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {address.country}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {(!user.addresses || user.addresses.length === 0) && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Box sx={{ mb: 3 }}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.300', mx: 'auto', mb: 2 }}>
                      <Add sx={{ fontSize: 40, color: 'grey.600' }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No addresses saved yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Add your first address to make checkout faster
                    </Typography>
                  </Box>
                  <Button variant="contained" size="large" onClick={handleAddAddress}>
                    Add Your First Address
                  </Button>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              {/* Sticky Header */}
              <Box sx={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                bgcolor: 'background.paper', 
                pb: 3,
                mb: 3,
                borderBottom: 1,
                borderColor: 'divider'
              }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Order History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} found
                </Typography>
              </Box>
              
              {orders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ShoppingBag sx={{ fontSize: 80, color: 'grey.300', mb: 3 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No orders yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Start shopping to see your order history here
                  </Typography>
                  <Button variant="contained" size="large" onClick={() => router.push('/products')}>
                    Start Shopping
                  </Button>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto', pr: 1 }}>
                  {orders.map((order) => (
                    <OrderCard key={order._id} order={order} />
                  ))}
                </Box>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 2 }}>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Address Name"
                fullWidth
                value={addressForm.name}
                onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                placeholder="Home, Work, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address Line 1"
                fullWidth
                required
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address Line 2"
                fullWidth
                value={addressForm.line2}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="County"
                fullWidth
                value={addressForm.county}
                onChange={(e) => setAddressForm({ ...addressForm, county: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Postcode"
                fullWidth
                required
                value={addressForm.postcode}
                onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                fullWidth
                value={addressForm.country}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  />
                }
                label="Set as default address"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setAddressDialogOpen(false)} size="large">
            Cancel
          </Button>
          <Button onClick={handleSaveAddress} variant="contained" size="large">
            {editingAddress ? 'Update' : 'Save'} Address
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}