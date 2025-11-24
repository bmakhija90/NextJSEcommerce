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
  Stack
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
  Category,
  Dashboard,
  Menu as MenuIcon,
  ChevronLeft,
  BarChart,
  ShowChart,
  PieChart,
  Settings,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

const drawerWidth = 240;

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [chartData, setChartData] = useState({
    salesData: [],
    revenueData: [],
    categoryData: []
  });
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
      const [statsRes, ordersRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok && ordersRes.ok && analyticsRes.ok) {
        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const analyticsData = await analyticsRes.json();
        
        setStats(statsData);
        setOrders(ordersData);
        setChartData(analyticsData);
      } else {
        toast.error('Error fetching dashboard data');
      }
    } catch (error) {
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
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

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ 
      borderRadius: 3, 
      boxShadow: 3,
      background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
      border: `1px solid ${color}30`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6,
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="h6" fontWeight="medium">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            color, 
            backgroundColor: `${color}20`,
            borderRadius: 3,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
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
          transform: 'translateY(-8px)',
          boxShadow: 6,
        },
        height: '100%',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette[color].main}20 0%, ${theme.palette[color].main}10 100%)`,
        border: `1px solid ${theme.palette[color].main}30`,
      }} 
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        <Box sx={{ 
          color: `${color}.main`, 
          mb: 3,
          backgroundColor: `${theme.palette[color].main}20`,
          borderRadius: '50%',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto'
        }}>
          {icon}
        </Box>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

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
                  Admin Dashboard
                </Typography>
              </Toolbar>
            </AppBar>
          )}

          <Container maxWidth="xl" sx={{ py: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
              Dashboard Overview
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
                  onClick={() => router.push('/admin/orders')}
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
                  icon={<AttachMoney sx={{ fontSize: 32 }} />}
                  color="#4caf50"
                  subtitle="+12% from last week"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Weekly Orders"
                  value={stats.weeklyOrders || 0}
                  icon={<ShoppingCart sx={{ fontSize: 32 }} />}
                  color="#2196f3"
                  subtitle="+8% from last week"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers || 0}
                  icon={<People sx={{ fontSize: 32 }} />}
                  color="#ff9800"
                  subtitle="+15 new users"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Growth Rate"
                  value={`${stats.growth || 0}%`}
                  icon={<TrendingUp sx={{ fontSize: 32 }} />}
                  color="#f44336"
                  subtitle="Monthly growth"
                />
              </Grid>
            </Grid>

            {/* Charts Section - Using Stack with Better Control */}
<Box sx={{ width: '100%', mb: 4 }}>
  {/* First Row: Main Charts */}
  <Stack 
    direction={{ xs: 'column', lg: 'row' }} 
    spacing={3} 
    sx={{ mb: 3 }}
    alignItems="stretch"
  >
    {/* Sales Overview - 2/3 width on large screens */}
    <Card sx={{ 
      flex: { lg: 2, xs: 1 },
      borderRadius: 3, 
      boxShadow: 3, 
      p: 3, 
      minHeight: 400,
      minWidth: 0 // Important for flexbox shrinking
    }}>
      <CardContent sx={{ height: '100%' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Sales Overview
        </Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart 
              data={chartData.salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `£${value}`} />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? `£${value}` : value,
                name === 'revenue' ? 'Revenue' : 'Orders'
              ]} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" fill="#82ca9d" name="Orders" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>

    {/* Weekly Revenue - 1/3 width on large screens */}
    <Card sx={{ 
      flex: { lg: 1, xs: 1 },
      borderRadius: 3, 
      boxShadow: 3, 
      p: 3, 
      minHeight: 400,
      minWidth: 0 // Important for flexbox shrinking
    }}>
      <CardContent sx={{ height: '100%' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Weekly Revenue
        </Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData.revenueData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `£${value}`} />
              <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ff7300" 
                name="Revenue"
                strokeWidth={3}
                dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Stack>

  {/* Second Row: Pie Charts */}
  <Stack 
    direction={{ xs: 'column', md: 'row' }} 
    spacing={3}
    alignItems="stretch"
  >
    {/* Category Distribution */}
    <Card sx={{ 
      flex: 1,
      borderRadius: 3, 
      boxShadow: 3, 
      p: 3, 
      minHeight: 400,
      minWidth: 0
    }}>
      <CardContent sx={{ height: '100%' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Category Distribution
        </Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>

    {/* Order Status Distribution */}
    <Card sx={{ 
      flex: 1,
      borderRadius: 3, 
      boxShadow: 3, 
      p: 3, 
      minHeight: 400,
      minWidth: 0
    }}>
      <CardContent sx={{ height: '100%' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Order Status Distribution
        </Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={[
                  { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length },
                  { name: 'Processing', value: orders.filter(o => o.status === 'processing').length },
                  { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
                  { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
                  { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#4caf50" />
                <Cell fill="#2196f3" />
                <Cell fill="#ff9800" />
                <Cell fill="#ffc107" />
                <Cell fill="#f44336" />
              </Pie>
              <Tooltip formatter={(value) => [value, 'Orders']} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Stack>
</Box>

            {/* Recent Orders */}
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold">
                    Recent Orders
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/admin/orders')}
                    sx={{ borderRadius: 2 }}
                  >
                    View All Orders
                  </Button>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell><Typography fontWeight="bold">Order ID</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Customer</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Amount</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Actions</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 5).map((order) => (
                        <TableRow key={order._id} hover>
                          <TableCell>#{order._id?.slice(-8).toUpperCase() || 'N/A'}</TableCell>
                          <TableCell>{order.user?.name || 'N/A'}</TableCell>
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