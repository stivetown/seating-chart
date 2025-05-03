import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  TextField, 
  Button, 
  Box, 
  Typography,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import { useDrag } from 'react-dnd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const MEAL_OPTIONS = [
  'Not Selected',
  'Chicken',
  'Fish',
  'Beef',
  'Vegetarian',
  'Vegan',
  'Child Meal'
];

const DraggableGuest = ({ guest, onUpdateGuest }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GUEST',
    item: { id: guest.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [editedGuest, setEditedGuest] = useState(guest);

  const handleSave = () => {
    onUpdateGuest(editedGuest);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGuest(guest);
    setIsEditing(false);
  };

  return (
    <Box
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        mb: 1,
      }}
    >
      <Accordion
        sx={{
          cursor: 'move',
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          '&:before': {
            display: 'none',
          },
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <ListItemText 
              primary={guest.name}
              secondary={guest.mealChoice || 'No meal selected'}
            />
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              sx={{ ml: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Guest Name"
                value={editedGuest.name}
                onChange={(e) => setEditedGuest({ ...editedGuest, name: e.target.value })}
                size="small"
              />
              <TextField
                select
                fullWidth
                label="Meal Choice"
                value={editedGuest.mealChoice || 'Not Selected'}
                onChange={(e) => setEditedGuest({ ...editedGuest, mealChoice: e.target.value })}
                size="small"
              >
                {MEAL_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Group"
                value={editedGuest.group || ''}
                onChange={(e) => setEditedGuest({ ...editedGuest, group: e.target.value })}
                size="small"
              />
              <TextField
                fullWidth
                label="Notes"
                value={editedGuest.notes || ''}
                onChange={(e) => setEditedGuest({ ...editedGuest, notes: e.target.value })}
                multiline
                rows={2}
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  variant="contained"
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {guest.group && (
                <Typography variant="body2" color="text.secondary">
                  Group: {guest.group}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Meal: {guest.mealChoice || 'Not Selected'}
              </Typography>
              {guest.notes && (
                <Typography variant="body2" color="text.secondary">
                  Notes: {guest.notes}
                </Typography>
              )}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const GuestList = ({ guests, onAddGuest, onUpdateGuest }) => {
  const [newGuest, setNewGuest] = useState({
    name: '',
    group: '',
    mealChoice: 'Not Selected',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newGuest.name.trim()) {
      onAddGuest(newGuest);
      setNewGuest({
        name: '',
        group: '',
        mealChoice: 'Not Selected',
        notes: ''
      });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Guest List
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Guest Name"
          value={newGuest.name}
          onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
          size="small"
        />
        <TextField
          select
          fullWidth
          margin="normal"
          label="Meal Choice"
          value={newGuest.mealChoice}
          onChange={(e) => setNewGuest({ ...newGuest, mealChoice: e.target.value })}
          size="small"
        >
          {MEAL_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          margin="normal"
          label="Group (Optional)"
          value={newGuest.group}
          onChange={(e) => setNewGuest({ ...newGuest, group: e.target.value })}
          size="small"
        />
        <TextField
          fullWidth
          margin="normal"
          label="Notes"
          value={newGuest.notes}
          onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
          multiline
          rows={2}
          size="small"
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Add Guest
        </Button>
      </form>

      <List sx={{ mt: 2, maxHeight: '50vh', overflow: 'auto' }}>
        {guests.map((guest) => (
          <DraggableGuest 
            key={guest.id} 
            guest={guest} 
            onUpdateGuest={onUpdateGuest}
          />
        ))}
      </List>
    </Box>
  );
};

export default GuestList; 