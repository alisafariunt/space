# JWT Authentication System - Testing Guide

This document provides a comprehensive testing checklist for the JWT-based authentication system. Test all scenarios before deploying to production.

## Pre-Testing Setup

### Required Environment Variables
Ensure the following are set in your Vercel Dashboard:
- `JWT_SECRET` - Randomly generated secret key
- `JWT_ACCESS_EXPIRY` - Set to `30m`
- `JWT_REFRESH_EXPIRY` - Set to `30d`
- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso authentication token
- `ALLOWED_ORIGINS` - Your domain(s)

### Test Environment
- [ ] Confirm deployment is successful
- [ ] Verify browser console shows no script loading errors
- [ ] Check that all JavaScript files load correctly (`toast.js`, `auth.js`, `sync.js`, `highlights.js`)

---

## Test Scenarios

### 1. Login Flow

#### 1.1 New User Registration
- [ ] Navigate to any course page (6480 or 6670)
- [ ] Login modal appears automatically on page load
- [ ] Enter a new email address and password
- [ ] Click "Login/Register" button
- [ ] **Expected**: Success toast notification appears
- [ ] **Expected**: Modal closes automatically
- [ ] **Expected**: User credentials are stored in database
- [ ] **Expected**: JWT tokens are stored in localStorage

#### 1.2 Existing User Login
- [ ] Clear localStorage to simulate logged-out state
- [ ] Navigate to course page
- [ ] Login modal appears
- [ ] Enter existing email and password
- [ ] Click "Login/Register" button
- [ ] **Expected**: Success toast notification appears
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Existing highlights are restored

#### 1.3 Invalid Credentials
- [ ] Enter incorrect email or password format
- [ ] **Expected**: Error toast notification shows validation error
- [ ] **Expected**: Modal remains open
- [ ] **Expected**: No database changes occur

---

### 2. Token Refresh

#### 2.1 Automatic Token Refresh
- [ ] Login successfully
- [ ] Wait for access token to approach expiration (test by setting short expiry like 1 minute)
- [ ] Make a sync operation (add a highlight)
- [ ] **Expected**: Token refresh happens automatically in background
- [ ] **Expected**: Sync operation completes successfully
- [ ] **Expected**: No user interruption or re-login required

#### 2.2 Token Refresh Failure
- [ ] Manually corrupt refresh token in localStorage
- [ ] Attempt to make a sync operation
- [ ] **Expected**: User is logged out
- [ ] **Expected**: Login modal appears again
- [ ] **Expected**: Error toast notification appears

---

### 3. Session Timeout

#### 3.1 30-Minute Inactivity Timeout
- [ ] Login successfully
- [ ] Wait for 30 minutes without any interaction
- [ ] Attempt to interact with the page (add highlight)
- [ ] **Expected**: Session expires
- [ ] **Expected**: Login modal appears
- [ ] **Expected**: Warning toast notification about session timeout

#### 3.2 Session Extension
- [ ] Login successfully
- [ ] Perform periodic interactions (scroll, click, highlight)
- [ ] **Expected**: Session remains active
- [ ] **Expected**: No unexpected logouts

---

### 4. Logout

#### 4.1 Manual Logout
- [ ] Login successfully
- [ ] Use logout functionality (if implemented)
- [ ] **Expected**: Tokens are removed from localStorage
- [ ] **Expected**: User is redirected to login
- [ ] **Expected**: Success toast notification appears

#### 4.2 Logout Across Tabs
- [ ] Open same site in two tabs
- [ ] Login in one tab
- [ ] **Expected**: Both tabs should have same session
- [ ] Logout in one tab
- [ ] **Expected**: Other tab also reflects logged-out state

---

### 5. Highlight Sync with New Auth System

#### 5.1 Create Highlight
- [ ] Login successfully
- [ ] Highlight text on a course page
- [ ] **Expected**: Highlight is saved locally
- [ ] **Expected**: Highlight is synced to database via authenticated API
- [ ] **Expected**: Success toast appears (if configured)

#### 5.2 Restore Highlights
- [ ] Login with account that has saved highlights
- [ ] Navigate to page with highlights
- [ ] **Expected**: Highlights are restored from database
- [ ] **Expected**: Highlights appear correctly on the page
- [ ] **Expected**: Highlight positions match original locations

#### 5.3 Delete Highlight
- [ ] Click on an existing highlight to remove it
- [ ] **Expected**: Highlight is removed from page
- [ ] **Expected**: Deletion is synced to database
- [ ] **Expected**: Highlight does not reappear on page refresh

---

### 6. Cross-Device Sync

#### 6.1 Sync from Device A to Device B
- [ ] Login on Device A
- [ ] Create highlights on Device A
- [ ] Login on Device B with same credentials
- [ ] Navigate to same pages
- [ ] **Expected**: Highlights from Device A appear on Device B
- [ ] **Expected**: Sync happens automatically on login

#### 6.2 Bidirectional Sync
- [ ] Create highlights on Device A
- [ ] Create different highlights on Device B (same page)
- [ ] Refresh both devices
- [ ] **Expected**: Both devices show all highlights from both sources
- [ ] **Expected**: No highlights are lost or duplicated

---

### 7. Error Handling

#### 7.1 Network Errors
- [ ] Login successfully
- [ ] Disable network connection
- [ ] Attempt to sync highlight
- [ ] **Expected**: Error toast notification appears
- [ ] **Expected**: Highlight is saved locally (if possible)
- [ ] **Expected**: Graceful error message, no crashes

#### 7.2 Invalid Tokens
- [ ] Manually corrupt access token in localStorage
- [ ] Attempt to sync operation
- [ ] **Expected**: System attempts token refresh
- [ ] **Expected**: If refresh fails, user is logged out
- [ ] **Expected**: Appropriate error messages shown

#### 7.3 Database Errors
- [ ] Simulate database connection issue (if possible)
- [ ] Attempt to login or sync
- [ ] **Expected**: Error toast notification appears
- [ ] **Expected**: User receives clear error message
- [ ] **Expected**: System handles error gracefully

#### 7.4 Server Errors (500)
- [ ] Identify an API endpoint
- [ ] Force a 500 error (by modifying backend temporarily)
- [ ] **Expected**: Error toast shows "Server error, please try again"
- [ ] **Expected**: User can retry operation
- [ ] **Expected**: No permanent data loss

---

### 8. Toast Notifications

#### 8.1 Success Notifications
- [ ] Login successfully
- [ ] **Expected**: Green success toast appears
- [ ] **Expected**: Toast auto-closes after timeout
- [ ] **Expected**: Toast is positioned correctly

#### 8.2 Error Notifications
- [ ] Trigger an error (invalid login, network error, etc.)
- [ ] **Expected**: Red error toast appears
- [ ] **Expected**: Error message is clear and actionable
- [ ] **Expected**: Toast auto-closes or has close button

#### 8.3 Warning Notifications
- [ ] Trigger a warning scenario (session timeout, etc.)
- [ ] **Expected**: Yellow/orange warning toast appears
- [ ] **Expected**: Toast provides helpful context

#### 8.4 Info Notifications
- [ ] Trigger an info scenario
- [ ] **Expected**: Blue info toast appears
- [ ] **Expected**: Toast provides useful information

#### 8.5 Multiple Toasts
- [ ] Trigger multiple notifications in quick succession
- [ ] **Expected**: Toasts stack vertically
- [ ] **Expected**: Each toast is readable
- [ ] **Expected**: No overlapping or visual glitches

---

## Browser Compatibility Testing

Test in the following browsers:

### Desktop Browsers
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari iOS (iPhone)
- [ ] Chrome Android
- [ ] Samsung Internet

---

## Security Testing

### Authentication Security
- [ ] Verify JWT tokens are not exposed in URLs
- [ ] Confirm tokens are stored securely in localStorage
- [ ] Check that all API requests include authentication headers
- [ ] Verify expired tokens are rejected by server
- [ ] Confirm refresh tokens are httpOnly (if using cookies)

### XSS Protection
- [ ] Test input fields for script injection
- [ ] **Expected**: Scripts are sanitized
- [ ] **Expected**: No code execution from user input

### CORS Configuration
- [ ] Test requests from unauthorized origins
- [ ] **Expected**: Requests are blocked
- [ ] Test requests from allowed origins
- [ ] **Expected**: Requests succeed

---

## Performance Testing

- [ ] Measure page load time with auth scripts
- [ ] **Expected**: No significant performance degradation
- [ ] Check for memory leaks during long sessions
- [ ] **Expected**: No memory buildup
- [ ] Test highlight sync with large datasets (100+ highlights)
- [ ] **Expected**: Sync completes in reasonable time

---

## Final Deployment Checklist

Before deploying to production:

- [ ] All test scenarios pass
- [ ] No console errors in browser
- [ ] Environment variables are set correctly in Vercel
- [ ] `.env.example` is committed (without actual values)
- [ ] `TESTING.md` is reviewed and up to date
- [ ] All duplicate files are removed (`6480/js/sync.js`, `6480/js/highlights.js`)
- [ ] HTML script paths are absolute (`/js/...` not `../js/...`)
- [ ] Script load order is correct (toast → auth → course-loader → sync → highlights)
- [ ] Database migrations are complete (if any)
- [ ] Backup of production database is created
- [ ] Rollback plan is documented

---

## Reporting Issues

If you encounter issues during testing:

1. **Note the exact steps to reproduce**
2. **Capture browser console logs**
3. **Check network tab for failed requests**
4. **Document expected vs. actual behavior**
5. **Include browser version and OS**
6. **Screenshot the error if visual**

---

## Post-Deployment Monitoring

After deployment:

- [ ] Monitor server logs for authentication errors
- [ ] Track failed login attempts
- [ ] Monitor token refresh rates
- [ ] Check for unusual database activity
- [ ] Verify highlight sync success rate
- [ ] Monitor toast notification frequency

---

## Rollback Procedure

If critical issues are found after deployment:

1. Revert to previous deployment in Vercel
2. Restore previous HTML script paths (relative paths)
3. Restore duplicate files if needed
4. Investigate issue in staging environment
5. Fix and re-test before re-deploying

---

**Testing completed by**: _________________  
**Date**: _________________  
**All tests passed**: ☐ Yes  ☐ No  
**Notes**: _________________________________________________
