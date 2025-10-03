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
  Logout
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Typography as Typo } from 'antd';
const { Text } = Typo;

const drawerWidth = 240;
const collapsedDrawerWidth = 60;

const Dashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    { label: 'Profile', icon: <ProfileIcon /> },
    { label: 'Logout', icon: <Logout />, action: logoutCallback }
  ];

  return (
    <Box sx={{ display: 'flex', fontFamily: 'Montserrat, sans-serif !important' }}>
      {/* Drawer */}
      <Drawer
        anchor="left"
        open={true} // Always visible, just collapses
        variant="permanent"
        sx={{
          width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
            transition: 'width 0.3s ease',
            boxSizing: 'border-box',
            backgroundColor: '#f8f9fa',
            color: 'black',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: drawerOpen ? 'flex-start' : 'center',
            paddingTop: 2,
          },
        }}
      >
        <Toolbar sx={{ justifyContent: drawerOpen ? 'flex-start' : 'center', width: '100%' }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'black' }}>
            <MenuIcon />
          </IconButton>
          {drawerOpen && (
            <Typography variant="h6" noWrap sx={{ ml: 2, fontFamily: 'Montserrat, sans-serif !important' }}>
              Chat App
            </Typography>
          )}
        </Toolbar>
        <Divider sx={{ borderColor: '#ced4da', width: '100%' }} />
        <Box sx={{ p: drawerOpen ? 2 : 0, mt: drawerOpen ? 2 : 3, width: '100%' }}>
          {menuItems.map((item, idx) => {
            const button = (
              <Button
                key={idx}
                startIcon={item.icon}
                onClick={
                  item.action
                    ? item.action
                    : item.path
                      ? () => (window.location.href = item.path)
                      : undefined
                }
                sx={{
                  justifyContent: drawerOpen ? 'flex-start' : 'center',
                  color: 'black',
                  width: '100%',
                  mb: 2,
                  textAlign: 'center',
                  fontFamily: 'Montserrat, sans-serif !important',
                  fontSize: drawerOpen ? '1rem' : '0.875rem',
                  '& .MuiButton-startIcon': { fontSize: drawerOpen ? '2rem' : '1.5rem' },
                }}
              >
                {drawerOpen && item.label}
              </Button>
            );

            // If collapsed, wrap in Tooltip for hover labels
            return drawerOpen ? button : (
              <Tooltip key={idx} title={item.label} placement="right">
                {button}
              </Tooltip>
            );
          })}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Dashboard;
