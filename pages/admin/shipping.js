import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import { Save, LocalShipping } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function ShippingConfig() {
  const [config, setConfig] = useState({
    freeShippingThreshold: 50,
    standardShippingCost: 0,
    expressShippingCost: 5.99,
    shippingEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchShippingConfig();
  }, []);

  const fetchShippingConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/shipping', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else if (response.status !== 404) {
        toast.error('Error fetching shipping configuration');
      }
      // If 404, use default values
    } catch (error) {
      console.error('Error fetching shipping config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Shipping configuration updated successfully!');
      } else {
        toast.error('Error updating shipping configuration');
      }
    } catch (error) {
      toast.error('Error updating shipping configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <LocalShipping sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Shipping Configuration
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 4 }}>
          Configure your shipping rates and free shipping threshold for UK customers.
        </Alert>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                {/* Free Shipping Threshold */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Free Shipping
                  </Typography>
                  <TextField
                    fullWidth
                    label="Free Shipping Threshold (£)"
                    name="freeShippingThreshold"
                    type="number"
                    value={config.freeShippingThreshold}
                    onChange={handleChange}
                    inputProps={{ step: "0.01", min: "0" }}
                    helperText="Orders above this amount qualify for free standard shipping"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Shipping Costs */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Shipping Costs
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Standard Shipping Cost (£)"
                    name="standardShippingCost"
                    type="number"
                    value={config.standardShippingCost}
                    onChange={handleChange}
                    inputProps={{ step: "0.01", min: "0" }}
                    helperText="3-5 business days"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Express Shipping Cost (£)"
                    name="expressShippingCost"
                    type="number"
                    value={config.expressShippingCost}
                    onChange={handleChange}
                    inputProps={{ step: "0.01", min: "0" }}
                    helperText="1-2 business days"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Configuration Summary */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Configuration Summary
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 3, backgroundColor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Free Shipping Threshold:</Typography>
                      <Typography fontWeight="bold">
                        £{config.freeShippingThreshold}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Standard Shipping:</Typography>
                      <Typography fontWeight="bold">
                        {config.standardShippingCost === 0 ? 'Free' : `£${config.standardShippingCost}`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Express Shipping:</Typography>
                      <Typography fontWeight="bold">
                        £{config.expressShippingCost}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle1">Example Order:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Order £30 → Shipping: {config.standardShippingCost === 0 ? 'Free' : `£${config.standardShippingCost}`}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  disabled={saving || loading}
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
}