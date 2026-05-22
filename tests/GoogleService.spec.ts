import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleService } from '../server/services/GoogleService'

// Mock googleapis using vi.hoisted to avoid hoisting issues
const { mockFilesGet, mockFilesList, mockFilesCreate, mockEventsInsert, mockSetCredentials, mockOn } = vi.hoisted(() => ({
  mockFilesGet: vi.fn(),
  mockFilesList: vi.fn(),
  mockFilesCreate: vi.fn(),
  mockEventsInsert: vi.fn(),
  mockSetCredentials: vi.fn(),
  mockOn: vi.fn()
}))

vi.mock('googleapis', () => {
  class OAuth2 {
    setCredentials = mockSetCredentials
    on = mockOn
  }
  return {
    google: {
      auth: {
        OAuth2
      },
      drive: vi.fn().mockReturnValue({
        files: {
          get: mockFilesGet,
          list: mockFilesList,
          create: mockFilesCreate
        }
      }),
      calendar: vi.fn().mockReturnValue({
        events: {
          insert: mockEventsInsert
        }
      })
    }
  }
})

// Mocks for Profile
vi.mock('../server/models/Profile', () => ({
  Profile: {
    findByIdAndUpdate: vi.fn()
  }
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  googleClientId: 'client-id',
  googleClientSecret: 'client-secret',
  public: { siteUrl: 'https://test.com' },
  appName: 'Orcei Fácil'
}))

import { google } from 'googleapis'
import { Profile } from '../server/models/Profile'

describe('GoogleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuthClient', () => {
    it('should create an OAuth2 client with provided credentials', () => {
      const profile = {
        _id: 'prof-id',
        googleIntegration: {
          accessToken: 'access',
          refreshToken: 'refresh',
          expiryDate: 123456789
        }
      }

      const client = GoogleService.getAuthClient(profile)
      
      expect(client.setCredentials).toHaveBeenCalledWith({
        access_token: 'access',
        refresh_token: 'refresh',
        expiry_date: 123456789
      })
    })
  })

  describe('ensureFolder', () => {
    const auth = {}
    const profile = { _id: 'prof-id', googleIntegration: {} }

    it('should return existing folder ID if valid', async () => {
      const profileWithFolder = {
        ...profile,
        googleIntegration: { driveFolderId: 'existing-id' }
      }
      mockFilesGet.mockResolvedValue({ data: { id: 'existing-id', trashed: false } })

      const folderId = await GoogleService.ensureFolder(auth, profileWithFolder)

      expect(folderId).toBe('existing-id')
      expect(mockFilesGet).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'existing-id' }))
    })

    it('should search and return folder ID if not in profile but exists in Drive', async () => {
      mockFilesList.mockResolvedValue({ data: { files: [{ id: 'found-id' }] } })

      const folderId = await GoogleService.ensureFolder(auth, profile)

      expect(folderId).toBe('found-id')
      expect(mockFilesList).toHaveBeenCalledWith(expect.objectContaining({
        q: "name = 'Orcei Fácil' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
      }))
      expect(Profile.findByIdAndUpdate).toHaveBeenCalledWith('prof-id', expect.objectContaining({
        $set: { 'googleIntegration.driveFolderId': 'found-id' }
      }))
    })

    it('should create folder if not found', async () => {
      mockFilesList.mockResolvedValue({ data: { files: [] } })
      mockFilesCreate.mockResolvedValue({ data: { id: 'new-id' } })

      const folderId = await GoogleService.ensureFolder(auth, profile)

      expect(folderId).toBe('new-id')
      expect(mockFilesCreate).toHaveBeenCalledWith(expect.objectContaining({
        requestBody: { name: 'Orcei Fácil', mimeType: 'application/vnd.google-apps.folder' }
      }))
    })
  })

  describe('uploadPdf', () => {
    it('should upload a PDF buffer to the specified folder', async () => {
      const auth = {}
      const buffer = Buffer.from('test pdf content')
      mockFilesCreate.mockResolvedValue({ data: { id: 'file-id', webViewLink: 'link' } })

      const result = await GoogleService.uploadPdf(auth, 'folder-id', 'test.pdf', buffer)

      expect(result.id).toBe('file-id')
      expect(mockFilesCreate).toHaveBeenCalledWith(expect.objectContaining({
        requestBody: { name: 'test.pdf', parents: ['folder-id'] },
        media: expect.objectContaining({ mimeType: 'application/pdf' })
      }))
    })
  })

  describe('createEvent', () => {
    it('should create a calendar event with attachments', async () => {
      const auth = {}
      const eventData = {
        summary: 'Test Event',
        start: '2026-05-22T10:00:00Z',
        description: 'Test Description',
        fileId: 'file-id',
        webViewLink: 'link',
        fileName: 'test.pdf'
      }
      mockEventsInsert.mockResolvedValue({ data: { id: 'event-id' } })

      const result = await GoogleService.createEvent(auth, eventData)

      expect(mockEventsInsert).toHaveBeenCalledWith(expect.objectContaining({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: 'Test Event',
          attachments: [expect.objectContaining({ fileUrl: 'link', title: 'test.pdf' })]
        })
      }))
    })
  })
})
