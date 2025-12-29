# RNG App Features Documentation

## Overview

RNG App is a comprehensive Construction & Architecture ERP system built for private practitioners. It provides complete project management, entity relationship management, financial tracking, and collaboration tools specifically tailored for the AEC (Architecture, Engineering, and Construction) industry.

## System Architecture

### Technology Stack
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **Backend**: Next.js Server Actions, Firebase Functions
- **Database**: Firestore (NoSQL, document-based)
- **Authentication**: Firebase Auth with session management
- **Hosting**: Vercel/Firebase Hosting
- **File Storage**: Firebase Storage

### Core Patterns
- **Service-Repository-Action Pattern**: Strict separation of concerns
- **Tenant Isolation**: Multi-tenancy with organization-level data scoping
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Real-time Updates**: Firestore real-time subscriptions
- **Caching**: Server-side request caching with React `cache()`

## Module Overview

### MODULE 1: Entity Management (CRM) ✅ 100% Complete

**Purpose**: Manage relationships with clients, vendors, contractors, and consultants.

**Features:**
- Multi-type entity support (Client, Vendor, Contractor, Consultant)
- Contact information management
- Compliance tracking (insurance policies, certifications)
- Trade tags for categorization
- Financial terms configuration
- Rating system
- Status management (Active, Inactive, Blacklisted)
- Notes and comments

**User Flows:**

1. **Create Entity**
   - Navigate to `/entities/create`
   - Fill entity form (name, type, contact details)
   - Add compliance information (optional)
   - Set financial terms
   - Submit → Entity created with auto-generated ID

2. **View Entities**
   - Navigate to `/entities` (default card view)
   - View entities grouped by type
   - Filter by type, status
   - Sort by name, created date, type
   - Click card → View details
   - Edit icon → Edit entity
   - Delete icon → Delete entity (with confirmation)

3. **Grid View**
   - Navigate to `/entities/grid-view`
   - View all entities in sortable table
   - Export to CSV/Excel
   - Bulk operations (select multiple)

**Data Model:**
```typescript
{
  id: string,
  orgId: string,
  name: string,
  type: 'CLIENT' | 'VENDOR' | 'CONTRACTOR' | 'CONSULTANT',
  email?: string,
  phone?: string,
  address?: string,
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED',
  tags: string[],
  rating?: number,
  insurancePolicy?: {
    provider: string,
    policyNumber: string,
    expiryDate: Date,
  },
  financialTerms?: {
    paymentTerms: string,
    creditLimit: number,
  },
  createdAt: Date,
  updatedAt: Date,
}
```

### MODULE 2: Task Management (Command) ✅ 100% Complete

**Purpose**: Comprehensive task tracking with economics, time logging, and review workflows.

**Features:**
- Task creation and assignment
- Priority levels (High, Medium, Low)
- Status workflow (TODO → IN_PROGRESS → UNDER_REVIEW → DONE)
- Review-gated completion (only ADMIN/OWNER can mark DONE)
- Polymorphic resource linking (Projects, Research, Invoices, Drawings)
- Economics tracking (billable rate, cost rate, profitability)
- Time logging with duration tracking
- Progress tracking vs estimates
- Assignment and reviewer designation

**User Flows:**

1. **Create Task**
   - Navigate to `/tasks/create`
   - Fill basic info (title, priority, description)
   - Assign to team member
   - Designate reviewer (ADMIN/OWNER only)
   - Link to resource (optional)
   - Set economics (ADMIN/OWNER only)
   - Submit → Task created with TODO status

2. **View Tasks Dashboard**
   - Navigate to `/tasks`
   - View real-time statistics (Total, In Progress, Under Review, Completed)
   - Tasks grouped by status
   - Filter by status, priority
   - Sort by title, priority, created date
   - Click card → View details
   - Edit icon → Edit task
   - Delete icon → Delete task

3. **Work on Task**
   - Open task
   - Start work → Status changes to IN_PROGRESS
   - Log time spent
   - Submit for review → Status changes to UNDER_REVIEW
   - Reviewer approves → Status changes to DONE

4. **Review Task**
   - View tasks UNDER_REVIEW
   - Review submission notes
   - Approve → Mark as DONE
   - Request changes → Status to CHANGES_REQUESTED

**Data Model:**
```typescript
{
  id: string,
  orgId: string,
  title: string,
  description?: string,
  status: TaskStatus,
  priority: 'LOW' | 'MEDIUM' | 'HIGH',
  assignedTo?: string,
  reviewerId?: string,
  resourceType: 'GENERAL' | 'PROJECT' | 'RESEARCH' | 'INVOICE' | 'DRAWING',
  resourceId?: string,
  estimatedMinutes: number,
  billableRate: number,
  costRate: number,
  timeLogs: TimeLog[],
  submissionNotes?: string,
  createdAt: Date,
  updatedAt: Date,
}
```

**Economics Calculation:**
```typescript
totalCost = (actualMinutes / 60) * costRate
totalRevenue = (actualMinutes / 60) * billableRate
profitability = totalRevenue - totalCost
margin = profitability / totalRevenue
```

### MODULE 3: Smart Suggestions ⚠️ Not Started

**Purpose**: AI-powered suggestions for research items based on project phase and requirements.

**Planned Features:**
- Analyze project phase (Pre-design, Schematic, Design Dev, Construction)
- Suggest relevant materials and specifications
- Recommend vendors based on project type
- Cost estimation based on historical data
- Integration with research library

**Planned User Flows:**

1. **Get Suggestions**
   - Open project
   - View "Suggested Materials" section
   - Filter by category (Structural, Electrical, Plumbing, etc.)
   - Add to project specification
   - Save to research library

### MODULE 4: Project Management (Nexus) 🟡 60% Complete

**Purpose**: Comprehensive project lifecycle management for construction/architecture projects.

**Current Status:**
- ✅ Data models defined
- ✅ Repository implemented
- ✅ Service layer complete
- ❌ Actions layer missing
- ❌ UI not implemented

**Planned Features:**
- AIA project phases tracking
- Budget management and tracking
- Address and location management
- Project timeline (Gantt charts)
- Team assignment
- Document association
- Progress tracking
- Client/Stakeholder management

**Data Model:**
```typescript
{
  id: string,
  orgId: string,
  name: string,
  clientId: string,
  address: Address,
  phase: AIAPhase,
  budget: {
    estimated: number,
    actual: number,
    remaining: number,
  },
  startDate: Date,
  endDate: Date,
  team: TeamMember[],
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
  createdAt: Date,
  updatedAt: Date,
}
```

### MODULE 5: Smart Docs (Document Generation) ⚠️ Not Started

**Purpose**: Auto-generate construction documents, valuations, and UC certificates.

**Planned Features:**
- Valuation certificate generation
- UC (Utilization Certificate) generation
- Invoice generation with itemization
- Custom PDF templates
- Digital signatures
- Version control
- Template management

**Planned Document Types:**
- Payment certificates
- Change orders
- Progress reports
- Completion certificates
- Inspection reports

### MODULE 6: Financial Core ⚠️ Not Started

**Purpose**: Complete financial management system for construction projects.

**Planned Features:**
- Invoice creation and tracking
- Payment collection
- Expense tracking
- Budget vs Actual reporting
- Cash flow projection
- Profit & Loss statements
- Tax calculations
- Multi-currency support

**Planned Data Models:**
```typescript
Invoice {
  id, orgId, projectId,
  invoiceNumber, date, dueDate,
  lineItems: LineItem[],
  subtotal, tax, total,
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
  paymentDate?,
}

Transaction {
  id, orgId, invoiceId?,
  type: 'INCOME' | 'EXPENSE',
  amount, date, description,
  category, paymentMethod,
}
```

### MODULE 7: Drawing Vault ⚠️ Not Started

**Purpose**: Version-controlled storage and management of construction drawings.

**Planned Features:**
- Drawing upload and versioning
- Issue tracking (A, B, C revisions)
- Drawing sets
- Markup and comments
- Compare versions
- Access control
- Download/Print
- Integration with projects

**Planned Data Model:**
```typescript
DrawingIssue {
  id, orgId, projectId,
  drawingNumber, title,
  version, issueDate,
  fileUrl, fileSize,
  issuedBy, reviewedBy,
  status: 'DRAFT' | 'ISSUED' | 'SUPERSEDED',
  previousVersion?,
}
```

### MODULE 8: Picture Reach (Marketing) ⚠️ Not Started

**Purpose**: Marketing asset management with watermarking and portfolio generation.

**Planned Features:**
- Image upload and organization
- Dynamic watermarking
- Portfolio generation
- Client-specific galleries
- Public/Private sharing
- Before/After comparisons
- Social media integration

### MODULE 9: Research & Development Lab 🟡 60% Complete

**Purpose**: Material and specification research library.

**Current Status:**
- ✅ Data models defined
- ✅ Repository implemented
- ✅ Service layer complete
- ❌ Actions layer missing
- ❌ UI not implemented

**Planned Features:**
- Material database (CSI categorization)
- Cost per unit tracking
- Reference images
- Vendor linking
- Specification sheets
- Historical data
- Search and filtering

**Data Model:**
```typescript
{
  id: string,
  orgId: string,
  name: string,
  csiCategory: string,
  costPerUnit: number,
  unit: string,
  vendorId?: string,
  referenceImages: string[],
  specifications?: string,
  notes?: string,
  createdAt: Date,
  updatedAt: Date,
}
```

## Cross-Cutting Features

### Authentication & Authorization

**Features:**
- Email/Password authentication
- Session management (Redis-backed)
- Role-based access control (RBAC)
- Organization-level permissions
- User roles: OWNER, ADMIN, MEMBER

**Permissions:**
- OWNER: Full control, can transfer ownership
- ADMIN: Can manage members, view economics, mark tasks as DONE
- MEMBER: Basic CRUD on assigned resources

### Organization Management

**Features:**
- Multi-tenant architecture
- Organization creation and management
- Member invitations
- Role assignment
- Ownership transfer
- Seat limits based on subscription
- Organization settings

### Audit & Compliance

**Features:**
- Audit log for all actions
- User activity tracking
- Data change history
- Export audit reports
- Compliance dashboard

### Notifications

**Features:**
- In-app notifications
- Email notifications
- Task assignments
- Deadline reminders
- System announcements

### Search & Filtering

**Features:**
- Global search across all modules
- Advanced filters
- Saved searches
- Recent items
- Quick actions

### Reporting & Analytics

**Features:**
- Dashboard with key metrics
- Custom reports
- Data export (CSV, Excel, PDF)
- Visual charts and graphs
- Trend analysis

## Integration Points

### Between Modules

1. **Tasks ↔ Projects**
   - Tasks can be linked to projects
   - Project tasks appear in task list
   - Project progress from task completion

2. **Entities ↔ Projects**
   - Projects link to client entities
   - Contractors assigned to projects
   - Vendor relationships

3. **Tasks ↔ Economics**
   - Task time logs feed into profitability
   - Cost tracking per task
   - Revenue calculation

4. **Documents ↔ Projects**
   - Documents attached to projects
   - Auto-generation from project data
   - Version control

## User Roles & Permissions Matrix

| Feature | OWNER | ADMIN | MEMBER |
|---------|-------|-------|--------|
| Create/Edit Entities | ✅ | ✅ | ✅ |
| Delete Entities | ✅ | ✅ | ❌ |
| Create/Edit Tasks | ✅ | ✅ | ✅ (own) |
| View Task Economics | ✅ | ✅ | ❌ |
| Mark Task as DONE | ✅ | ✅ | ❌ |
| Invite Members | ✅ | ✅ | ❌ |
| Manage Roles | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ |
| Transfer Ownership | ✅ | ❌ | ❌ |

## Performance Characteristics

### Response Times (Target)
- Page load: < 2s
- Form submission: < 1s
- Search results: < 500ms
- Data table render: < 1s for 1000 rows

### Scalability
- Supports 50+ concurrent users per organization
- Handles 10,000+ entities per organization
- Firestore auto-scaling for growing datasets
- CDN-cached static assets

### Offline Support
- Coming in Phase 2
- Local caching with IndexedDB
- Sync when connection restored

## Security Features

### Data Protection
- Encryption at rest (Firestore)
- Encryption in transit (HTTPS)
- Tenant isolation (no cross-org access)
- Soft delete with recovery

### Access Control
- Role-based permissions
- Row-level security
- API rate limiting
- Session timeout

### Compliance
- GDPR-ready (data export, deletion)
- Audit trails
- Privacy controls
- Data retention policies

## Roadmap Summary

### Phase 1: Foundation ✅ COMPLETE
- Core infrastructure
- Entity management
- Task management
- Authentication & Authorization

### Phase 2: Project Core 🚧 IN PROGRESS
- Complete Projects module (actions + UI)
- Complete Research module (actions + UI)
- Drawing vault
- Document generation

### Phase 3: Financial 📅 PLANNED Q1 2026
- Invoicing system
- Payment tracking
- Financial reports
- Budget management

### Phase 4: Intelligence 📅 PLANNED Q2 2026
- Smart suggestions
- AI-powered insights
- Predictive analytics
- Automated workflows

### Phase 5: Advanced Features 📅 PLANNED Q3-Q4 2026
- Mobile apps
- Offline mode
- Advanced reporting
- Third-party integrations

## Support & Resources

- **Documentation**: `/docs/*`
- **API Reference**: Coming soon
- **Video Tutorials**: Coming soon
- **Community**: Discord server
- **Support Email**: support@rng-app.com

## Version History

### v1.0.0 (Current)
- Entity management (100%)
- Task management (100%)
- Core infrastructure (100%)
- Authentication & RBAC (100%)

### v0.9.0 (Pre-release)
- Project models (60%)
- Research models (60%)
- Initial UI system
- Form engine

---

Last Updated: December 29, 2025
