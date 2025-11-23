import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  alpha,
} from '@mui/material';
import { 
  ArrowForward, 
  LocalShipping, 
  Security, 
  Support,
  ChevronLeft,
  ChevronRight,
  Category 
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import ProductCard from '../components/Product/ProductCard';
import Layout from '../components/Layout/Layout';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/products/categories')
      ]);

      if (!productsResponse.ok) {
        throw new Error('Failed to fetch products');
      }

      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories');
      }

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();
      
      // Filter featured products or take first 8
      const featured = productsData.filter(product => product.featured).slice(0, 8);
      setFeaturedProducts(featured.length > 0 ? featured : productsData.slice(0, 8));
      setCategories(['all', ...categoriesData.slice(0, 8)]);
      
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError(error.message);
      // Set empty arrays as fallback
      setFeaturedProducts([]);
      setCategories(['all']);
    } finally {
      setLoading(false);
    }
  };

  // Carousel navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredProducts.length / 4));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredProducts.length / 4)) % Math.ceil(featuredProducts.length / 4));
  };

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? featuredProducts 
    : featuredProducts.filter(product => product.category === selectedCategory);

  const features = [
    {
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      title: 'Free UK Delivery',
      description: 'Free delivery on all orders over £50',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure Payment',
      description: 'Your payment information is safe with us',
    },
    {
      icon: <Support sx={{ fontSize: 40 }} />,
      title: '24/7 Support on E-mail',
      description: 'Get help whenever you need it',
    }
  ];

  if (loading) {
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
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                fontWeight="bold"
                sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
              >
                Welcome to Katyani Store
              </Typography>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
              >
                Discover amazing products with fast delivery across the United Kingdom
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => router.push('/products')}
                sx={{
                  backgroundColor: 'white',
                  color: '#667eea',
                  fontSize: '1.1rem',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Shop Now
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {error && (
          <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
            {error} - Showing limited content
          </Alert>
        )}

        {/* Features Section */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Featured Products Carousel */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                Featured Products
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Handpicked items just for you
              </Typography>
            </Box>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => router.push('/products')}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              View All Products
            </Button>
          </Box>

          {featuredProducts.length > 0 ? (
            <Box sx={{ position: 'relative' }}>
              {/* Category Filter */}
              <Box sx={{ mb: 4, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {categories.map(category => (
                  <Chip
                    key={category}
                    label={category === 'all' ? 'All Products' : category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    sx={{
                      fontWeight: 'bold',
                      px: 2,
                      py: 1.5,
                      fontSize: '0.9rem',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>

              {/* Carousel */}
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box
                  sx={{
                    display: 'flex',
                    transition: 'transform 0.5s ease',
                    transform: `translateX(-${currentSlide * 100}%)`,
                  }}
                >
                  {Array.from({ length: Math.ceil(filteredProducts.length / 4) }).map((_, slideIndex) => (
                    <Box
                      key={slideIndex}
                      sx={{
                        minWidth: '100%',
                        display: 'flex',
                        gap: 3,
                      }}
                    >
                      <Grid container spacing={3}>
                        {filteredProducts.slice(slideIndex * 4, slideIndex * 4 + 4).map(product => (
                          <Grid item xs={12} sm={6} md={3} key={product._id}>
                            <ProductCard product={product} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>

                {/* Carousel Navigation */}
                {filteredProducts.length > 4 && (
                  <>
                    <IconButton
                      onClick={prevSlide}
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'white',
                        boxShadow: 3,
                        '&:hover': {
                          backgroundColor: 'grey.100',
                        },
                        zIndex: 2,
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      onClick={nextSlide}
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'white',
                        boxShadow: 3,
                        '&:hover': {
                          backgroundColor: 'grey.100',
                        },
                        zIndex: 2,
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                  </>
                )}

                {/* Carousel Dots */}
                {filteredProducts.length > 4 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 1 }}>
                    {Array.from({ length: Math.ceil(filteredProducts.length / 4) }).map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: currentSlide === index ? 'primary.main' : 'grey.300',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: currentSlide === index ? 'primary.dark' : 'grey.400',
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No products available at the moment. Please check back later.
            </Alert>
          )}
        </Box>

        {/* Categories Section */}
        {categories.length > 1 && (
          <Box sx={{ mb: 8 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                Shop by Category
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Explore our wide range of product categories and find exactly what you're looking for
              </Typography>
            </Box>
            
            <Grid container spacing={2} justifyContent="center">
              {categories.filter(cat => cat !== 'all').map(category => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={category}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: 3,
                      boxShadow: 2,
                      transition: 'all 0.3s ease',
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        '& .MuiTypography-root': {
                          color: 'white',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                    onClick={() => router.push(`/products?category=${category}`)}
                  >
                    <CardContent sx={{ p: '0 !important' }}>
                      <Category 
                        sx={{ 
                          fontSize: 40, 
                          mb: 2, 
                          color: 'primary.main',
                          transition: 'color 0.3s ease',
                        }} 
                      />
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        fontWeight="bold"
                        sx={{ 
                          transition: 'color 0.3s ease',
                        }}
                      >
                        {category}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => router.push('/products')}
                sx={{ 
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Browse All Categories
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </Layout>
  );
}