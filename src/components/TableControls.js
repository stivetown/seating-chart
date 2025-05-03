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
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  onUpdateWorkspaceSettings
}) => {
  const [editingTableId, setEditingTableId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [spaceDialog, setSpaceDialog] = useState(null);
  const [spaceConfig, setSpaceConfig] = useState({
    name: '',
    widthFeet: 15,
    heightFeet: 15
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

  const handleDeleteTable = (tableId) => {
    const updatedTables = tables.filter(table => table.id !== tableId);
    onUpdateTables(updatedTables);
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
    onAddSpace({
      ...spaceConfig,
      type: spaceDialog,
      id: Date.now().toString(),
      position: { x: workspaceSettings.margin, y: workspaceSettings.margin }
    });
    handleCloseSpaceDialog();
  };

  const handleUpdateSpaceDimension = (dimension) => (event, value) => {
    setSpaceConfig(prev => ({
      ...prev,
      [dimension]: value
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Room Setup
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => onAddTable('round')}
        >
          Add Round Table
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => onAddTable('square')}
        >
          Add Square Table
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => onAddTable('rectangle')}
        >
          Add Rectangle Table
        </Button>
        <Divider sx={{ my: 2 }} />
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => handleOpenSpaceDialog('danceFloor')}
        >
          Add Dance Floor
        </Button>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => handleOpenSpaceDialog('bandArea')}
        >
          Add Band/DJ Area
        </Button>
      </Box>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">
            Room Dimensions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 2 }}>
            <Typography gutterBottom>Width: {workspaceSettings.widthFeet} ft</Typography>
            <Slider
              value={workspaceSettings.widthFeet}
              onChange={handleWorkspaceChange('widthFeet')}
              min={20}
              max={75}
              step={1}
              marks={[
                { value: 20, label: '20ft' },
                { value: 75, label: '75ft' }
              ]}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Length: {workspaceSettings.heightFeet} ft</Typography>
            <Slider
              value={workspaceSettings.heightFeet}
              onChange={handleWorkspaceChange('heightFeet')}
              min={15}
              max={50}
              step={1}
              marks={[
                { value: 15, label: '15ft' },
                { value: 50, label: '50ft' }
              ]}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Grid Size: {workspaceSettings.gridSizeFeet} ft</Typography>
            <Slider
              value={workspaceSettings.gridSizeFeet}
              onChange={handleWorkspaceChange('gridSizeFeet')}
              min={0.5}
              max={2.5}
              step={0.25}
              marks={[
                { value: 0.5, label: '0.5ft' },
                { value: 2.5, label: '2.5ft' }
              ]}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Margin: {workspaceSettings.marginFeet} ft</Typography>
            <Slider
              value={workspaceSettings.marginFeet}
              onChange={handleWorkspaceChange('marginFeet')}
              min={0.5}
              max={2.5}
              step={0.25}
              marks={[
                { value: 0.5, label: '0.5ft' },
                { value: 2.5, label: '2.5ft' }
              ]}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Table Settings
      </Typography>
      
      <List>
        {tables.map((table) => (
          <Box key={table.id}>
            <ListItem
              sx={{
                bgcolor: selectedTable === table.id ? 'action.selected' : 'inherit',
                borderRadius: 1,
                mb: 1,
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: editingTableId === table.id ? 1 : 0 }}>
                {editingTableId === table.id ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    sx={{ mr: 1 }}
                    autoFocus
                  />
                ) : (
                  <ListItemText
                    primary={table.name}
                    secondary={`${table.seats} seats`}
                    sx={{ flex: 1 }}
                  />
                )}
                {editingTableId === table.id ? (
                  <>
                    <IconButton size="small" onClick={handleSaveName}>
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleCancelEditing}>
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                ) : (
                  <IconButton size="small" onClick={() => handleStartEditing(table)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Collapse in={editingTableId !== table.id}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleAddSeats(table.id)}
                    disabled={table.seats >= 12}
                  >
                    <AddCircleIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveSeats(table.id)}
                    disabled={table.seats <= 2}
                  >
                    <RemoveCircleIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTable(table.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Collapse>
            </ListItem>
          </Box>
        ))}
      </List>

      <Dialog open={!!spaceDialog} onClose={handleCloseSpaceDialog}>
        <DialogTitle>
          {spaceDialog === 'danceFloor' ? 'Configure Dance Floor' : 'Configure Band/DJ Area'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={spaceConfig.name}
              onChange={(e) => setSpaceConfig(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Width: {spaceConfig.widthFeet} ft</Typography>
            <Slider
              value={spaceConfig.widthFeet}
              onChange={handleUpdateSpaceDimension('widthFeet')}
              min={5}
              max={30}
              step={1}
              marks={[
                { value: 5, label: '5ft' },
                { value: 30, label: '30ft' }
              ]}
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>Length: {spaceConfig.heightFeet} ft</Typography>
            <Slider
              value={spaceConfig.heightFeet}
              onChange={handleUpdateSpaceDimension('heightFeet')}
              min={5}
              max={30}
              step={1}
              marks={[
                { value: 5, label: '5ft' },
                { value: 30, label: '30ft' }
              ]}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSpaceDialog}>Cancel</Button>
          <Button onClick={handleAddSpace} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableControls; 