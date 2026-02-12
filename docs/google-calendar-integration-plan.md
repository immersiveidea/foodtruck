# Plan: Google Calendar Integration

## Overview
Integrate Google Calendar with the booking system to:
1. Create tentative calendar events when bookings are submitted
2. Update events to confirmed when admin approves
3. Display confirmed events on the public schedule page
4. Provide self-service OAuth setup for the business owner

---

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Booking Form   │─────▶│  POST /bookings  │─────▶│ Google Calendar │
│  (Customer)     │      │  Creates KV +    │      │ (Tentative)     │
└─────────────────┘      │  Calendar Event  │      └─────────────────┘
                         └──────────────────┘
                                                          │
┌─────────────────┐      ┌──────────────────┐             ▼
│  Admin Confirm  │─────▶│ POST /bookings   │─────▶ Update to Confirmed
│  (Dashboard)    │      │ Updates status   │
└─────────────────┘      └──────────────────┘

┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Schedule Page  │◀─────│ GET /schedule    │◀─────│ Google Calendar │
│  (Public)       │      │ Fetches events   │      │ (Confirmed)     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

---

## OAuth Self-Service Flow

### Admin Setup Flow
1. Admin goes to Admin Dashboard → new "Settings" tab
2. Clicks "Connect Google Calendar"
3. Redirected to Google OAuth consent screen
4. Grants calendar access permissions
5. Redirected back with auth code
6. Backend exchanges code for tokens, stores in KV
7. Admin selects which calendar to use from dropdown
8. Calendar ID stored in KV

### Token Storage (KV)
```typescript
// Key: 'google_oauth'
{
  access_token: string
  refresh_token: string
  expiry_date: number
  calendar_id: string  // Selected calendar
}
```

---

## Data Structures

### Updated BookingRequest
```typescript
interface BookingRequest {
  // ... existing fields ...
  googleEventId?: string  // Added: Google Calendar event ID
}
```

### Calendar Event Mapping
```typescript
// BookingRequest → Google Calendar Event
{
  summary: `${eventType} - ${name}`,
  description: `Guest Count: ${guestCount}\nPhone: ${phone}\nEmail: ${email}\n${message}`,
  location: `${location}, ${address}`,
  start: { dateTime: eventDate + 'T' + parseTime(eventTime).start },
  end: { dateTime: eventDate + 'T' + parseTime(eventTime).end },
  status: booking.status === 'confirmed' ? 'confirmed' : 'tentative',
  colorId: booking.status === 'pending' ? '5' : '10'  // Yellow/Green
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `functions/api/admin/google/auth.ts` | OAuth initiation - returns Google auth URL |
| `functions/api/admin/google/callback.ts` | OAuth callback - exchanges code for tokens |
| `functions/api/admin/google/calendars.ts` | List available calendars for selection |
| `functions/api/admin/google/status.ts` | Check connection status |
| `functions/api/admin/google/disconnect.ts` | Remove OAuth tokens |
| `functions/lib/google-calendar.ts` | Shared Google Calendar API helpers |

## Files to Modify

| File | Changes |
|------|---------|
| `functions/api/bookings.ts` | Add calendar event on booking submission |
| `functions/api/admin/bookings.ts` | Update calendar event on status change |
| `functions/api/schedule.ts` | Fetch confirmed events from Google Calendar |
| `src/types/index.ts` | Add `googleEventId` to BookingRequest |
| `src/pages/AdminPage.vue` | Add Settings tab with OAuth UI |

---

## Implementation Steps

### Phase 1: Google Cloud Setup (Manual)
1. Create Google Cloud project
2. Enable Google Calendar API
3. Configure OAuth consent screen (external, testing mode)
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://{domain}/api/admin/google/callback`
6. Store credentials as environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

### Phase 2: OAuth Endpoints

**GET /api/admin/google/auth**
- Generates Google OAuth URL with calendar scopes
- Returns URL for frontend to redirect to

**GET /api/admin/google/callback**
- Receives auth code from Google
- Exchanges for access/refresh tokens
- Stores tokens in KV
- Redirects to admin page with success message

**GET /api/admin/google/calendars**
- Lists calendars user has access to
- Returns array of { id, summary, primary }

**POST /api/admin/google/calendars**
- Saves selected calendar_id to KV

**GET /api/admin/google/status**
- Returns connection status and selected calendar

**POST /api/admin/google/disconnect**
- Removes OAuth tokens from KV

### Phase 3: Calendar Helper Library

Create `functions/lib/google-calendar.ts`:
```typescript
// Core functions
getAccessToken(env)     // Gets valid token, refreshes if needed
createEvent(env, event) // Creates calendar event
updateEvent(env, eventId, updates) // Updates event
deleteEvent(env, eventId) // Deletes event
listEvents(env, timeMin, timeMax) // Lists events in range
```

### Phase 4: Booking Integration

**Modify `functions/api/bookings.ts`:**
- After saving booking to KV, create tentative calendar event
- Store `googleEventId` in booking record
- Handle gracefully if calendar not connected

**Modify `functions/api/admin/bookings.ts`:**
- On status change to 'confirmed': update event status
- On status change to 'denied': delete or cancel event
- Update event if admin notes change

### Phase 5: Public Schedule from Calendar

**Modify `functions/api/schedule.ts`:**
- If Google Calendar connected:
  - Fetch confirmed events for next 30 days
  - Transform to ScheduleLocation format
  - Merge with any manual schedule entries (if desired)
- If not connected: fall back to KV schedule data

### Phase 6: Admin UI

**Add to AdminPage.vue:**
- New "Settings" tab
- Google Calendar connection section:
  - "Connect" button (if not connected)
  - Calendar dropdown (if connected)
  - "Disconnect" button
  - Connection status indicator

---

## Environment Variables

Add to Cloudflare Pages:
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/admin/google/callback
```

---

## API Contracts

**GET /api/admin/google/auth**
```typescript
// Response
{ url: string }  // Google OAuth URL to redirect to
```

**GET /api/admin/google/callback**
```typescript
// Query params from Google
?code=xxx&scope=xxx

// Response: Redirect to /admin?google=connected
```

**GET /api/admin/google/calendars**
```typescript
// Response
{
  calendars: Array<{ id: string, summary: string, primary: boolean }>,
  selected?: string  // Currently selected calendar ID
}
```

**POST /api/admin/google/calendars**
```typescript
// Request
{ calendarId: string }

// Response
{ success: true }
```

**GET /api/admin/google/status**
```typescript
// Response
{
  connected: boolean,
  calendarId?: string,
  calendarName?: string
}
```

---

## Error Handling

- **OAuth fails**: Show error message, allow retry
- **Token expired**: Auto-refresh using refresh_token
- **Refresh fails**: Mark as disconnected, prompt re-auth
- **Calendar API fails**: Log error, continue with KV fallback
- **Rate limits**: Queue requests, retry with backoff

---

## Security Considerations

- OAuth tokens stored encrypted in KV (using environment secret)
- Refresh tokens never exposed to frontend
- All Google API calls server-side only
- Admin authentication required for all OAuth endpoints

---

## Verification

1. **OAuth Flow**:
   - Click Connect → redirects to Google
   - Authorize → returns to admin with success
   - Calendar dropdown populates

2. **Booking Creates Event**:
   - Submit booking form
   - Check Google Calendar for tentative event

3. **Confirmation Updates Event**:
   - Confirm booking in admin
   - Check Google Calendar shows confirmed

4. **Public Schedule Shows Events**:
   - Visit homepage
   - Confirmed events appear in schedule section

5. **Disconnect Works**:
   - Click Disconnect
   - OAuth tokens removed
   - Falls back to manual schedule
