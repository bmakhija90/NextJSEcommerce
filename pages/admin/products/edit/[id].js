import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import Layout from '../../../../components/Layout/Layout';
import toast from 'react-hot-toast';

const categories = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Toys & Games',
  'Automotive',
  'Health & Household',
  'Jewelry',
];

export default function EditProduct() {
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    featured: false,
    images: [''],
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
        setFormData({
          name: productData.name,
          description: productData.description,
          price: productData.price.toString(),
          category: productData.category,
          stock: productData.stock.toString(),
          featured: productData.featured,
          images: productData.images.length > 0 ? productData.images : [''],
        });
      } else {
        toast.error('Product not found');
        router.push('/admin/products');
      }
    } catch (error) {
      toast.error('Error fetching product');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages,
    }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ''],
    }));
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        images: newImages,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required';
    
    const validImages = formData.images.filter(img => img.trim() !== '');
    if (validImages.length === 0) {
      newErrors.images = 'At least one image URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          images: formData.images.filter(img => img.trim() !== ''),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Product updated successfully!');
        router.push('/admin/products');
      } else {
        toast.error(data.message || 'Failed to update product');
      }
    } catch (error) {
      toast.error('An error occurred while updating product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Layout>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/admin/products')}
            sx={{ mr: 2 }}
          >
            Back to Products
          </Button>
          <Typography variant="h4" component="h1">
            Edit Product
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      label="Category"
                      onChange={handleChange}
                    >
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && (
                      <Typography variant="caption" color="error">
                        {errors.category}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Price (£)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    inputProps={{ step: "0.01", min: "0" }}
                    error={!!errors.price}
                    helperText={errors.price}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Stock Quantity"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    inputProps={{ min: "0" }}
                    error={!!errors.stock}
                    helperText={errors.stock}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Product Images
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Update image URLs (one per line)
                  </Alert>
                  
                  {formData.images.map((image, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        label={`Image URL ${index + 1}`}
                        value={image}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formData.images.length > 1 && (
                        <Button
                          color="error"
                          onClick={() => removeImageField(index)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                  ))}
                  
                  {errors.images && (
                    <Typography variant="caption" color="error" sx={{ mb: 2, display: 'block' }}>
                      {errors.images}
                    </Typography>
                  )}
                  
                  <Button
                    onClick={addImageField}
                    variant="outlined"
                  >
                    Add Another Image
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                      />
                    }
                    label="Feature this product on the homepage"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  disabled={loading}
                >
                  {loading ? 'Updating Product...' : 'Update Product'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/products')}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
}