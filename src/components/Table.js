import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Popover,
  MenuItem,
  IconButton,
  TextField,
  Button,
  Divider
} from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';
import EditIcon from '@mui/icons-material/Edit';
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

const Table = ({ table, guests, onAssignGuest, isSelected, onSelect, onUpdateGuest, onRemoveGuest }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TABLE',
    item: () => ({ id: table.id, type: table.type }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const getTableDimensions = () => {
    switch (table.type) {
      case 'round':
        return { width: 140, height: 140 };
      case 'square':
        return { width: 140, height: 140 };
      case 'rectangle':
        return { width: 180, height: 100 };
      default:
        return { width: 140, height: 140 };
    }
  };

  const getTableStyle = () => {
    const dimensions = getTableDimensions();
    return {
      position: 'absolute',
      left: table.position.x,
      top: table.position.y,
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: '#0F2F2F',
      border: `1px solid ${isSelected ? '#F4F6F0' : 'rgba(244, 246, 240, 0.23)'}`,
      borderRadius: table.type === 'round' ? '50%' : '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.5 : 1,
      boxShadow: isSelected 
        ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
        : '0 2px 12px rgba(0, 0, 0, 0.2)',
      transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(244, 246, 240, 0.5)',
      },
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
    };
  };

  const Seat = ({ seatIndex, seatStyle, guest }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'GUEST',
      drop: (item) => {
        onAssignGuest(item.id, table.id, seatIndex);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));

    const [anchorEl, setAnchorEl] = useState(null);
    const [editedGuest, setEditedGuest] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleClick = (event) => {
      event.stopPropagation();
      if (guest) {
        setAnchorEl(event.currentTarget);
        setEditedGuest({ ...guest });
      }
    };

    const handleClose = () => {
      setAnchorEl(null);
      setIsEditing(false);
      setEditedGuest(null);
    };

    const handleSave = () => {
      onUpdateGuest(editedGuest);
      handleClose();
    };

    const handleRemove = () => {
      onRemoveGuest(table.id, seatIndex);
      handleClose();
    };

    const open = Boolean(anchorEl);

    return (
      <>
        <Box
          ref={drop}
          onClick={handleClick}
          sx={{
            ...seatStyle,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: guest ? '#F4F6F0' : '#1A3A3A',
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${guest ? '#F4F6F0' : 'rgba(244, 246, 240, 0.23)'}`,
            boxShadow: isOver 
              ? '0 0 0 2px #F4F6F0, 0 2px 8px rgba(0, 0, 0, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)',
              borderColor: 'rgba(244, 246, 240, 0.5)',
            },
            cursor: guest ? 'pointer' : 'default',
          }}
          title={guest ? `${guest.name}${guest.mealChoice ? ` - ${guest.mealChoice}` : ''}${guest.notes ? `\n${guest.notes}` : ''}` : `Empty Seat ${seatIndex + 1}`}
        >
          {guest && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#0A2A2A',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {guest.name[0]}
            </Typography>
          )}
        </Box>
        {guest && (
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            sx={{
              '& .MuiPopover-paper': {
                backgroundColor: '#0F2F2F',
                border: '1px solid rgba(244, 246, 240, 0.12)',
                p: 2,
                minWidth: 200,
              },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#F4F6F0' }}>
                {guest.name}
              </Typography>
              {isEditing ? (
                <>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Meal Choice"
                    value={editedGuest.mealChoice || 'Not Selected'}
                    onChange={(e) => setEditedGuest({ ...editedGuest, mealChoice: e.target.value })}
                  >
                    {MEAL_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    label="Notes"
                    multiline
                    rows={2}
                    value={editedGuest.notes || ''}
                    onChange={(e) => setEditedGuest({ ...editedGuest, notes: e.target.value })}
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={handleClose} variant="outlined">
                      Cancel
                    </Button>
                    <Button size="small" onClick={handleSave} variant="contained">
                      Save
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ color: '#C8CCBF' }}>
                    Meal: {guest.mealChoice || 'Not Selected'}
                  </Typography>
                  {guest.notes && (
                    <Typography variant="body2" sx={{ color: '#C8CCBF' }}>
                      Notes: {guest.notes}
                    </Typography>
                  )}
                  <Divider sx={{ borderColor: 'rgba(244, 246, 240, 0.12)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IconButton 
                      size="small" 
                      onClick={() => setIsEditing(true)}
                      sx={{ color: '#F4F6F0' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handleRemove}
                      sx={{ color: '#F4F6F0' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>
          </Popover>
        )}
      </>
    );
  };

  const renderSeats = () => {
    const seatPositions = [];
    const dimensions = getTableDimensions();
    const tableRadius = dimensions.width / 2;
    const seatRadius = tableRadius + 24; // Position seats outside the table edge
    
    for (let i = 0; i < table.seats; i++) {
      let seatStyle = {};
      
      if (table.type === 'round') {
        // Start from the top (-90 degrees or -π/2 radians) and go clockwise
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI / table.seats);
        seatStyle = {
          position: 'absolute',
          left: `${tableRadius + seatRadius * Math.cos(angle)}px`,
          top: `${tableRadius + seatRadius * Math.sin(angle)}px`,
          transform: 'translate(-50%, -50%)',
        };
      } else if (table.type === 'square') {
        // Calculate seats per side (rounded up to ensure all seats are placed)
        const seatsPerSide = Math.ceil(table.seats / 4);
        const side = Math.floor(i / seatsPerSide);
        const positionOnSide = i % seatsPerSide;
        const spacing = dimensions.width / (seatsPerSide + 1);
        
        switch (side) {
          case 0: // Top
            seatStyle = { 
              top: -24,
              left: spacing + (positionOnSide * spacing),
              transform: 'translate(-50%, 0)',
            };
            break;
          case 1: // Right
            seatStyle = { 
              top: spacing + (positionOnSide * spacing),
              right: -24,
              transform: 'translate(0, -50%)',
            };
            break;
          case 2: // Bottom
            seatStyle = { 
              bottom: -24,
              left: dimensions.width - spacing - (positionOnSide * spacing),
              transform: 'translate(-50%, 0)',
            };
            break;
          case 3: // Left
            seatStyle = { 
              top: dimensions.height - spacing - (positionOnSide * spacing),
              left: -24,
              transform: 'translate(0, -50%)',
            };
            break;
        }
      } else {
        // Rectangle table seats
        const side = Math.floor(i / 3);
        const pos = i % 3;
        switch (side) {
          case 0: // Top
            seatStyle = { top: -24, left: 30 + pos * 50 };
            break;
          case 1: // Bottom
            seatStyle = { bottom: -24, left: 30 + pos * 50 };
            break;
        }
      }

      const guest = table.guests[i] ? 
        guests.find(g => g.id === table.guests[i]) : 
        null;

      seatPositions.push(
        <Seat
          key={i}
          seatIndex={i}
          seatStyle={seatStyle}
          guest={guest}
        />
      );
    }

    return seatPositions;
  };

  return (
    <Box
      ref={drag}
      sx={getTableStyle()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          mb: 1,
          color: '#F4F6F0',
          fontWeight: 300,
          letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}
      >
        {table.name}
      </Typography>
      {renderSeats()}
    </Box>
  );
};

export default Table; 