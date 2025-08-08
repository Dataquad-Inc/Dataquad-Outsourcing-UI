import React from 'react';
import { Switch, FormControlLabel } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { toggleEntity } from '../redux/authSlice';


const EntityToggleSwitch = () => {
  const dispatch = useDispatch();
  const entity = useSelector((state) => state.auth.entity);


  const handleToggle = () => {
    dispatch(toggleEntity());
    console.log(entity);
  };

  return (
    <FormControlLabel
      control={
        <Switch
          checked={entity === 'US'}
          onChange={handleToggle}
          color="primary"
        />
      }
      label={entity}
    />
  );
};

export default EntityToggleSwitch;
