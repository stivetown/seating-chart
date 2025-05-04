import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Collapse,
  Divider,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';

const TableControls = ({ 
  onAddTable, 
  selectedTable, 
  selectedSpace,
  tables,
  spaces,
  onUpdateTables,
  onUpdateTableName,
  onAddSpace,
  onUpdateSpace,
  onDeleteSpace,
  workspaceSettings,
  onUpdateWorkspaceSettings,
  onSelectTable
}) => {
  const [editingTableId, setEditingTableId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [spaceDialog, setSpaceDialog] = useState(null);
  const [spaceConfig, setSpaceConfig] = useState({
    name: '',
    widthFeet: 15,
    heightFeet: 15
  });
  const [openSpaceDialog, setOpenSpaceDialog] = useState(false);
  const [newSpace, setNewSpace] = useState({
    name: '',
    widthFeet: 20,
    heightFeet: 20,
  });

  const handleStartEditing = (table) => {
    setEditingTableId(table.id);
    setEditedName(table.name);
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdateTableName(editingTableId, editedName.trim());
      setEditingTableId(null);
    }
  };

  const handleCancelEditing = () => {
    setEditingTableId(null);
    setEditedName('');
  };

  const handleAddSeats = (tableId) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        const newSeats = Math.min(table.seats + 1, 12);
        return { 
          ...table, 
          seats: newSeats,
          guests: [...table.guests, null]
        };
      }
      return table;
    });
    onUpdateTables(updatedTables);
  };

  const handleRemoveSeats = (tableId) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId && table.seats > 2) {
        const newSeats = table.seats - 1;
        return { 
          ...table, 
          seats: newSeats,
          guests: table.guests.slice(0, newSeats)
        };
      }
      return table;
    });
    onUpdateTables(updatedTables);
  };

  const handleDeleteTable = () => {
    if (selectedTable) {
      const updatedTables = tables.filter(table => table.id !== selectedTable.id);
      onUpdateTables(updatedTables);
      onSelectTable(null);
    }
  };

  const handleWorkspaceChange = (setting) => (event, newValue) => {
    onUpdateWorkspaceSettings({ [setting]: newValue });
  };

  const handleOpenSpaceDialog = (type) => {
    setSpaceConfig({
      name: type === 'danceFloor' ? 'Dance Floor' : 'Band/DJ Area',
      widthFeet: 15,
      heightFeet: 15
    });
    setSpaceDialog(type);
  };

  const handleCloseSpaceDialog = () => {
    setSpaceDialog(null);
  };

  const handleAddSpace = () => {
    const space = {
      id: Date.now().toString(),
      ...newSpace,
      position: { x: workspaceSettings.margin, y: workspaceSettings.margin },
      type: 'VENUE_SPACE'
    };
    onAddSpace(space);
    setOpenSpaceDialog(false);
    setNewSpace({
      name: '',
      widthFeet: 20,
      heightFeet: 20,
    });
  };

  const handleUpdateSpaceDimension = (dimension) => (event, value) => {
    setSpaceConfig(prev => ({
      ...prev,
      [dimension]: value
    }));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Tables</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => onAddTable('round')}
            startIcon={<AddIcon />}
          >
            Add Round Table
          </Button>
          <Button
            variant="outlined"
            onClick={() => onAddTable('square')}
            startIcon={<AddIcon />}
          >
            Add Square Table
          </Button>
          <Button
            variant="outlined"
            onClick={() => onAddTable('rectangular')}
            startIcon={<AddIcon />}
          >
            Add Rectangular Table
          </Button>
        </Box>
      </Box>

      <Divider />

      {selectedTable && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Selected Table</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editingTableId === selectedTable.id ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  size="small"
                  variant="outlined"
                  autoFocus
                  inputProps={{
                    'aria-label': 'Edit table name',
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(244, 246, 240, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(244, 246, 240, 0.5)',
                      },
                    }
                  }}
                />
                <IconButton 
                  size="small" 
                  onClick={handleSaveName}
                  sx={{ color: 'success.main' }}
                >
                  <SaveIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={handleCancelEditing}
                  sx={{ color: 'error.main' }}
                >
                  <CancelIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>{selectedTable.name || 'Unnamed Table'}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleStartEditing(selectedTable)}
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Seats: {selectedTable.seats}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveSeats(selectedTable.id)}
                  disabled={selectedTable.seats <= 2}
                  sx={{ color: 'primary.main' }}
                >
                  <RemoveCircleIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleAddSeats(selectedTable.id)}
                  disabled={selectedTable.seats >= 12}
                  sx={{ color: 'primary.main' }}
                >
                  <AddCircleIcon />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Type: {selectedTable.type.charAt(0).toUpperCase() + selectedTable.type.slice(1)}
              </Typography>
              <IconButton
                size="small"
                onClick={handleDeleteTable}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Venue Spaces</Typography>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setOpenSpaceDialog(true)}
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 2,
            py: 1.5,
            borderColor: 'rgba(244, 246, 240, 0.23)',
            color: '#F4F6F0',
            '&:hover': {
              borderColor: 'rgba(244, 246, 240, 0.5)',
              backgroundColor: 'rgba(244, 246, 240, 0.05)'
            }
          }}
        >
          Add Space
        </Button>
      </Box>

      <Dialog 
        open={openSpaceDialog} 
        onClose={() => setOpenSpaceDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#0F2F2F',
            color: '#F4F6F0',
            borderRadius: 2,
            border: '1px solid rgba(244, 246, 240, 0.12)'
          }
        }}
      >
        <DialogTitle>Add Venue Space</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={newSpace.name}
              onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(244, 246, 240, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(244, 246, 240, 0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(244, 246, 240, 0.7)',
                },
              }}
            />
            <TextField
              label="Width"
              type="number"
              value={newSpace.widthFeet}
              onChange={(e) => setNewSpace({ ...newSpace, widthFeet: Number(e.target.value) })}
              InputProps={{
                endAdornment: <InputAdornment position="end">feet</InputAdornment>,
              }}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(244, 246, 240, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(244, 246, 240, 0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(244, 246, 240, 0.7)',
                },
              }}
            />
            <TextField
              label="Height"
              type="number"
              value={newSpace.heightFeet}
              onChange={(e) => setNewSpace({ ...newSpace, heightFeet: Number(e.target.value) })}
              InputProps={{
                endAdornment: <InputAdornment position="end">feet</InputAdornment>,
              }}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(244, 246, 240, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(244, 246, 240, 0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(244, 246, 240, 0.7)',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setOpenSpaceDialog(false)}
            sx={{ 
              color: 'rgba(244, 246, 240, 0.7)',
              '&:hover': {
                color: '#F4F6F0',
                backgroundColor: 'rgba(244, 246, 240, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddSpace} 
            variant="contained" 
            disabled={!newSpace.name}
            sx={{
              bgcolor: '#1A3A3A',
              color: '#F4F6F0',
              '&:hover': {
                bgcolor: '#244444'
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(26, 58, 58, 0.5)',
                color: 'rgba(244, 246, 240, 0.3)'
              }
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {selectedSpace && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Selected Space</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{selectedSpace.name}</Typography>
            <IconButton
              size="small"
              onClick={() => onDeleteSpace(selectedSpace.id)}
              sx={{ color: 'primary.main' }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TableControls; 