import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

const ZoomableCanvas = ({ children }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Separate grid and content elements
  let gridElement = null;
  let contentElements = [];

  React.Children.forEach(children, child => {
    if (child.type === 'svg') {
      gridElement = child;
    } else {
      contentElements.push(child);
    }
  });

  const handleWheel = (e) => {
    e.preventDefault();
    const isZoomEvent = e.ctrlKey || e.metaKey;

    if (isZoomEvent) {
      // Handle zoom
      const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale + delta));
      
      if (newScale !== scale) {
        // Calculate cursor position relative to container
        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        // Calculate new position to zoom towards cursor
        const scaleChange = newScale - scale;
        const newX = position.x - (cursorX * scaleChange) / scale;
        const newY = position.y - (cursorY * scaleChange) / scale;

        setScale(newScale);
        setPosition({ x: newX, y: newY });
      }
    } else {
      // Handle pan with mouse wheel
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const shouldStartDrag = (e) => {
    // Check if the click target is a draggable element or its child
    const target = e.target;
    const isDraggableElement = target.closest('[draggable="true"]') ||
                              target.closest('.MuiIconButton-root') ||
                              target.closest('.draggable');
    return !isDraggableElement;
  };

  const handleMouseDown = (e) => {
    if (e.button === 0 && shouldStartDrag(e)) { // Left click only and not on draggable
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const target = e.target;
    const isDraggableElement = target.closest('[draggable="true"]') ||
                              target.closest('.MuiIconButton-root') ||
                              target.closest('.draggable');
    
    if (isDraggableElement) return;

    if (e.touches.length === 1) {
      // Single touch - start drag
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      e.currentTarget.dataset.pinchDistance = distance;
      e.currentTarget.dataset.pinchScale = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      // Single touch - drag
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      const initialDistance = parseFloat(e.currentTarget.dataset.pinchDistance);
      const initialScale = parseFloat(e.currentTarget.dataset.pinchScale);
      
      if (initialDistance && initialScale) {
        const newScale = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, initialScale * (distance / initialDistance))
        );
        setScale(newScale);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomClick = (delta) => {
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale + delta));
    setScale(newScale);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [scale, position]);

  return (
    <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', // Prevents default touch actions
          bgcolor: '#0A2A2A',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fixed Grid Layer */}
        {gridElement}

        {/* Zoomable Content Layer */}
        <Box
          sx={{
            position: 'absolute',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {contentElements}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'rgba(15, 47, 47, 0.8)',
          borderRadius: 1,
          p: 0.5
        }}
      >
        <IconButton
          size="small"
          onClick={() => handleZoomClick(ZOOM_STEP)}
          sx={{ color: '#F4F6F0' }}
          title="Zoom In"
        >
          <AddIcon />
        </IconButton>
        <Typography
          variant="caption"
          sx={{
            color: '#F4F6F0',
            textAlign: 'center',
            opacity: 0.8
          }}
        >
          {Math.round(scale * 100)}%
        </Typography>
        <IconButton
          size="small"
          onClick={() => handleZoomClick(-ZOOM_STEP)}
          sx={{ color: '#F4F6F0' }}
          title="Zoom Out"
        >
          <RemoveIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={resetView}
          sx={{ color: '#F4F6F0', mt: 1 }}
          title="Reset View"
        >
          <RestartAltIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ZoomableCanvas; 