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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
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
      return;
    }

    fetchProducts(token);
  };

  const fetchProducts = async (token) => {
    try {
      const response = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
      } else {
        toast.error('Error fetching products');
      }
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        setProducts(products.filter(p => p._id !== productToDelete._id));
      } else {
        toast.error('Error deleting product');
      }
    } catch (error) {
      toast.error('Error deleting product');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (productId) => {
    router.push(`/admin/products/edit/${productId}`);
  };

  const handleView = (productId) => {
    router.push(`/product/${productId}`);
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Products Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/admin/products/new')}
          >
            Add New Product
          </Button>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Featured</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            component="img"
                            src={product.images[0] || '/placeholder-image.jpg'}
                            alt={product.name}
                            sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                          />
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {product.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                              {product.description.substring(0, 50)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={product.category} size="small" />
                      </TableCell>
                      <TableCell>£{product.price}</TableCell>
                      <TableCell>
                        <Chip 
                          label={product.stock} 
                          color={product.stock > 0 ? 'success' : 'error'}
                          size="small"
                        />
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
                          label={product.stock > 0 ? 'Active' : 'Out of Stock'} 
                          color={product.stock > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleView(product._id)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(product._id)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {products.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => router.push('/admin/products/new')}
                >
                  Add Your First Product
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}