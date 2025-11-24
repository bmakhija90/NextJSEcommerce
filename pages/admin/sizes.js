import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
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
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
  Grid
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Dashboard,
  Inventory,
  Category,
  LocalShipping,
  ReceiptLong,
  BarChart,
  Settings,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';

const drawerWidth = 240;

const categories = ['Clothing', 'Shoes', 'Accessories', 'Electronics', 'Home & Garden', 'Sports'];

export default function SizeManagement() {
  const [sizes, setSizes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    order: 0,
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('sizes');
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

      fetchSizes(token);
    } catch (error) {
      setAccessDenied(true);
      setLoading(false);
      toast.error('Error verifying access');
    }
  };

  const fetchSizes = async (token) => {
    try {
      const response = await fetch('/api/admin/sizes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const sizesData = await response.json();
        setSizes(sizesData);
      } else {
        toast.error('Error fetching sizes');
      }
    } catch (error) {
      toast.error('Error fetching sizes');
    } finally {
      setFetching(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Products', icon: <Inventory />, path: '/admin/products' },
    { text: 'Categories', icon: <Category />, path: '/admin/categories' },
    { text: 'Sizes', icon: <LocalShipping />, path: '/admin/sizes' },
    { text: 'Orders', icon: <ReceiptLong />, path: '/admin/orders' },
    { text: 'Analytics', icon: <BarChart />, path: '/admin/analytics' },
    { text: 'Settings', icon: <Settings />, path: '/admin/settings' },
  ];

  const handleOpenDialog = (size = null) => {
    if (size) {
      setEditingSize(size);
      setFormData({
        name: size.name,
        category: size.category,
        description: size.description,
        order: size.order,
        active: size.active,
      });
    } else {
      setEditingSize(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        order: 0,
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSize(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingSize ? `/api/admin/sizes/${editingSize._id}` : '/api/admin/sizes';
      const method = editingSize ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingSize ? 'Size updated successfully!' : 'Size created successfully!');
        handleCloseDialog();
        fetchSizes(token);
      } else {
        toast.error(data.message || 'Failed to save size');
      }
    } catch (error) {
      toast.error('An error occurred while saving size');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sizeId) => {
    if (!confirm('Are you sure you want to delete this size? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/sizes/${sizeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Size deleted successfully!');
        fetchSizes(token);
      } else {
        toast.error('Failed to delete size');
      }
    } catch (error) {
      toast.error('An error occurred while deleting size');
    }
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

  if (fetching) {
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
                  Size Management
                </Typography>
              </Toolbar>
            </AppBar>
          )}

          <Container maxWidth="xl" sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Size Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{ borderRadius: 2 }}
              >
                Add New Size
              </Button>
            </Box>

            <Card>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  All Sizes ({sizes.length})
                </Typography>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell><Typography fontWeight="bold">Size Name</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Category</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Description</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Order</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Actions</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sizes.map((size) => (
                        <TableRow key={size._id} hover>
                          <TableCell>
                            <Typography fontWeight="medium">
                              {size.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{size.category}</TableCell>
                          <TableCell>{size.description || '-'}</TableCell>
                          <TableCell>{size.order}</TableCell>
                          <TableCell>
                            <Chip 
                              label={size.active ? 'Active' : 'Inactive'} 
                              color={size.active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                startIcon={<Edit />}
                                onClick={() => handleOpenDialog(size)}
                                size="small"
                                variant="outlined"
                              >
                                Edit
                              </Button>
                              <Button
                                startIcon={<Delete />}
                                onClick={() => handleDelete(size._id)}
                                size="small"
                                variant="outlined"
                                color="error"
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {sizes.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No sizes configured yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add sizes to use in your products
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Container>
        </Box>
      </Box>

      {/* Add/Edit Size Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSize ? 'Edit Size' : 'Add New Size'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Size Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., S, M, L, XL, 38, 40, etc."
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                  placeholder="Optional description for this size"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  inputProps={{ min: 0 }}
                  helperText="Display order (lower numbers show first)"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    />
                  }
                  label="Active (visible for selection)"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingSize ? 'Update Size' : 'Create Size')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}