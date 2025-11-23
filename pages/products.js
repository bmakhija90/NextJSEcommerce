import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
} from '@mui/material';
import ProductCard from '../components/Product/ProductCard';
import Layout from '../components/Layout/Layout';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
  });
  const [page, setPage] = useState(1);
  const productsPerPage = 12;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredProducts = products
    .filter(product => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (page - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Products
        </Typography>
        
        {/* Filters */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPage(1);
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Min Price (£)"
            type="number"
            value={filters.minPrice}
            onChange={(e) => {
              setFilters({ ...filters, minPrice: e.target.value });
              setPage(1);
            }}
            sx={{ width: 150 }}
          />
          
          <TextField
            label="Max Price (£)"
            type="number"
            value={filters.maxPrice}
            onChange={(e) => {
              setFilters({ ...filters, maxPrice: e.target.value });
              setPage(1);
            }}
            sx={{ width: 150 }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <MenuItem value="name">Name (A-Z)</MenuItem>
              <MenuItem value="price-low">Price (Low to High)</MenuItem>
              <MenuItem value="price-high">Price (High to Low)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {filteredProducts.length} products found
          </Typography>
        </Box>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {paginatedProducts.map(product => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>

        {filteredProducts.length === 0 && (
          <Typography variant="h6" textAlign="center" sx={{ mt: 4 }}>
            No products found matching your filters.
          </Typography>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Container>
    </Layout>
  );
}