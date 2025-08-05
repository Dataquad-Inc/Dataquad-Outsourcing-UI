import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme, variant }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: '10px 24px',
  boxShadow: variant === 'contained' ? '0 2px 8px rgba(242, 99, 34, 0.3)' : 'none',
  '&:hover': {
    boxShadow: variant === 'contained' ? '0 4px 12px rgba(242, 99, 34, 0.4)' : 'none',
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.2s ease-in-out',
}));

export const CustomButton = ({
  children,
  loading = false,
  disabled = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={20}
          sx={{ mr: 1, color: 'inherit' }}
        />
      )}
      {children}
    </StyledButton>
  );
};