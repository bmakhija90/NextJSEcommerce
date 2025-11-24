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
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Dashboard,
  Inventory,
  Category,
  LocalShipping,
  ReceiptLong,
  BarChart,
  Settings,
  Menu as MenuIcon,
  Search,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout/Layout';
import toast from 'react-hot-toast';

const drawerWidth = 240;

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter]);

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

      fetchProducts(token);
      fetchCategories(token);
    } catch (error) {
      setAccessDenied(true);
      setLoading(false);
      toast.error('Error verifying access');
    }
  };

  const fetchProducts = async (token) => {
    try {
      const response = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both array response and paginated response
        if (Array.isArray(data)) {
          setProducts(data);
          setFilteredProducts(data);
        } else if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          setFilteredProducts(data.products);
        } else {
          console.error('Unexpected API response structure:', data);
          setProducts([]);
          setFilteredProducts([]);
          toast.error('Unexpected data format received');
        }
      } else {
        toast.error('Error fetching products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error fetching products');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (token) => {
    try {
      const response = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData.filter(cat => cat.active));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = Array.isArray(products) ? [...products] : [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => 
        statusFilter === 'active' ? product.active : !product.active
      );
    }

    setFilteredProducts(filtered);
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

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${productToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Product deleted successfully!');
        setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('An error occurred while deleting product');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...product,
          active: !product.active,
        }),
      });

      if (response.ok) {
        toast.success(`Product ${!product.active ? 'activated' : 'deactivated'} successfully!`);
        setProducts(prev => 
          prev.map(p => 
            p._id === product._id ? { ...p, active: !p.active } : p
          )
        );
      } else {
        toast.error('Failed to update product status');
      }
    } catch (error) {
      toast.error('An error occurred while updating product status');
    }
  };

  const getStatusColor = (status) => {
    return status ? 'success' : 'error';
  };

  const getStockDisplay = (product) => {
    if (product.hasSizes && product.sizes && product.sizes.length > 0) {
      const totalStock = product.sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
      return `${totalStock} (${product.sizes.length} sizes)`;
    }
    return product.stock || 0;
  };

  const getStockStatus = (product) => {
    if (product.hasSizes && product.sizes && product.sizes.length > 0) {
      const totalStock = product.sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
      return totalStock > 0 ? 'success' : 'error';
    }
    return (product.stock || 0) > 0 ? 'success' : 'error';
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
                  Products Management
                </Typography>
              </Toolbar>
            </AppBar>
          )}

          <Container maxWidth="xl" sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Products Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push('/admin/products/new')}
                sx={{ borderRadius: 2 }}
              >
                Add New Product
              </Button>
            </Box>

            {/* Filters and Search */}
            <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={categoryFilter}
                        label="Category"
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {categories.map(category => (
                          <MenuItem key={category._id} value={category.name}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('all');
                        setStatusFilter('all');
                      }}
                      fullWidth
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold">
                    All Products ({Array.isArray(filteredProducts) ? filteredProducts.length : 0})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Showing {Array.isArray(filteredProducts) ? filteredProducts.length : 0} products
                  </Typography>
                </Box>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell><Typography fontWeight="bold">Product</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Category</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Price</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Stock</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Sizes</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Featured</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold">Actions</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <TableRow key={product._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {product.images && product.images.length > 0 && (
                                  <Box
                                    component="img"
                                    src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url}
                                    alt={product.name}
                                    sx={{
                                      width: 50,
                                      height: 50,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                    }}
                                    onError={(e) => {
                                      e.target.src = '/placeholder-image.jpg';
                                    }}
                                  />
                                )}
                                <Box>
                                  <Typography fontWeight="medium">
                                    {product.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                                    {product.description?.substring(0, 50)}...
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={product.category} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight="medium">
                                £{product.price?.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getStockDisplay(product)} 
                                color={getStockStatus(product)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {product.hasSizes ? (
                                <Chip 
                                  label={`${product.sizes?.length || 0} sizes`} 
                                  color="primary" 
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="No sizes" 
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={product.featured ? 'Yes' : 'No'} 
                                color={product.featured ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={product.active ? 'Active' : 'Inactive'} 
                                color={getStatusColor(product.active)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <IconButton
                                  size="small"
                                  color={product.active ? "default" : "success"}
                                  onClick={() => handleToggleStatus(product)}
                                  title={product.active ? 'Deactivate' : 'Activate'}
                                >
                                  {product.active ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => router.push(`/admin/products/edit/${product._id}`)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleDeleteClick(product)}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary">
                              No products found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {Array.isArray(products) && products.length > 0 
                                ? 'Try adjusting your search or filters' 
                                : 'No products available. Create your first product!'
                              }
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product "{productToDelete?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}