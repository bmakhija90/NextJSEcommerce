import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ShoppingCart,
  Favorite,
  Person,
  Menu as MenuIcon,
  Settings,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminExists, setAdminExists] = useState(true); // Assume admin exists by default
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    checkAdminExists();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        fetchCartCount(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  const checkAdminExists = async () => {
    try {
      const response = await fetch('/api/admin/check');
      if (response.ok) {
        const data = await response.json();
        setAdminExists(data.adminExists);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchCartCount = async (token) => {
    try {
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const cart = await response.json();
        const count = cart.items.reduce((total, item) => total + item.quantity, 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCartCount(0);
    router.push('/');
  };

  const menuItems = [
    { text: 'Home', href: '/' },
    { text: 'Products', href: '/products' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              UK Store
            </Link>
          </Typography>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
            {menuItems.map(item => (
              <Button
                key={item.text}
                color="inherit"
                component={Link}
                href={item.href}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            {!adminExists && (
              <Button
                color="inherit"
                startIcon={<Settings />}
                component={Link}
                href="/admin/setup"
              >
                Setup Admin
              </Button>
            )}

            <IconButton 
              color="inherit" 
              component={Link} 
              href="/wishlist"
              disabled={!user}
            >
              <Favorite />
            </IconButton>
            
            <IconButton 
              color="inherit" 
              component={Link} 
              href="/cart"
              disabled={!user}
            >
              <Badge badgeContent={user ? cartCount : 0} color="secondary">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {user ? (
              <>
                <IconButton color="inherit" component={Link} href="/profile">
                  <Person />
                </IconButton>
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
                {user.role === 'admin' && (
                  <Button color="inherit" component={Link} href="/admin">
                    Admin
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} href="/auth/login">
                  Login
                </Button>
                <Button color="inherit" component={Link} href="/auth/register">
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <List sx={{ width: 250 }}>
          {menuItems.map(item => (
            <ListItem
              key={item.text}
              component={Link}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          {!adminExists && (
            <ListItem
              component={Link}
              href="/admin/setup"
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary="Setup Admin" />
            </ListItem>
          )}
        </List>
      </Drawer>

      <main>
        {children}
      </main>
    </Box>
  );
}