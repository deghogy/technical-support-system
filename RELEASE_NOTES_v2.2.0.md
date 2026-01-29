## Release v2.2.0 - UI/UX Improvements and Bug Fixes

### 🎨 UI/UX Enhancements

#### All Pages
- **Consistent max-width**: All admin pages now use `max-width: 1000px` for better readability
- **Improved color scheme**: Fixed invisible filters/buttons with proper light theme colors
- **Better card designs**: Added icons, borders, and improved spacing throughout

#### Admin Visits Page
- **New tab navigation**: Scheduled vs Recorded visits with count badges
- **Remote/On-site distinction**: Cards now show 💻 Remote (purple) or 📍 On-site (blue/green) indicators
- **Fixed button visibility**: Record Visit and Reject Visit buttons are now clearly visible
- **Tab switching**: Fixed navigation between Scheduled and Recorded tabs

#### Admin Approvals Page
- **Removed duration input**: Approval scheduling no longer requires estimated hours
- **Remote/On-site indicators**: Added visual distinction for remote support requests
- **Cleaner layout**: Better proportions and spacing

#### Admin History & Quotas Pages
- **Fixed filter visibility**: Search and filter buttons now properly styled
- **Better tables**: Improved styling with proper backgrounds and borders

#### Track Request Page
- **Fixed quota bar**: Now accurately shows used percentage
- **Better sort buttons**: Selected state uses blue color instead of white
- **Improved cards**: Better styling with status colors and icons

### 🐛 Bug Fixes

1. **Tab navigation**: Fixed visits page tabs not switching properly
2. **Location field**: Fixed "Automation - Boccard Indonesia" persisting when switching from Remote to Direct Visit
3. **Quota calculation**: Fixed percentage display on track request page
4. **Button visibility**: Fixed Record/Reject buttons not visible without hover

### 🔧 Technical Changes

- Removed `duration_hours` requirement from approval scheduling
- Actual duration now calculated from technician's recorded start/end times
- Added client-side tab component for proper navigation
- Consistent toast notification system across all forms

---

**Full Changelog**: https://github.com/deghogy/technical-support-system/compare/v2.1.0...v2.2.0
