# Integração Google Agenda e Drive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate event creation in Google Calendar and PDF archiving in Google Drive when a proposal is accepted.

**Architecture:** A dedicated `GoogleService` will handle OAuth2 token management and API interactions. Integration is optional, storing offline tokens in the `Profile` model, and triggered by the proposal acceptance flow.

**Tech Stack:** Nuxt 3, Mongoose (MongoDB), Google APIs (`googleapis`), Puppeteer.

---

### Task 1: Schema and Type Updates

**Files:**
- Modify: `server/models/Profile.ts`
- Modify: `server/models/Proposal.ts`
- Modify: `types/index.ts`

- [ ] **Step 1: Add `googleIntegration` to Profile model**

```typescript
// server/models/Profile.ts
// Add to profileSchema
googleIntegration: {
  email: String,
  accessToken: String,
  refreshToken: String,
  expiryDate: Number,
  driveFolderId: String
}
```

- [ ] **Step 2: Add `executionDate` to Proposal model**

```typescript
// server/models/Proposal.ts
// Add to proposalSchema
executionDate: { type: Date, default: null }
```

- [ ] **Step 3: Update DTO types**

```typescript
// types/index.ts
// Update ProfileDTO and ProposalDTO
export interface ProfileDTO {
  // ... existing fields
  googleIntegration?: {
    email?: string
    accessToken?: string
    refreshToken?: string
    expiryDate?: number
    driveFolderId?: string
  }
}

export interface ProposalDTO {
  // ... existing fields
  executionDate?: string | Date | null
}
```

- [ ] **Step 4: Commit schema changes**

```bash
git add server/models/Profile.ts server/models/Proposal.ts types/index.ts
git commit -m "chore: update models for google integration"
```

---

### Task 2: Implement GoogleService

**Files:**
- Create: `server/services/GoogleService.ts`
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Install googleapis**

Run: `npm install googleapis`

- [ ] **Step 2: Add OAuth credentials to nuxt.config.ts**

```typescript
// nuxt.config.ts
// Inside runtimeConfig.public or runtimeConfig
googleClientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
googleClientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
```

- [ ] **Step 3: Create GoogleService with auth and drive/calendar logic**

```typescript
// server/services/GoogleService.ts
import { google } from 'googleapis'

export const GoogleService = {
  getAuthClient(profile: any) {
    const config = useRuntimeConfig()
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/integrations/google/callback`
    )

    if (profile.googleIntegration?.refreshToken) {
      oauth2Client.setCredentials({
        access_token: profile.googleIntegration.accessToken,
        refresh_token: profile.googleIntegration.refreshToken,
        expiry_date: profile.googleIntegration.expiryDate
      })
    }

    return oauth2Client
  },

  async ensureFolder(auth: any) {
    const drive = google.drive({ version: 'v3', auth })
    const folderName = process.env.APP_NAME || 'Orcei'
    
    const res = await drive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)'
    })

    if (res.data.files?.length) return res.data.files[0].id

    const folder = await drive.files.create({
      requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id'
    })
    return folder.data.id
  },

  async uploadPdf(auth: any, folderId: string, fileName: string, buffer: Buffer) {
    const drive = google.drive({ version: 'v3', auth })
    // Using a simple buffer upload for the plan
    const res = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType: 'application/pdf', body: buffer },
      fields: 'id, webViewLink'
    })
    return res.data
  },

  async createEvent(auth: any, data: any) {
    const calendar = google.calendar({ version: 'v3', auth })
    return await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: data.summary,
        location: data.location,
        description: data.description,
        start: { dateTime: new Date(data.start).toISOString() },
        end: { dateTime: new Date(new Date(data.start).getTime() + 3600000).toISOString() },
        attachments: data.fileId ? [{ fileUrl: data.webViewLink, title: data.fileName, mimeType: 'application/pdf' }] : []
      },
      supportsAttachments: true
    })
  }
}
```

- [ ] **Step 4: Commit service**

```bash
git add server/services/GoogleService.ts nuxt.config.ts
git commit -m "feat: add GoogleService for API interactions"
```

---

### Task 3: OAuth Endpoints

**Files:**
- Create: `server/api/integrations/google/connect.get.ts`
- Create: `server/api/integrations/google/callback.get.ts`

- [ ] **Step 1: Implement connect endpoint**

```typescript
// server/api/integrations/google/connect.get.ts
import { GoogleService } from '../../../services/GoogleService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })
  
  const oauth2Client = GoogleService.getAuthClient({})
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  })
  
  return sendRedirect(event, url)
})
```

- [ ] **Step 2: Implement callback endpoint**

```typescript
// server/api/integrations/google/callback.get.ts
import { GoogleService } from '../../../services/GoogleService'
import { Profile } from '../../../models/Profile'
import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  const session = await getUserSession(event)
  if (!session?.user || !code) throw createError({ statusCode: 400 })

  const oauth2Client = GoogleService.getAuthClient({})
  const { tokens } = await oauth2Client.getToken(code as string)
  
  oauth2Client.setCredentials(tokens)
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const userInfo = await oauth2.userinfo.get()

  await Profile.findOneAndUpdate(
    { userId: (session.user as any).id },
    { 
      googleIntegration: {
        email: userInfo.data.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      }
    }
  )

  return sendRedirect(event, '/dashboard/settings?google=connected')
})
```

- [ ] **Step 3: Commit endpoints**

```bash
git add server/api/integrations/google/*.ts
git commit -m "feat: add google oauth endpoints"
```

---

### Task 4: Integration UI (Settings)

**Files:**
- Modify: `app/pages/dashboard/settings.vue`

- [ ] **Step 1: Add "Integrações" section and disconnect logic**

```vue
<!-- Modify settings.vue to add the section and disconnectGoogle function -->
```

- [ ] **Step 2: Commit UI changes**

```bash
git add app/pages/dashboard/settings.vue
git commit -m "feat: add google integration UI to settings"
```

---

### Task 5: Proposal Flow Integration

**Files:**
- Modify: `app/components/ProposalForm.vue`
- Modify: `server/services/ProposalService.ts`
- Modify: `server/utils/pdf.ts` (Ensure export)

- [ ] **Step 1: Add executionDate field to ProposalForm**

- [ ] **Step 2: Update ProposalService.acceptProposal to trigger automation**

- [ ] **Step 3: Commit flow integration**

```bash
git add app/components/ProposalForm.vue server/services/ProposalService.ts
git commit -m "feat: trigger google event creation on proposal accept"
```

---

### Verification and Testes
- [ ] Connect/Disconnect works.
- [ ] executionDate is saved.
- [ ] Proposal acceptance triggers Drive upload and Calendar event.
