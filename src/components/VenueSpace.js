import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useDrag } from 'react-dnd';
import DeleteIcon from '@mui/icons-material/Delete';

const VenueSpace = ({ space, isSelected, onSelect, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'VENUE_SPACE',
    item: () => ({ id: space.id, type: space.type }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Convert feet to pixels
  const width = space.widthFeet * 40; // 40 pixels per foot
  const height = space.heightFeet * 40;

  const getSpaceStyle = () => ({
    position: 'absolute',
    left: space.position.x,
    top: space.position.y,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: space.type === 'danceFloor' ? 'rgba(244, 246, 240, 0.15)' : 'rgba(244, 246, 240, 0.08)',
    border: `2px dashed ${isSelected ? '#F4F6F0' : 'rgba(244, 246, 240, 0.3)'}`,
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.7 : 1,
    transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
    zIndex: 1,
    '&:hover': {
      backgroundColor: space.type === 'danceFloor' ? 'rgba(244, 246, 240, 0.2)' : 'rgba(244, 246, 240, 0.15)',
      boxShadow: '0 0 0 1px rgba(244, 246, 240, 0.3)',
    },
    userSelect: 'none',
  });

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(space.id);
  };

  return (
    <Box
      ref={drag}
      sx={getSpaceStyle()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          color: '#F4F6F0',
          opacity: 0.9,
          fontWeight: 300,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {space.name}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#F4F6F0',
          opacity: 0.7,
          fontWeight: 300,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {space.widthFeet}' × {space.heightFeet}'
      </Typography>
      {isSelected && (
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            color: '#F4F6F0',
            backgroundColor: 'rgba(244, 246, 240, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(244, 246, 240, 0.2)',
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default VenueSpace; 