import React, { useState } from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import GuestList from './GuestList';
import SeatingChart from './SeatingChart';
import TableControls from './TableControls';
import ZoomableCanvas from './ZoomableCanvas';
import FloorPlanManager from './FloorPlanManager';

// Constants for unit conversion (1 foot = 40 pixels)
const PIXELS_PER_FOOT = 40;

const Layout = () => {
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [workspaceSettings, setWorkspaceSettings] = useState({
    widthFeet: 40, // 40 feet = 1600 pixels
    heightFeet: 30, // 30 feet = 1200 pixels
    gridSizeFeet: 1.25, // 1.25 feet = 50 pixels
    marginFeet: 1.25, // 1.25 feet = 50 pixels
    // Maintain pixel values for internal use
    width: 1600,
    height: 1200,
    gridSize: 50,
    margin: 50,
  });

  const convertToPixels = (feet) => Math.round(feet * PIXELS_PER_FOOT);
  const convertToFeet = (pixels) => pixels / PIXELS_PER_FOOT;

  const addGuest = (guest) => {
    setGuests([...guests, { ...guest, id: Date.now().toString() }]);
  };

  const updateGuest = (updatedGuest) => {
    setGuests(guests.map(guest => 
      guest.id === updatedGuest.id ? updatedGuest : guest
    ));
  };

  const updateWorkspaceSettings = (newSettings) => {
    const updatedSettings = { ...workspaceSettings };

    // Update feet measurements if provided
    if ('widthFeet' in newSettings) {
      updatedSettings.widthFeet = newSettings.widthFeet;
      updatedSettings.width = convertToPixels(newSettings.widthFeet);
    }
    if ('heightFeet' in newSettings) {
      updatedSettings.heightFeet = newSettings.heightFeet;
      updatedSettings.height = convertToPixels(newSettings.heightFeet);
    }
    if ('gridSizeFeet' in newSettings) {
      updatedSettings.gridSizeFeet = newSettings.gridSizeFeet;
      updatedSettings.gridSize = convertToPixels(newSettings.gridSizeFeet);
    }
    if ('marginFeet' in newSettings) {
      updatedSettings.marginFeet = newSettings.marginFeet;
      updatedSettings.margin = convertToPixels(newSettings.marginFeet);
    }

    setWorkspaceSettings(updatedSettings);
  };

  const calculateNewTablePosition = () => {
    const gridSpacing = 220; // Space between tables
    const margin = workspaceSettings.margin; // Use workspace margin
    const maxTablesPerRow = Math.floor((workspaceSettings.width - margin * 2) / gridSpacing);

    if (tables.length === 0) {
      return { x: margin, y: margin };
    }

    const currentPosition = {
      row: Math.floor(tables.length / maxTablesPerRow),
      col: tables.length % maxTablesPerRow
    };

    return {
      x: margin + (currentPosition.col * gridSpacing),
      y: margin + (currentPosition.row * gridSpacing)
    };
  };

  const addTable = (tableType) => {
    const position = calculateNewTablePosition();
    const newTable = {
      id: Date.now().toString(),
      type: tableType,
      name: `Table ${tables.length + 1}`,
      seats: tableType === 'round' ? 8 : 
             tableType === 'square' ? 8 : 12,
      guests: Array(tableType === 'round' ? 8 : 
              tableType === 'square' ? 8 : 12).fill(null),
      position
    };
    setTables([...tables, newTable]);
  };

  const updateTableName = (tableId, newName) => {
    const updatedTables = tables.map(table =>
      table.id === tableId ? { ...table, name: newName } : table
    );
    setTables(updatedTables);
    // Update the selected table to reflect the new name
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable({ ...selectedTable, name: newName });
    }
  };

  const assignGuestToTable = (guestId, tableId, seatIndex) => {
    const guest = guests.find(g => g.id === guestId);
    const table = tables.find(t => t.id === tableId);
    
    if (guest && table) {
      // Check if the seat is empty and guest isn't already seated elsewhere
      const isGuestAlreadySeated = tables.some(t => t.guests.includes(guestId));
      const isSeatEmpty = table.guests[seatIndex] === null || table.guests[seatIndex] === undefined;
      
      if (isSeatEmpty && !isGuestAlreadySeated) {
        const updatedTables = tables.map(t => {
          if (t.id === tableId) {
            const newGuests = [...t.guests];
            newGuests[seatIndex] = guestId;
            return { ...t, guests: newGuests };
          }
          return t;
        });
        setTables(updatedTables);
      }
    }
  };

  const updateTablePosition = (tableId, position) => {
    setTables(tables.map(table => 
      table.id === tableId ? { ...table, position } : table
    ));
  };

  const removeGuestFromSeat = (tableId, seatIndex) => {
    setTables(tables.map(table => {
      if (table.id === tableId) {
        const newGuests = [...table.guests];
        newGuests[seatIndex] = null;
        return { ...table, guests: newGuests };
      }
      return table;
    }));
  };

  const addSpace = (spaceConfig) => {
    setSpaces([...spaces, spaceConfig]);
  };

  const updateSpacePosition = (spaceId, position) => {
    setSpaces(spaces.map(space => 
      space.id === spaceId ? { ...space, position } : space
    ));
  };

  const deleteSpace = (spaceId) => {
    setSpaces(spaces.filter(space => space.id !== spaceId));
  };

  const handleSaveFloorPlan = (savedPlan) => {
    // Optional: Show a success message or handle the save event
    console.log('Floor plan saved:', savedPlan.name);
  };

  const handleLoadFloorPlan = (planData) => {
    // Load all the data from the saved plan
    setGuests(planData.guests || []);
    setTables(planData.tables || []);
    setSpaces(planData.spaces || []);
    setWorkspaceSettings(planData.workspaceSettings || workspaceSettings);
  };

  const getCurrentFloorPlanData = () => {
    return {
      guests,
      tables,
      spaces,
      workspaceSettings
    };
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box
        sx={{
          py: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: 'Playfair Display',
            textAlign: 'center',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          Dan and Michelle's Wedding
        </Typography>
      </Box>
      
      <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
        <FloorPlanManager
          onSave={handleSaveFloorPlan}
          onLoad={handleLoadFloorPlan}
          currentData={getCurrentFloorPlanData()}
        />
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Paper 
              sx={{ 
                p: 3,
                height: '80vh',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper'
              }}
            >
              <GuestList 
                guests={guests} 
                onAddGuest={addGuest}
                onUpdateGuest={updateGuest}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Paper 
              sx={{ 
                p: 3,
                height: '80vh',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                overflow: 'hidden'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ mb: 2, fontWeight: 500 }}
              >
                Seating Chart
              </Typography>
              <ZoomableCanvas>
                <SeatingChart
                  tables={tables}
                  spaces={spaces}
                  guests={guests}
                  onAssignGuest={assignGuestToTable}
                  onUpdateTablePosition={updateTablePosition}
                  onUpdateSpacePosition={updateSpacePosition}
                  selectedTable={selectedTable}
                  selectedSpace={selectedSpace}
                  onSelectTable={setSelectedTable}
                  onSelectSpace={setSelectedSpace}
                  onUpdateGuest={updateGuest}
                  onRemoveGuest={removeGuestFromSeat}
                  onDeleteSpace={deleteSpace}
                  workspaceSettings={workspaceSettings}
                />
              </ZoomableCanvas>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Paper 
              sx={{ 
                p: 3,
                height: '80vh',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper'
              }}
            >
              <TableControls 
                onAddTable={addTable}
                selectedTable={selectedTable}
                selectedSpace={selectedSpace}
                tables={tables}
                spaces={spaces}
                onUpdateTables={setTables}
                onUpdateTableName={updateTableName}
                onAddSpace={addSpace}
                onUpdateSpace={updateSpacePosition}
                onDeleteSpace={deleteSpace}
                workspaceSettings={workspaceSettings}
                onUpdateWorkspaceSettings={updateWorkspaceSettings}
                onSelectTable={setSelectedTable}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Layout; 