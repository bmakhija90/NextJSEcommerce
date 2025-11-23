import { useState, useEffect, useRef } from 'react';
import {
  Container,
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
  Paper,
  IconButton,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import { 
  AddPhotoAlternate, 
  Save, 
  ArrowBack, 
  Delete,
  CloudUpload,
  Category,
  Check,
  Close
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout/Layout';
import toast from 'react-hot-toast';

const steps = ['Basic Information', 'Images & Media', 'Pricing & Inventory', 'Review & Publish'];

export default function NewProduct() {
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    featured: false,
    active: true,
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageUploadDialog, setImageUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
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

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    const newImages = selectedFiles.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        file,
        url: objectUrl,
        alt: `Product image ${index + 1}`,
        isPrimary: index === 0 && formData.images.length === 0,
        isNew: true,
      };
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    setSelectedFiles([]);
    setImageUploadDialog(false);
    toast.success(`${newImages.length} image(s) added successfully`);
  };

  const handleImageUrlAdd = (url, alt = '') => {
    if (!url.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    const newImage = {
      url: url.trim(),
      alt: alt.trim() || `Product image ${formData.images.length + 1}`,
      isPrimary: formData.images.length === 0,
      isUrl: true,
    };

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImage],
    }));

    toast.success('Image URL added successfully');
  };

  const removeImage = (index) => {
    const imageToRemove = formData.images[index];
    
    // Revoke object URL if it's a local file
    if (imageToRemove.isNew && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    const newImages = formData.images.filter((_, i) => i !== index);
    
    // If we removed the primary image and there are other images, set the first one as primary
    if (imageToRemove.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    setFormData(prev => ({
      ...prev,
      images: newImages,
    }));
  };

  const setPrimaryImage = (index) => {
    const newImages = formData.images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setFormData(prev => ({
      ...prev,
      images: newImages,
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;

      case 1: // Images
        if (formData.images.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;

      case 2: // Pricing & Inventory
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
        if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const uploadImagesToServer = async (images) => {
    const uploadedImages = [];
    
    for (const image of images) {
      if (image.isNew && image.file) {
        // For local files, you would typically upload to a server
        // For now, we'll convert to base64 (not recommended for production)
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(image.file);
          reader.onload = () => resolve(reader.result);
        });
        
        uploadedImages.push({
          url: base64,
          alt: image.alt,
          isPrimary: image.isPrimary,
        });
        
        // Revoke the object URL
        URL.revokeObjectURL(image.url);
      } else {
        // For URL images, just use as is
        uploadedImages.push({
          url: image.url,
          alt: image.alt,
          isPrimary: image.isPrimary,
        });
      }
    }
    
    return uploadedImages;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Upload images first
      const uploadedImages = await uploadImagesToServer(formData.images);

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          images: uploadedImages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Product created successfully!');
        router.push('/admin/products');
      } else {
        toast.error(data.message || 'Failed to create product');
      }
    } catch (error) {
      toast.error('An error occurred while creating product');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
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

            <Grid item xs={12}>
              <FormControl 
                fullWidth 
                error={!!errors.category}
                sx={{ minWidth: 250 }} // Set minimum width for dropdown
              >
                <InputLabel>Category *</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Category *"
                  onChange={handleChange}
                  displayEmpty={false}
                >
                  <MenuItem value="" disabled>
                    <em>Select a category</em>
                  </MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category._id} value={category.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.image && (
                          <Avatar 
                            src={category.image} 
                            sx={{ width: 24, height: 24 }}
                          />
                        )}
                        {category.name}
                      </Box>
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
                label="Product Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={6}
                error={!!errors.description}
                helperText={errors.description || "Provide a detailed description of your product"}
                required
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Add product images. You can upload images from your computer or add image URLs.
              The first image will be used as the primary display image.
            </Alert>

            {/* Image Upload Options */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 3, cursor: 'pointer' }}>
                  <Box onClick={() => setImageUploadDialog(true)}>
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Upload Images
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload images from your computer
                    </Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Add Image URL
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="https://example.com/image.jpg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleImageUrlAdd(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button 
                      variant="outlined"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        handleImageUrlAdd(input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Image Gallery */}
            {formData.images.length > 0 ? (
              <Grid container spacing={2}>
                {formData.images.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        border: image.isPrimary ? 2 : 1, 
                        borderColor: image.isPrimary ? 'primary.main' : 'grey.300',
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={image.url}
                          alt={image.alt}
                          sx={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            color={image.isPrimary ? "primary" : "default"}
                            onClick={() => setPrimaryImage(index)}
                            sx={{ 
                              backgroundColor: 'white',
                              '&:hover': { backgroundColor: 'grey.100' }
                            }}
                          >
                            {image.isPrimary ? <Check /> : <Check />}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeImage(index)}
                            sx={{ 
                              backgroundColor: 'white',
                              '&:hover': { backgroundColor: 'grey.100' }
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Alt Text"
                          value={image.alt}
                          onChange={(e) => {
                            const newImages = [...formData.images];
                            newImages[index].alt = e.target.value;
                            setFormData(prev => ({ ...prev, images: newImages }));
                          }}
                        />
                      </Box>
                      
                      {image.isPrimary && (
                        <Chip 
                          label="Primary" 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 1, width: '100%' }}
                        />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AddPhotoAlternate sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No images added yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload images from your computer or add image URLs to continue
                </Typography>
              </Box>
            )}

            {errors.images && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.images}
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
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

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                  />
                }
                label="Publish product immediately"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Product Summary
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Basic Information
                    </Typography>
                    <Typography><strong>Name:</strong> {formData.name}</Typography>
                    <Typography><strong>Category:</strong> {formData.category}</Typography>
                    <Typography><strong>Description:</strong> {formData.description.substring(0, 100)}...</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Pricing & Inventory
                    </Typography>
                    <Typography><strong>Price:</strong> £{formData.price}</Typography>
                    <Typography><strong>Stock:</strong> {formData.stock} units</Typography>
                    <Typography><strong>Featured:</strong> {formData.featured ? 'Yes' : 'No'}</Typography>
                    <Typography><strong>Status:</strong> {formData.active ? 'Active' : 'Inactive'}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Images ({formData.images.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {formData.images.map((image, index) => (
                        <Box key={index} sx={{ textAlign: 'center', position: 'relative' }}>
                          <Box
                            component="img"
                            src={image.url}
                            alt={image.alt}
                            sx={{
                              width: 100,
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: image.isPrimary ? 2 : 1,
                              borderColor: image.isPrimary ? 'primary.main' : 'grey.300',
                            }}
                          />
                          {image.isPrimary && (
                            <Chip label="Primary" size="small" color="primary" sx={{ mt: 1 }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

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
            Add New Product
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {getStepContent(index)}
                    <Box sx={{ mb: 2, mt: 2 }}>
                      <div>
                        <Button
                          variant="contained"
                          onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={loading}
                        >
                          {index === steps.length - 1 ? (loading ? 'Creating...' : 'Create Product') : 'Continue'}
                        </Button>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                      </div>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {activeStep === steps.length && (
              <Alert severity="success">
                Product created successfully! Redirecting to products list...
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Image Upload Dialog */}
        <Dialog open={imageUploadDialog} onClose={() => setImageUploadDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Upload Images
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{ mb: 2 }}
              >
                Select Images
              </Button>

              {selectedFiles.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Files ({selectedFiles.length})
                  </Typography>
                  <List dense>
                    {selectedFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveSelectedFile(index)}
                          >
                            <Delete />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <Avatar src={URL.createObjectURL(file)} variant="rounded" />
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImageUploadDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUploadImages} 
              variant="contained"
              disabled={selectedFiles.length === 0}
            >
              Upload {selectedFiles.length} Image(s)
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}