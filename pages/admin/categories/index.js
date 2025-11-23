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
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Category } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    sortOrder: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);
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

    fetchCategories(token);
  };

  const fetchCategories = async (token) => {
    try {
      const response = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      } else {
        toast.error('Error fetching categories');
      }
    } catch (error) {
      toast.error('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        sortOrder: category.sortOrder || 0,
        active: category.active !== false,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        sortOrder: 0,
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory._id}`
        : '/api/admin/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
        handleCloseDialog();
        fetchCategories(token);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error saving category');
      }
    } catch (error) {
      toast.error('Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will need to be reassigned.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Category deleted successfully');
        fetchCategories(token);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error deleting category');
      }
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/categories/${category._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          active: !category.active,
        }),
      });

      if (response.ok) {
        toast.success(`Category ${!category.active ? 'activated' : 'deactivated'} successfully`);
        fetchCategories(token);
      }
    } catch (error) {
      toast.error('Error updating category');
    }
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Category sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Categories Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add New Category
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Manage product categories. Categories help organize your products and improve customer navigation.
        </Alert>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Products</TableCell>
                    <TableCell>Sort Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {category.image && (
                            <Box
                              component="img"
                              src={category.image}
                              alt={category.name}
                              sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                            />
                          )}
                          <Typography variant="subtitle2" fontWeight="bold">
                            {category.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${category.productCount || 0} products`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {category.sortOrder}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={category.active ? 'Active' : 'Inactive'} 
                          color={category.active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(category)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={category.active ? 'default' : 'success'}
                            onClick={() => handleToggleActive(category)}
                          >
                            <Switch size="small" checked={category.active} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(category._id)}
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

            {categories.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Category sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No categories found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Create your first category to organize your products
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Your First Category
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Category Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />

              <TextField
                fullWidth
                label="Image URL"
                name="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                margin="normal"
                placeholder="https://example.com/category-image.jpg"
                helperText="Optional: Add a category image for better visual representation"
              />

              <TextField
                fullWidth
                label="Sort Order"
                name="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                margin="normal"
                inputProps={{ min: 0 }}
                helperText="Lower numbers appear first"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                }
                label="Active Category"
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={saving}>
              {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}