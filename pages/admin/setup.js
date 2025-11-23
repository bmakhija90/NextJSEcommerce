import { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { Security, PersonAdd } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function AdminSetup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretKey: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          secretKey: formData.secretKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Admin user created successfully!');
        router.push('/auth/login');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('An error occurred while creating admin user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Admin Setup
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create the first admin user for your store
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              This page is for initial setup only. Make sure to keep your secret key secure.
            </Alert>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                helperText="Password must be at least 6 characters long"
              />
              
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Secret Key"
                name="secretKey"
                type="password"
                value={formData.secretKey}
                onChange={handleChange}
                margin="normal"
                required
                helperText="Default secret key is 'admin123'"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PersonAdd />}
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Creating Admin...' : 'Create Admin User'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> This setup should only be done once. After creating the admin user, 
                you can login normally and will be redirected to the admin dashboard.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
}