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
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
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

  if (!user) {
    return (
      <Layout>
        <Container>
          <Typography>Loading...</Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Personal Info" />
            <Tab label="Addresses" />
            <Tab label="Order History" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {user.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {user.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1">
                    {user.role}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body1">
                    {new Date(user.createdAt).toLocaleDateString('en-GB')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Saved Addresses
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddAddress}
            >
              Add New Address
            </Button>
          </Box>

          <Grid container spacing={2}>
            {user.addresses.map((address) => (
              <Grid item xs={12} md={6} key={address._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">
                        {address.name}
                        {address.isDefault && (
                          <Chip label="Default" color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditAddress(address)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAddress(address._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2">
                      {address.line1}
                      {address.line2 && <>, {address.line2}</>}
                    </Typography>
                    <Typography variant="body2">
                      {address.city}, {address.county}
                    </Typography>
                    <Typography variant="body2">
                      {address.postcode}
                    </Typography>
                    <Typography variant="body2">
                      {address.country}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {user.addresses.length === 0 && (
            <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
              No addresses saved yet.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Order History
          </Typography>
          
          {orders.length === 0 ? (
            <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
              No orders yet.
            </Typography>
          ) : (
            <List>
              {orders.map((order) => (
                <ListItem key={order._id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </Typography>
                        <Chip 
                          label={order.status} 
                          color={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'cancelled' ? 'error' : 'primary'
                          }
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">
                          Placed on: {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </Typography>
                        <Typography variant="body2">
                          Total: £{order.total.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Container>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
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
        <DialogActions>
          <Button onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAddress} variant="contained">
            {editingAddress ? 'Update' : 'Save'} Address
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}