import React, { useState, useMemo } from 'react';
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
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Stack,
  Divider
} from '@mui/material';
import { useDrag } from 'react-dnd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';

const MEAL_OPTIONS = [
  'Not Selected',
  'Chicken',
  'Fish',
  'Beef',
  'Vegetarian',
  'Vegan',
  'Child Meal'
];

const CATEGORY_OPTIONS = [
  'Family',
  'Friends',
  'Colleagues',
  'Wedding Party',
  'Plus One',
  'Children'
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
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
            <ListItemText 
              primary={guest.name}
              secondary={
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {guest.categories?.map((category, index) => (
                    <Chip
                      key={index}
                      label={category}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(244, 246, 240, 0.1)',
                        color: '#F4F6F0',
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Stack>
              }
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
              <FormControl fullWidth size="small">
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={editedGuest.categories || []}
                  onChange={(e) => setEditedGuest({ ...editedGuest, categories: e.target.value })}
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
    mealChoice: 'Not Selected',
    notes: '',
    categories: []
  });

  const [filters, setFilters] = useState({
    categories: []
  });

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const categoryMatch = filters.categories.length === 0 || 
        (guest.categories && guest.categories.some(cat => filters.categories.includes(cat)));
      return categoryMatch;
    });
  }, [guests, filters]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newGuest.name.trim()) {
      onAddGuest(newGuest);
      setNewGuest({
        name: '',
        mealChoice: 'Not Selected',
        notes: '',
        categories: []
      });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Guest List
      </Typography>
      
      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon fontSize="small" />
            Filters
          </Typography>
          {filters.categories.length > 0 && (
            <Button
              size="small"
              onClick={() => setFilters({ categories: [] })}
              sx={{
                fontSize: '0.75rem',
                color: 'rgba(244, 246, 240, 0.7)',
                '&:hover': {
                  color: '#F4F6F0',
                }
              }}
            >
              Reset Filters
            </Button>
          )}
        </Box>
        <FormControl fullWidth size="small">
          <InputLabel>Categories</InputLabel>
          <Select
            multiple
            value={filters.categories}
            onChange={(e) => setFilters({ categories: e.target.value })}
            input={<OutlinedInput label="Categories" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDelete={() => {
                      const newCategories = filters.categories.filter(cat => cat !== value);
                      setFilters({ categories: newCategories });
                    }}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(244, 246, 240, 0.1)',
                      color: '#F4F6F0',
                      fontSize: '0.75rem',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(244, 246, 240, 0.7)',
                        '&:hover': {
                          color: '#F4F6F0',
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            )}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <MenuItem 
                key={category} 
                value={category}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {category}
                {filters.categories.includes(category) && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newCategories = filters.categories.filter(cat => cat !== category);
                      setFilters({ categories: newCategories });
                    }}
                    sx={{ 
                      color: 'error.main',
                      p: 0.5
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />
      
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
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Categories</InputLabel>
          <Select
            multiple
            value={newGuest.categories}
            onChange={(e) => setNewGuest({ ...newGuest, categories: e.target.value })}
            input={<OutlinedInput label="Categories" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        {filteredGuests.map((guest) => (
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