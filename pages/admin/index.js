import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  People,
  AttachMoney,
  Edit,
  Inventory,
  LocalShipping,
  ReceiptLong,
  Category, // Add this import
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: '',
    trackingNumber: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      setAccessDenied(true);
      setLoading(false);
      toast.error('Admin access required');
      setTimeout(() => {
        router.push('/');
      }, 2000);
      return;
    }

    // Verify token is still valid
    try {
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setAccessDenied(true);
        setLoading(false);
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
        return;
      }

      const userData = await response.json();
      if (userData.role !== 'admin') {
        setAccessDenied(true);
        setLoading(false);
        toast.error('Admin access required');
        setTimeout(() => {
          router.push('/');
        }, 2000);
        return;
      }

      fetchDashboardData(token);
    } catch (error) {
      setAccessDenied(true);
      setLoading(false);
      toast.error('Error verifying access');
    }
  };

  const fetchDashboardData = async (token) => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok && ordersRes.ok) {
        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        setStats(statsData);
        setOrders(ordersData);
      } else {
        toast.error('Error fetching dashboard data');
      }
    } catch (error) {
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = (order) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setTrackingInfo(order.trackingInfo || { carrier: '', trackingNumber: '' });
    setUpdateDialogOpen(true);
  };

  const saveOrderUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          trackingInfo: trackingInfo.carrier ? trackingInfo : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Order updated successfully');
        setUpdateDialogOpen(false);
        fetchDashboardData(token);
      }
    } catch (error) {
      toast.error('Error updating order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const NavigationCard = ({ title, description, icon, onClick, color = 'primary' }) => (
    <Card 
      sx={{ 
        cursor: 'pointer', 
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        height: '100%',
      }} 
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Box sx={{ color: `${color}.main`, mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  if (accessDenied) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Access Denied - Admin privileges required
          </Alert>
          <Button variant="contained" onClick={() => router.push('/')}>
            Return to Homepage
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>

        {/* Quick Navigation Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <NavigationCard
              title="Manage Products"
              description="Add, edit, or remove products"
              icon={<Inventory sx={{ fontSize: 40 }} />}
              onClick={() => router.push('/admin/products')}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <NavigationCard
              title="Categories"
              description="Manage product categories"
              icon={<Category sx={{ fontSize: 40 }} />}
              onClick={() => router.push('/admin/categories')}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <NavigationCard
              title="Shipping Settings"
              description="Configure shipping costs and rules"
              icon={<LocalShipping sx={{ fontSize: 40 }} />}
              onClick={() => router.push('/admin/shipping')}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <NavigationCard
              title="Order Management"
              description="View and process orders"
              icon={<ReceiptLong sx={{ fontSize: 40 }} />}
              onClick={() => window.scrollTo({ top: document.getElementById('orders-section').offsetTop, behavior: 'smooth' })}
              color="success"
            />
          </Grid>
        </Grid>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Weekly Revenue"
              value={`£${stats.weeklyRevenue || 0}`}
              icon={<AttachMoney sx={{ fontSize: 40 }} />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Weekly Orders"
              value={stats.weeklyOrders || 0}
              icon={<ShoppingCart sx={{ fontSize: 40 }} />}
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={<People sx={{ fontSize: 40 }} />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Growth"
              value={`${stats.growth || 0}%`}
              icon={<TrendingUp sx={{ fontSize: 40 }} />}
              color="#f44336"
            />
          </Grid>
        </Grid>

        {/* Recent Orders */}
        <Card id="orders-section">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                Recent Orders
              </Typography>
              <Button
                variant="outlined"
                onClick={() => toast.info('Full orders page coming soon!')}
              >
                View All Orders
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>#{order._id.slice(-8).toUpperCase()}</TableCell>
                      <TableCell>{order.user?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>£{order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          startIcon={<Edit />}
                          onClick={() => handleUpdateOrder(order)}
                          size="small"
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {orders.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No orders yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders will appear here once customers start placing orders
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Update Order Dialog */}
        <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Update Order #{selectedOrder?._id.slice(-8).toUpperCase()}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="h6" gutterBottom>
                Tracking Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Carrier"
                    fullWidth
                    value={trackingInfo.carrier}
                    onChange={(e) => setTrackingInfo({
                      ...trackingInfo,
                      carrier: e.target.value,
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tracking Number"
                    fullWidth
                    value={trackingInfo.trackingNumber}
                    onChange={(e) => setTrackingInfo({
                      ...trackingInfo,
                      trackingNumber: e.target.value,
                    })}
                  />
                </Grid>
              </Grid>

              {status === 'shipped' && !trackingInfo.carrier && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Please provide tracking information when marking as shipped.
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveOrderUpdate} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}