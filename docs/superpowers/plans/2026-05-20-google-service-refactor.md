# Google Service Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve GoogleService by adding token refresh persistence, optimizing drive folder management, increasing type safety, and robust error handling.

**Architecture:** Use `googleapis` library. Enhance `GoogleService` with event listeners for token refreshes and improved folder verification logic.

**Tech Stack:** TypeScript, Google APIs, Nuxt/Nitro.

---

### Task 1: Type Safety and Error Handling Foundation

**Files:**
- Modify: `server/services/GoogleService.ts`

- [ ] **Step 1: Define GoogleEventData interface and update method signatures**

```typescript
export interface GoogleEventData {
  summary: string
  location?: string
  description?: string
  start: string | Date
  fileId?: string
  webViewLink?: string
  fileName?: string
}

// Update createEvent signature:
// async createEvent(auth: any, data: GoogleEventData)
```

- [ ] **Step 2: Add try/catch blocks to existing methods for better logging**

Wrap `ensureFolder`, `uploadPdf`, and `createEvent` in `try/catch` blocks. Log errors using `console.error` with descriptive messages.

- [ ] **Step 3: Commit**

```bash
git add server/services/GoogleService.ts
git commit -m "refactor(google): add type safety and basic error handling"
```

### Task 2: Token Refresh Persistence

**Files:**
- Modify: `server/services/GoogleService.ts`
- Modify: `server/models/Profile.ts` (Import if needed for type, but we'll use Mongoose model)

- [ ] **Step 1: Update getAuthClient to handle token refreshes**

Add a listener to `oauth2Client` to update the `Profile` in the database when new tokens are issued.

```typescript
  getAuthClient(profile: any) {
    const config = useRuntimeConfig()
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      `${config.public.siteUrl}/api/integrations/google/callback`
    )

    if (profile.googleIntegration?.refreshToken) {
      oauth2Client.setCredentials({
        access_token: profile.googleIntegration.accessToken,
        refresh_token: profile.googleIntegration.refreshToken,
        expiry_date: profile.googleIntegration.expiryDate
      })
    }

    // Add token refresh listener
    oauth2Client.on('tokens', async (tokens) => {
      try {
        const updateData: any = {}
        if (tokens.access_token) updateData['googleIntegration.accessToken'] = tokens.access_token
        if (tokens.expiry_date) updateData['googleIntegration.expiryDate'] = tokens.expiry_date
        
        if (Object.keys(updateData).length > 0) {
          const { Profile } = await import('../models/Profile')
          await Profile.findByIdAndUpdate(profile._id, { $set: updateData })
          console.log(`[GoogleService] Tokens refreshed and saved for profile: ${profile._id}`)
        }
      } catch (error) {
        console.error(`[GoogleService] Failed to save refreshed tokens for profile: ${profile._id}`, error)
      }
    })

    return oauth2Client
  },
```

- [ ] **Step 2: Commit**

```bash
git add server/services/GoogleService.ts
git commit -m "feat(google): implement token refresh persistence"
```

### Task 3: Optimize Drive Folder Management

**Files:**
- Modify: `server/services/GoogleService.ts`

- [ ] **Step 1: Update ensureFolder to verify existing folder ID**

If `profile.googleIntegration.driveFolderId` exists, verify it first. If it's valid, return it. If not, search by name or create it.

```typescript
  async ensureFolder(auth: any, profile: any) {
    try {
      const drive = google.drive({ version: 'v3', auth })
      
      // 1. Check if we already have a folder ID in profile
      if (profile.googleIntegration?.driveFolderId) {
        try {
          const folder = await drive.files.get({
            fileId: profile.googleIntegration.driveFolderId,
            fields: 'id, trashed'
          })
          if (folder.data && !folder.data.trashed) {
            return folder.data.id
          }
        } catch (e) {
          // Folder doesn't exist or no access, fall through to search/create
          console.warn(`[GoogleService] Stored folder ID ${profile.googleIntegration.driveFolderId} is invalid, searching...`)
        }
      }

      const config = useRuntimeConfig()
      const folderName = config.appName || 'Orcei'
      
      // 2. Search by name
      const res = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)'
      })

      let folderId: string | undefined

      if (res.data.files?.length) {
        folderId = res.data.files[0].id
      } else {
        // 3. Create new folder
        const folder = await drive.files.create({
          requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
          fields: 'id'
        })
        folderId = folder.data.id
      }

      // 4. Update profile with new/found folderId
      if (folderId && folderId !== profile.googleIntegration?.driveFolderId) {
        const { Profile } = await import('../models/Profile')
        await Profile.findByIdAndUpdate(profile._id, {
          $set: { 'googleIntegration.driveFolderId': folderId }
        })
      }

      return folderId
    } catch (error) {
      console.error('[GoogleService] ensureFolder failed:', error)
      throw error
    }
  },
```

- [ ] **Step 2: Update callers of ensureFolder**

I need to check where `ensureFolder` is called to ensure `profile` is passed.

- [ ] **Step 3: Commit**

```bash
git add server/services/GoogleService.ts
git commit -m "feat(google): optimize drive folder management"
```
