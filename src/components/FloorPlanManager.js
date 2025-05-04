import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const FloorPlanManager = ({ 
  onSave, 
  onLoad,
  currentData 
}) => {
  const [openSave, setOpenSave] = useState(false);
  const [openLoad, setOpenLoad] = useState(false);
  const [planName, setPlanName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, plan: null });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [savedPlans, setSavedPlans] = useState(() => {
    const saved = localStorage.getItem('floorPlans');
    return saved ? JSON.parse(saved) : [];
  });

  const getFloorPlanDetails = (data) => {
    return {
      guestCount: data.guests?.length || 0,
      tableCount: data.tables?.length || 0,
      spaceCount: data.spaces?.length || 0,
      seatedGuests: data.tables?.reduce((count, table) => 
        count + (table.guests?.filter(guest => guest !== null).length || 0), 0) || 0
    };
  };

  const handleSave = () => {
    if (!planName.trim()) return;

    const newPlan = {
      id: editMode ? selectedPlan.id : Date.now().toString(),
      name: planName,
      data: currentData,
      timestamp: new Date().toISOString()
    };

    let updatedPlans;
    if (editMode) {
      updatedPlans = savedPlans.map(plan => 
        plan.id === selectedPlan.id ? newPlan : plan
      );
    } else {
      updatedPlans = [...savedPlans, newPlan];
    }

    localStorage.setItem('floorPlans', JSON.stringify(updatedPlans));
    setSavedPlans(updatedPlans);
    setPlanName('');
    setOpenSave(false);
    setEditMode(false);
    onSave(newPlan);
  };

  const handleLoadConfirm = (plan) => {
    setConfirmDialog({
      open: true,
      type: 'load',
      plan,
      title: 'Load Floor Plan',
      message: 'Loading a new floor plan will replace your current layout. Are you sure you want to continue?'
    });
  };

  const handleDeleteConfirm = (plan, event) => {
    event.stopPropagation();
    setConfirmDialog({
      open: true,
      type: 'delete',
      plan,
      title: 'Delete Floor Plan',
      message: `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`
    });
  };

  const handleConfirmAction = () => {
    const { type, plan } = confirmDialog;
    if (type === 'load') {
      onLoad(plan.data);
      setOpenLoad(false);
    } else if (type === 'delete') {
      const updatedPlans = savedPlans.filter(p => p.id !== plan.id);
      localStorage.setItem('floorPlans', JSON.stringify(updatedPlans));
      setSavedPlans(updatedPlans);
    }
    setConfirmDialog({ open: false, type: null, plan: null });
  };

  const handleMenuClick = (event, plan) => {
    event.stopPropagation();
    setSelectedPlan(plan);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleUpdate = () => {
    setEditMode(true);
    setPlanName(selectedPlan.name);
    setOpenSave(true);
    handleMenuClose();
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => {
            setEditMode(false);
            setPlanName('');
            setOpenSave(true);
          }}
        >
          Save Floor Plan
        </Button>
        <Button
          variant="outlined"
          startIcon={<FolderOpenIcon />}
          onClick={() => setOpenLoad(true)}
        >
          Load Floor Plan
        </Button>
      </Box>

      {/* Save Dialog */}
      <Dialog open={openSave} onClose={() => {
        setOpenSave(false);
        setEditMode(false);
        setPlanName('');
      }}>
        <DialogTitle>{editMode ? 'Update Floor Plan' : 'Save Floor Plan'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Floor Plan Name"
            fullWidth
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSave(false);
            setEditMode(false);
            setPlanName('');
          }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={openLoad} onClose={() => setOpenLoad(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Load Floor Plan</DialogTitle>
        <DialogContent>
          {savedPlans.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No saved floor plans found
            </Typography>
          ) : (
            <List>
              {savedPlans.map((plan) => {
                const details = getFloorPlanDetails(plan.data);
                return (
                  <ListItem
                    key={plan.id}
                    button
                    onClick={() => handleLoadConfirm(plan)}
                  >
                    <ListItemText
                      primary={plan.name}
                      secondary={
                        <>
                          <Typography variant="caption" component="div">
                            Last modified: {new Date(plan.timestamp).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" component="div">
                            {details.guestCount} guests ({details.seatedGuests} seated) • {details.tableCount} tables • {details.spaceCount} spaces
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="more"
                        onClick={(e) => handleMenuClick(e, plan)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoad(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null, plan: null })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: null, plan: null })}>
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleUpdate}>
          Update with Current Layout
        </MenuItem>
        <MenuItem onClick={(e) => {
          handleDeleteConfirm(selectedPlan, e);
          handleMenuClose();
        }}>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default FloorPlanManager; 