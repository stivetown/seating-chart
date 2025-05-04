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
  workspaceSettings
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
          // Ensure table remains selected after drop
          onSelectTable(table);
        }
      }
      return undefined;
    },
    canDrop: () => true,
  });

  const handleBackgroundClick = (e) => {
    // Only clear selection if clicking directly on the background
    if (e.target === e.currentTarget) {
      onSelectTable(null);
      onSelectSpace(null);
    }
  };

  // Create grid lines
  const gridLines = [];
  const { width, height, gridSize, margin } = workspaceSettings;

  // Vertical lines
  for (let x = margin; x <= width - margin; x += gridSize) {
    gridLines.push(
      <line
        key={`v${x}`}
        x1={x}
        y1={margin}
        x2={x}
        y2={height - margin}
        stroke="rgba(244, 246, 240, 0.1)"
        strokeWidth="1"
      />
    );
  }

  // Horizontal lines
  for (let y = margin; y <= height - margin; y += gridSize) {
    gridLines.push(
      <line
        key={`h${y}`}
        x1={margin}
        y1={y}
        x2={width - margin}
        y2={y}
        stroke="rgba(244, 246, 240, 0.1)"
        strokeWidth="1"
      />
    );
  }

  return (
    <>
      {/* Fixed Grid */}
      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      >
        {gridLines}
      </svg>

      {/* Draggable Content */}
      <Box
        ref={drop}
        onClick={handleBackgroundClick}
        sx={{
          position: 'relative',
          width: width,
          height: height,
          bgcolor: '#0A2A2A',
        }}
      >
        {spaces.map((space) => (
          <VenueSpace
            key={space.id}
            space={space}
            onUpdatePosition={onUpdateSpacePosition}
            selected={selectedSpace?.id === space.id}
            onSelect={onSelectSpace}
            onDelete={onDeleteSpace}
          />
        ))}
        {tables.map((table) => (
          <Table
            key={table.id}
            table={table}
            guests={guests}
            onAssignGuest={onAssignGuest}
            onUpdatePosition={onUpdateTablePosition}
            isSelected={selectedTable?.id === table.id}
            onSelect={onSelectTable}
            onUpdateGuest={onUpdateGuest}
            onRemoveGuest={onRemoveGuest}
          />
        ))}
      </Box>
    </>
  );
};

export default SeatingChart; 