import React from 'react';
import { Box } from '@mui/material';
import { useDrop } from 'react-dnd';
import Table from './Table';
import VenueSpace from './VenueSpace';

const SeatingChart = ({
  tables,
  spaces,
  guests,
  onAssignGuest,
  onUpdateTablePosition,
  onUpdateSpacePosition,
  selectedTable,
  selectedSpace,
  onSelectTable,
  onSelectSpace,
  onUpdateGuest,
  onRemoveGuest,
  onDeleteSpace,
  workspaceSettings,
}) => {
  const [, drop] = useDrop({
    accept: ['TABLE', 'VENUE_SPACE'],
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      
      if (item.type === 'VENUE_SPACE') {
        const space = spaces.find(s => s.id === item.id);
        if (delta && space) {
          // Calculate new position
          let x = Math.round(space.position.x + delta.x);
          let y = Math.round(space.position.y + delta.y);
          
          // Snap to grid
          const gridSize = workspaceSettings.gridSize;
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
          
          // Ensure spaces stay within bounds
          const margin = workspaceSettings.margin;
          const maxX = workspaceSettings.width - margin - (space.widthFeet * 40);
          const maxY = workspaceSettings.height - margin - (space.heightFeet * 40);
          
          const boundedX = Math.max(margin, Math.min(x, maxX));
          const boundedY = Math.max(margin, Math.min(y, maxY));
          
          onUpdateSpacePosition(space.id, { x: boundedX, y: boundedY });
        }
      } else {
        const table = tables.find(t => t.id === item.id);
        if (delta && table) {
          // Calculate new position
          let x = Math.round(table.position.x + delta.x);
          let y = Math.round(table.position.y + delta.y);
          
          // Snap to grid
          const gridSize = workspaceSettings.gridSize;
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
          
          // Ensure tables stay within bounds
          const margin = workspaceSettings.margin;
          const maxX = workspaceSettings.width - margin - (table.type === 'round' ? 140 : 180);
          const maxY = workspaceSettings.height - margin - (table.type === 'round' ? 140 : 100);
          
          const boundedX = Math.max(margin, Math.min(x, maxX));
          const boundedY = Math.max(margin, Math.min(y, maxY));
          
          onUpdateTablePosition(table.id, { x: boundedX, y: boundedY });
        }
      }
      return undefined;
    },
    canDrop: () => true,
  });

  const handleBackgroundClick = () => {
    onSelectTable(null);
    onSelectSpace(null);
  };

  return (
    <Box
      ref={drop}
      onClick={handleBackgroundClick}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: '#0A2A2A',
        borderRadius: 1,
        overflow: 'auto',
        minHeight: '70vh',
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(244, 246, 240, 0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(244, 246, 240, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(244, 246, 240, 0.3)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: `${workspaceSettings.width}px`,
          height: `${workspaceSettings.height}px`,
          backgroundImage: `
            linear-gradient(rgba(244, 246, 240, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(244, 246, 240, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${workspaceSettings.gridSize}px ${workspaceSettings.gridSize}px`,
          border: '1px solid rgba(244, 246, 240, 0.05)',
        }}
      >
        {spaces.map((space) => (
          <VenueSpace
            key={space.id}
            space={space}
            isSelected={selectedSpace === space.id}
            onSelect={() => onSelectSpace(space.id)}
            onDelete={onDeleteSpace}
          />
        ))}
        {tables.map((table) => (
          <Table
            key={table.id}
            table={table}
            guests={guests}
            onAssignGuest={onAssignGuest}
            isSelected={selectedTable === table.id}
            onSelect={() => onSelectTable(table.id)}
            onUpdateGuest={onUpdateGuest}
            onRemoveGuest={onRemoveGuest}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SeatingChart; 