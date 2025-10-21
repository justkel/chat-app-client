import React, { useState } from 'react';
import {
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
  Button,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Contacts as ContactsIcon,
  AccountCircle as ProfileIcon,
  Group as MembersIcon,
  PendingActions as PendingRequestsIcon,
  Settings as SettingsIcon,
  Logout
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Typography as Typo } from 'antd';
import { useNavigate } from "react-router-dom";
const { Text } = Typo;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;
const collapsedDrawerWidth = 60;

const Dashboard: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
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

  const menuItems = [
    { label: 'Chats', icon: <ChatIcon />, path: '/chats' },
    { label: 'Contacts', icon: <ContactsIcon /> },
    { label: 'Request Access', icon: <MembersIcon />, path: '/all-users' },
    { label: 'Approve/Reject', icon: <PendingRequestsIcon />, path: '/pending-requests' },
     { label: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { label: 'Logout', icon: <Logout />, action: logoutCallback }
  ];

  return (
    <Box sx={{ display: 'flex', fontFamily: 'Montserrat, sans-serif !important' }}>
      <Drawer
        anchor="left"
        open
        variant="permanent"
        sx={{
          width: collapsedDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsedDrawerWidth,
            transition: 'width 0.3s ease',
            boxSizing: 'border-box',
            backgroundColor: '#f8f9fa',
            color: 'black',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 2,
          },
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', width: '100%' }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'black' }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
        <Divider sx={{ borderColor: '#ced4da', width: '100%' }} />
        <Box sx={{ mt: 3, width: '100%' }}>
          {menuItems.map((item, idx) => (
            <Tooltip key={idx} title={item.label} placement="right">
              <Button
                startIcon={item.icon}
                onClick={
                  item.action
                    ? item.action
                    : item.path
                    ? () => navigate(item.path)
                    : undefined
                }
                sx={{
                  justifyContent: 'center',
                  color: 'black',
                  width: '100%',
                  mb: 2,
                  textAlign: 'center',
                  fontFamily: 'Montserrat, sans-serif !important',
                  fontSize: '0.875rem',
                  '& .MuiButton-startIcon': { fontSize: '1.5rem' },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Drawer>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        variant="temporary"
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: '#f8f9fa',
            color: 'black',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 2,
          },
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-start', width: '100%' }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'black' }}>
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{ ml: 2, fontFamily: 'Montserrat, sans-serif !important' }}
          >
            Chat App
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: '#ced4da', width: '100%' }} />
        <Box sx={{ p: 2, mt: 2, width: '100%' }}>
          {menuItems.map((item, idx) => (
            <Button
              key={idx}
              startIcon={item.icon}
              onClick={
                item.action
                  ? item.action
                  : item.path
                  ? () => navigate(item.path)
                  : undefined
              }
              sx={{
                justifyContent: 'flex-start',
                color: 'black',
                width: '100%',
                mb: 2,
                textAlign: 'center',
                fontFamily: 'Montserrat, sans-serif !important',
                fontSize: '1rem',
                '& .MuiButton-startIcon': { fontSize: '2rem' },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;