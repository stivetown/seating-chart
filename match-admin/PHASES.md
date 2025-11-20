# Development Phases - Incremental Approach

## Product Management Strategy

This document outlines the incremental development approach to ensure stable deployments and maintainable code.

## Phase 1: Foundation ✅ (Current)

**Goal**: Establish multi-tenant architecture and core infrastructure

### Completed:
- ✅ Project setup (Next.js, TypeScript, Prisma)
- ✅ Multi-tenant database schema
- ✅ Security headers and robots.txt
- ✅ Flexible CSV import system
- ✅ Basic authentication structure

### Key Design Decisions:
1. **JSON-based member attributes**: Allows different clients to have completely different data schemas
2. **Tenant isolation**: Every table includes `tenantId` for row-level security
3. **Flexible column mapping**: CSV columns can map to any attribute path (supports nested paths)
4. **Import tracking**: Full audit trail of all imports

### Testing Strategy:
- Test CSV import with different column structures
- Verify tenant isolation in database queries
- Confirm security headers are working

---

## Phase 2: Core Matching (Next)

**Goal**: Implement matching algorithm and weight configuration

### Features:
- [ ] Weight configuration UI
- [ ] Matching algorithm implementation
- [ ] Group generation API
- [ ] Basic group visualization

### Incremental Steps:
1. **Week 1**: Weight configuration UI
   - Create/edit/delete matching weights
   - Support different match types (exact, range, similarity, diversity)
   - Per-tenant configuration

2. **Week 2**: Matching algorithm
   - Implement similarity calculation
   - Test with Freeda's data structure
   - Optimize for performance

3. **Week 3**: Group generation
   - API endpoint for generating groups
   - Configurable group size
   - Minimum fit score threshold

### Stability Considerations:
- Matching algorithm is pure function (easier to test)
- Weights stored in database (can be adjusted without code changes)
- Algorithm handles missing attributes gracefully

---

## Phase 3: Group Management

**Goal**: Enable viewing and managing groups

### Features:
- [ ] Group list view
- [ ] Group detail view with members
- [ ] Move members between groups
- [ ] Fit score visualization
- [ ] Unmatched members view

### Incremental Steps:
1. **Week 1**: Group viewing
   - List all groups for a tenant
   - View group details
   - Display member attributes (flexible rendering)

2. **Week 2**: Member management
   - Move members between groups
   - Remove members from groups
   - Recalculate fit scores

3. **Week 3**: Recommendations
   - Show unmatched members
   - Recommend groups for unmatched members
   - Display fit scores

### Stability Considerations:
- UI components are data-agnostic (work with any attribute structure)
- Fit scores recalculated on-demand (no stale data)
- All actions logged for history tracking

---

## Phase 4: Advanced Features

**Goal**: History tracking and polish

### Features:
- [ ] History tracking
- [ ] Undo/redo functionality
- [ ] Export capabilities
- [ ] Client-specific styling

### Incremental Steps:
1. **Week 1**: History tracking
   - Log all actions to HistoryEntry table
   - Store before/after states

2. **Week 2**: Undo/redo
   - Implement undo stack
   - Restore previous states
   - UI for history navigation

3. **Week 3**: Polish
   - Client-specific styling system
   - Export groups to CSV
   - Performance optimizations

---

## Stability Principles

### 1. Backward Compatibility
- Never remove database columns (mark as deprecated instead)
- Support old column mappings when CSV structure changes
- Version API endpoints if breaking changes needed

### 2. Graceful Degradation
- System works even if some attributes are missing
- Matching algorithm handles undefined values
- UI shows "N/A" for missing data instead of breaking

### 3. Data Validation
- Validate CSV structure before import
- Validate weight configurations
- Type checking for all API inputs

### 4. Testing Strategy
- Unit tests for matching algorithm
- Integration tests for CSV import
- Manual testing with different data schemas

### 5. Deployment Safety
- Database migrations are backward compatible
- Feature flags for new features
- Rollback plan for each deployment

---

## Multi-Tenant Considerations

### Current Implementation:
- Tenant isolation at database level
- All queries filter by `tenantId`
- Client-specific config stored in `Tenant.config` JSON field

### Future Enhancements:
- Subdomain-based routing (freeda.matchadmin.com)
- Client-specific styling from `Tenant.config`
- Feature flags per tenant
- Custom branding per tenant

---

## Risk Mitigation

### Risk: CSV structure changes break import
**Mitigation**: Flexible column mapping, no hardcoded fields

### Risk: Matching algorithm doesn't work for different data types
**Mitigation**: Support multiple match types, graceful handling of missing data

### Risk: Performance issues with large datasets
**Mitigation**: Batch processing, pagination, database indexes

### Risk: Security vulnerabilities
**Mitigation**: Security headers, authentication required, no public routes

