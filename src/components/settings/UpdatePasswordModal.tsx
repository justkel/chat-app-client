'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Modal,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { useUpdatePassword } from '../../hooks/useUpdatePassword';

interface UpdatePasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

const montserrat = 'Montserrat, sans-serif';

export default function UpdatePasswordModal({
  open,
  onClose,
  userId,
}: UpdatePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { updatePassword, data, loading, error } = useUpdatePassword();

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
  const [snackMessage, setSnackMessage] = useState('');

  const passwordRules = useMemo(
    () => [
      {
        id: 'length',
        label: 'At least 10 characters',
        test: (s: string) => s.length >= 10,
      },
      {
        id: 'uppercase',
        label: 'At least 1 uppercase letter (A-Z)',
        test: (s: string) => /[A-Z]/.test(s),
      },
      {
        id: 'lowercase',
        label: 'At least 1 lowercase letter (a-z)',
        test: (s: string) => /[a-z]/.test(s),
      },
      {
        id: 'number',
        label: 'At least 1 number (0-9)',
        test: (s: string) => /[0-9]/.test(s),
      },
      {
        id: 'special',
        label: 'At least 1 special character (e.g. !@#$%)',
        test: (s: string) => /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/.test(s),
      },
    ],
    []
  );

  const newPasswordValidation = useMemo(() => {
    return passwordRules.map((r) => ({ ...r, ok: r.test(newPassword) }));
  }, [newPassword, passwordRules]);

  const isNewPasswordValid = newPasswordValidation.every((r) => r.ok);
  const doesConfirmMatch = newPassword.length > 0 ? newPassword === confirmPassword : false;
  const canSubmit = currentPassword.length > 0 && isNewPasswordValid && doesConfirmMatch && !loading;

  useEffect(() => {
    if (data && data.updatePassword) {
      setSnackSeverity('success');
      setSnackMessage('Password updated successfully');
      setSnackOpen(true);
      // reset fields and close modal after short delay
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTouched({ current: false, new: false, confirm: false });
      setTimeout(() => {
        onClose();
      }, 750);
    }
  }, [data, onClose]);

  useEffect(() => {
    if (error) {
      const msg = (error as any)?.message || 'Failed to update password';
      setSnackSeverity('error');
      setSnackMessage(msg);
      setSnackOpen(true);
    }
  }, [error]);

  const handleSubmit = async () => {
    setTouched({ current: true, new: true, confirm: true });

    if (!canSubmit) {
      setSnackSeverity('error');
      setSnackMessage('Please ensure all password requirements are met.');
      setSnackOpen(true);
      return;
    }

    try {
      await updatePassword(userId, currentPassword, newPassword);
    } catch (err: any) {
      const msg = err?.message || 'Failed to update password';
      setSnackSeverity('error');
      setSnackMessage(msg);
      setSnackOpen(true);
    }
  };

  const handleCloseSnack = () => setSnackOpen(false);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTouched({ current: false, new: false, confirm: false });
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="update-password-modal">
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            p: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 24,
                borderRadius: 2,
                p: { xs: 3, sm: 4 },
                fontFamily: montserrat,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography
                  id="update-password-modal"
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontFamily: montserrat }}
                >
                  Update Password
                </Typography>
                <IconButton
                  onClick={handleClose}
                  aria-label="close"
                  sx={{ color: 'text.secondary' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              <TextField
                label="Current Password"
                placeholder="Enter current password"
                type={showCurrent ? 'text' : 'password'}
                fullWidth
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, current: true }))}
                InputLabelProps={{ sx: { fontFamily: montserrat } }}
                inputProps={{ sx: { fontFamily: montserrat } }}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                        onClick={() => setShowCurrent((s) => !s)}
                        edge="end"
                        sx={{ fontFamily: montserrat }}
                      >
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px' },
                }}
              />

              {touched.current && currentPassword.length === 0 && (
                <Typography color="error" sx={{ mb: 1, fontFamily: montserrat, fontSize: '0.875rem' }}>
                  Current password is required
                </Typography>
              )}

              <TextField
                label="New Password"
                placeholder="Example: Pluelop901#"
                type={showNew ? 'text' : 'password'}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, new: true }))}
                InputLabelProps={{ sx: { fontFamily: montserrat } }}
                inputProps={{ sx: { fontFamily: montserrat } }}
                sx={{ mb: 1 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showNew ? 'Hide new password' : 'Show new password'}
                        onClick={() => setShowNew((s) => !s)}
                        edge="end"
                        sx={{ fontFamily: montserrat }}
                      >
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px' },
                }}
              />

              <Box sx={{ mb: 2 }}>
                {newPasswordValidation.map((r) => (
                  <Typography
                    key={r.id}
                    sx={{
                      fontFamily: montserrat,
                      fontSize: '0.875rem',
                      color: r.ok ? 'success.main' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <span style={{ display: 'inline-block', width: 14, textAlign: 'center' }}>
                      {r.ok ? '✓' : '•'}
                    </span>
                    <span>{r.label}</span>
                  </Typography>
                ))}
              </Box>

              <TextField
                label="Confirm New Password"
                placeholder="Re-type new password"
                type={showConfirm ? 'text' : 'password'}
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
                InputLabelProps={{ sx: { fontFamily: montserrat } }}
                inputProps={{ sx: { fontFamily: montserrat } }}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        onClick={() => setShowConfirm((s) => !s)}
                        edge="end"
                        sx={{ fontFamily: montserrat }}
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px' },
                }}
              />

              {touched.confirm && confirmPassword.length > 0 && !doesConfirmMatch && (
                <Typography color="error" sx={{ mb: 2, fontFamily: montserrat }}>
                  New password and confirmation do not match.
                </Typography>
              )}

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!canSubmit}
                sx={{
                  fontFamily: montserrat,
                  py: 1.5,
                  borderRadius: 2,
                  mb: 1,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </Button>

              <Typography
                sx={{
                  fontFamily: montserrat,
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  mt: 1,
                  textAlign: 'center',
                }}
              >
                Make sure your new password is strong and memorable.
              </Typography>
            </Box>
          </motion.div>
        </Box>

        <Snackbar
          open={snackOpen}
          autoHideDuration={5000}
          onClose={handleCloseSnack}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnack}
            severity={snackSeverity}
            sx={{ width: '100%', fontFamily: montserrat }}
          >
            {snackMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
}
