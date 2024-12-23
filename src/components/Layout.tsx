import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, InputBase, IconButton, Drawer, Box, Button, Divider } from '@mui/material';
import { Menu as MenuIcon, Search as SearchIcon, Chat as ChatIcon, Contacts as ContactsIcon, AccountCircle as ProfileIcon, Group as MembersIcon, PendingActions as PendingRequestsIcon, Logout } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Typography as Typo } from 'antd';
const { Text } = Typo;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;
const collapsedDrawerWidth = 60;

const Dashboard: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const { logout } = useAuth();

  const logoutCallback = () => {
    Modal.confirm({
      title: 'Confirm',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to sign out?',
      okText: <Text style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff' }}>Sign Out</Text>,
      cancelText: <Text style={{ fontFamily: 'Montserrat, sans-serif' }}>Cancel</Text>,
      onOk: logout,
    });
};

  return (
    <Box sx={{ display: 'flex', fontFamily: 'Poppins, sans-serif !important' }}>
      <Drawer
        sx={{
          width: isCollapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isCollapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#34495e',
            color: 'white',
            overflowX: 'hidden',
            transition: 'width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isCollapsed ? 'center' : 'flex-start',
            paddingTop: 2,
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar
          sx={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%',
          }}
        >
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <MenuIcon />
          </IconButton>
          {!isCollapsed && (
            <Typography variant="h6" noWrap sx={{ ml: 2, fontFamily: 'Poppins, sans-serif !important' }}>
              Chat App
            </Typography>
          )}
        </Toolbar>
        <Divider sx={{ borderColor: '#2c3e50', width: '100%' }} />
        <Box
          sx={{
            p: isCollapsed ? 0 : 2,
            mt: isCollapsed ? 3 : 2,
            width: '100%',
          }}
        >
          <Link to="/chats" style={{ textDecoration: 'none', width: '100%' }}>
            <Button
              startIcon={<ChatIcon />}
              sx={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                color: 'white',
                width: '100%',
                mb: 2,
                textAlign: 'center',
                fontFamily: 'Poppins, sans-serif !important',
                fontSize: isCollapsed ? '0.875rem' : '1rem',
                '& .MuiButton-startIcon': {
                  fontSize: isCollapsed ? '1.5rem' : '2rem',
                },
              }}
            >
              {!isCollapsed && 'Chats'}
            </Button>
          </Link>

          <Button
            startIcon={<ContactsIcon />}
            sx={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              color: 'white',
              width: '100%',
              mb: 2,
              textAlign: 'center',
              fontFamily: 'Poppins, sans-serif !important',
              fontSize: isCollapsed ? '0.875rem' : '1rem',
              '& .MuiButton-startIcon': {
                fontSize: isCollapsed ? '1.5rem' : '2rem',
              },
            }}
          >
            {!isCollapsed && 'Contacts'}
          </Button>
          <Link to="/all-users" style={{ textDecoration: 'none', width: '100%' }}>
            <Button
              startIcon={<MembersIcon />}
              sx={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                color: 'white',
                width: '100%',
                mb: 2,
                textAlign: 'center',
                fontFamily: 'Poppins, sans-serif !important',
                fontSize: isCollapsed ? '0.875rem' : '1rem',
                '& .MuiButton-startIcon': {
                  fontSize: isCollapsed ? '1.5rem' : '2rem',
                },
              }}
            >
              {!isCollapsed && 'Request Access'}
            </Button>
          </Link>
          <Link to="/pending-requests" style={{ textDecoration: 'none', width: '100%' }}>
            <Button
              startIcon={<PendingRequestsIcon />}
              sx={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                color: 'white',
                width: '100%',
                mb: 2,
                textAlign: 'center',
                fontFamily: 'Poppins, sans-serif !important',
                fontSize: isCollapsed ? '0.875rem' : '1rem',
                '& .MuiButton-startIcon': {
                  fontSize: isCollapsed ? '1.5rem' : '2rem',
                },
              }}
            >
              {!isCollapsed && 'Approve/Reject'}
            </Button>
          </Link>
          <Button
            startIcon={<ProfileIcon />}
            sx={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              color: 'white',
              width: '100%',
              mb: 2,
              textAlign: 'center',
              fontFamily: 'Poppins, sans-serif !important',
              fontSize: isCollapsed ? '0.875rem' : '1rem',
              '& .MuiButton-startIcon': {
                fontSize: isCollapsed ? '1.5rem' : '2rem',
              },
            }}
          >
            {!isCollapsed && 'Profile'}
          </Button>

          <Button
            startIcon={<Logout />}
            onClick={logoutCallback}
            sx={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              color: 'white',
              width: '100%',
              mt: 40,
              mb: 2,
              textAlign: 'center',
              fontFamily: 'Poppins, sans-serif !important',
              fontSize: isCollapsed ? '0.875rem' : '1rem',
              '& .MuiButton-startIcon': {
                fontSize: isCollapsed ? '1.5rem' : '2rem',
              },
            }}
          >
            {!isCollapsed && 'Logout'}
          </Button>

        </Box>

      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, fontFamily: 'Poppins, sans-serif' }}
      >
        <AppBar position="static" sx={{ boxShadow: 'none', backgroundColor: '#ecf0f1', color: 'black', fontFamily: 'Poppins, sans-serif !important' }}>
          <Toolbar>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontFamily: 'Poppins, sans-serif !important' }}>
              Dashboard
            </Typography>
            <div style={{ position: 'relative' }}>
              <InputBase
                placeholder="Search…"
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 1,
                  paddingLeft: 2,
                  paddingRight: 2,
                  width: '100%',
                  marginRight: 1,
                  height: '36px',
                  fontFamily: 'Poppins, sans-serif !important'
                }}
              />
              <IconButton type="submit" sx={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon />
              </IconButton>
            </div>
          </Toolbar>
        </AppBar>

        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
