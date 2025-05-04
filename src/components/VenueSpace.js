import React from 'react';
import { Box, IconButton } from '@mui/material';
import { useDrag } from 'react-dnd';
import DeleteIcon from '@mui/icons-material/Delete';

const VenueSpace = ({ space, onUpdatePosition, selected, onSelect, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'VENUE_SPACE',
    item: { id: space.id, type: 'VENUE_SPACE' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const width = space.widthFeet * 40; // Convert feet to pixels
  const height = space.heightFeet * 40;

  return (
    <Box
      ref={drag}
      sx={{
        position: 'absolute',
        left: space.position.x,
        top: space.position.y,
        width: width,
        height: height,
        bgcolor: 'rgba(244, 246, 240, 0.1)',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'rgba(244, 246, 240, 0.3)',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'primary.main',
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        '&:hover': {
          bgcolor: 'rgba(244, 246, 240, 0.15)',
        },
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(space);
      }}
    >
      {space.name}
      {selected && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(space.id);
          }}
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            color: 'primary.main',
            bgcolor: 'rgba(15, 47, 47, 0.8)',
            '&:hover': {
              bgcolor: 'rgba(15, 47, 47, 0.9)',
            },
          }}
        >
          <DeleteIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default VenueSpace; 