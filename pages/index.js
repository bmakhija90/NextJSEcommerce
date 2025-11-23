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
} from '@mui/material';
import { ArrowForward, LocalShipping, Security, Support } from '@mui/icons-material';
import { useRouter } from 'next/router';
import ProductCard from '../components/Product/ProductCard';
import Layout from '../components/Layout/Layout';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      
      // Filter featured products or take first 4
      const featured = productsData.filter(product => product.featured).slice(0, 4);
      setFeaturedProducts(featured.length > 0 ? featured : productsData.slice(0, 4));
      setCategories(categoriesData.slice(0, 6));
      
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError(error.message);
      // Set empty arrays as fallback
      setFeaturedProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

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
      title: '24/7 Support',
      description: 'Get help whenever you need it',
    },
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
          py: 12,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Welcome to UK Store
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
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
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Shop Now
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800&auto=format&fit=crop"
                alt="Shopping"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: 3,
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {error && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            {error} - Showing limited content
          </Alert>
        )}

        {/* Features Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Featured Products */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h2">
              Featured Products
            </Typography>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => router.push('/products')}
            >
              View All Products
            </Button>
          </Box>

          {featuredProducts.length > 0 ? (
            <Grid container spacing={3}>
              {featuredProducts.map(product => (
                <Grid item xs={12} sm={6} md={3} key={product._id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No products available at the moment. Please check back later.
            </Alert>
          )}
        </Box>

        {/* Categories Section */}
        {categories.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Shop by Category
            </Typography>
            <Grid container spacing={2}>
              {categories.map(category => (
                <Grid item xs={6} sm={4} md={2} key={category}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => router.push(`/products?category=${category}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" component="h3">
                        {category}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Layout>
  );
}