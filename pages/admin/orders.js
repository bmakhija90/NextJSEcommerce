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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  TextField as MuiTextField,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Search,
  FilterList,
  ReceiptLong,
  Dashboard,
  Inventory,
  Category,
  LocalShipping,
  BarChart,
  Settings,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';

const drawerWidth = 240;

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: '',
    trackingNumber: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

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

      fetchOrders(token);
    } catch (error) {
      setAccessDenied(true);
      setLoading(false);
      toast.error('Error verifying access');
    }
  };

  const fetchOrders = async (token) => {
    try {
      const response = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        toast.error('Error fetching orders');
      }
    } catch (error) {
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user?.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.user?.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Products', icon: <Inventory />, path: '/admin/products' },
    { text: 'Categories', icon: <Category />, path: '/admin/categories' },
    { text: 'Orders', icon: <ReceiptLong />, path: '/admin/orders' },
    { text: 'Shipping', icon: <LocalShipping />, path: '/admin/shipping' },
    { text: 'Analytics', icon: <BarChart />, path: '/admin/analytics' },
    { text: 'Settings', icon: <Settings />, path: '/admin/settings' },
  ];

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
        fetchOrders(token);
      } else {
        toast.error('Error updating order');
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

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Typography variant="h6" fontWeight="bold">
          Admin Panel
        </Typography>
      </Toolbar>
      <List sx={{ px: 2, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={activeSection === item.text.toLowerCase()}
              onClick={() => {
                setActiveSection(item.text.toLowerCase());
                router.push(item.path);
                if (isMobile) {
                  handleDrawerToggle();
                }
              }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: 'inherit',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
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
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
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
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar Drawer */}
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: 3,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {/* Mobile App Bar */}
          {isMobile && (
            <AppBar position="static" sx={{ mb: 3, borderRadius: 2 }}>
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Orders Management
                </Typography>
              </Toolbar>
            </AppBar>
          )}

          <Container maxWidth="xl" sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Orders Management
              </Typography>
              <Button
                variant="outlined"
                onClick={() => router.push('/admin')}
                sx={{ borderRadius: 2 }}
              >
                Back to Dashboard
              </Button>
            </Box>

            {/* Order Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {orders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3, border: '2px solid', borderColor: 'warning.main' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {getStatusCount('pending')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3, border: '2px solid', borderColor: 'info.main' }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {getStatusCount('processing')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processing
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3, border: '2px solid', borderColor: 'primary.main' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {getStatusCount('shipped')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Shipped
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3, border: '2px solid', borderColor: 'success.main' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {getStatusCount('delivered')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivered
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Filters and Search */}
            <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <MuiTextField
                    placeholder="Search orders by ID, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="shipped">Shipped</MenuItem>
                      <MenuItem value="delivered">Delivered</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  All Orders ({filteredOrders.length})
                </Typography>
                
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell><Typography fontWeight="bold">Order ID</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Customer</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Amount</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Payment</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Actions</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order._id} hover>
                          <TableCell>#{order._id?.slice(-8).toUpperCase() || 'N/A'}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography fontWeight="medium">
                                {order.user?.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {order.user?.email || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                          </TableCell>
                          <TableCell>£{order.total?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status} 
                              color={getStatusColor(order.status)}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={order.paymentStatus} 
                              color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              startIcon={<Edit />}
                              onClick={() => handleUpdateOrder(order)}
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {filteredOrders.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No orders found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'Orders will appear here once customers start placing orders'
                      }
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Container>
        </Box>
      </Box>

      {/* Update Order Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Update Order #{selectedOrder?._id?.slice(-8).toUpperCase()}
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
    </Layout>
  );
}