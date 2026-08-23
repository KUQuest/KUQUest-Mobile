# Student Profile Editing API Specification

**Status:** Proposed backend contract
**Consumer:** KUQuest Mobile
**Authentication:** Better Auth session cookie

This specification supports focused editing of public Student Profile content without reopening the three-step Academic Registration flow.

## General contract

All endpoints operate on the authenticated Student's own data.

### Response envelope

```json
{
  "success": true,
  "data": {}
}
```

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "fields": {
      "bio": "Bio must be 1000 characters or fewer."
    }
  }
}
```

### Common errors

- `401 UNAUTHORIZED` — session expired or missing
- `403 FORBIDDEN` — resource cannot be modified by the current Student
- `404 NOT_FOUND` — resource or optional capability does not exist
- `409 CONFLICT` — update was based on stale data
- `413 FILE_TOO_LARGE` — uploaded file exceeds the limit
- `415 UNSUPPORTED_MEDIA_TYPE` — unsupported file type
- `422 VALIDATION_ERROR` — request fields are invalid

### Concurrency

Mutation requests should support optimistic concurrency using either:

- `ETag` on reads and `If-Match` on mutations; or
- a numeric `version` returned in the resource and submitted with mutations.

The backend must return `409 CONFLICT` when the submitted version is stale.

### Idempotency

Image uploads and create requests should accept an `Idempotency-Key` header. Retrying the same request must not create duplicate records or duplicate files.

## Profile basics

### Get current Student Profile

```http
GET /api/v1/profile
```

Example response:

```json
{
  "success": true,
  "data": {
    "version": 42,
    "email": "student@ku.th",
    "firstName": "Ada",
    "lastName": "Student",
    "bio": "Frontend developer",
    "occupation": {
      "id": "occupation-id",
      "name": "Student"
    },
    "tags": [
      { "id": "design", "name": "Design" }
    ],
    "avatar": {
      "fileId": "file-id",
      "url": "https://cdn.example/avatar.jpg"
    }
  }
}
```

The response may continue to include protected/read-only fields for display. The mobile edit flow must not submit those fields.

### Update public Profile fields

```http
PATCH /api/v1/profile
If-Match: "42"
Content-Type: application/json
```

All fields are optional. At least one field is required.

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "bio": "Updated bio",
  "occupationId": "occupation-id",
  "tagIds": ["design", "research"]
}
```

Recommended validation:

- `firstName`: non-empty, maximum 100 characters
- `lastName`: non-empty, maximum 100 characters
- `bio`: nullable, maximum 1000 characters
- `occupationId`: valid seeded occupation ID
- `tagIds`: valid seeded tag IDs, with a documented maximum count

The endpoint must reject or ignore these protected Academic Registration fields:

```text
telephone
studentId
facultyId
faculty
departmentId
department
academicYear
termsVersion
termsAcceptedAt
```

Response:

```json
{
  "success": true,
  "data": {
    "version": 43,
    "firstName": "Ada",
    "lastName": "Lovelace",
    "bio": "Updated bio",
    "occupation": {
      "id": "occupation-id",
      "name": "Student"
    },
    "tags": [
      { "id": "design", "name": "Design" }
    ],
    "avatar": null
  }
}
```

### Occupation options

```http
GET /api/v1/profile/occupations/options
```

```json
{
  "success": true,
  "data": [
    {
      "id": "occupation-id",
      "name": "Student"
    }
  ]
}
```

If occupations remain owned by Academic Registration, document that explicitly and provide a profile-edit-safe read endpoint. Updating a public Profile must not require resubmitting protected Academic Registration data.

### Profile tag options

```http
GET /api/v1/profile/tags/options
```

```json
{
  "success": true,
  "data": [
    {
      "id": "design",
      "name": "Design"
    }
  ]
}
```

If tags are not Student-managed, omit `tagIds` from `PATCH /api/v1/profile` and do not expose an edit control in the mobile app.

### Avatar

Upload a new avatar:

```http
POST /api/v1/profile/avatar
Content-Type: multipart/form-data
```

Multipart field:

```text
avatar: image file
```

Remove the current avatar:

```http
DELETE /api/v1/profile/avatar
```

Both operations return the updated avatar object or `null`.

## Experience

```http
GET    /api/v1/profile/experience
POST   /api/v1/profile/experience
PATCH  /api/v1/profile/experience/:experienceId
DELETE /api/v1/profile/experience/:experienceId
```

Create/update body:

```json
{
  "title": "Frontend Developer",
  "employmentType": "Internship",
  "organization": "KUQuest",
  "description": "Built mobile UI components.",
  "startedAt": "2024-06-01",
  "endedAt": null
}
```

Validation:

- `title`: required, maximum 120 characters
- `employmentType`: required, maximum 50 characters
- `organization`: nullable, maximum 120 characters
- `description`: nullable, maximum 1000 characters
- `startedAt`: required calendar date in `YYYY-MM-DD`
- `endedAt`: nullable calendar date in `YYYY-MM-DD`
- `endedAt` must not be earlier than `startedAt`
- `endedAt: null` means the Experience is ongoing

Every successful mutation returns the complete updated Experience resource.

Example:

```json
{
  "success": true,
  "data": {
    "experience": {
      "id": "experience-id",
      "title": "Frontend Developer",
      "employmentType": "Internship",
      "organization": "KUQuest",
      "description": "Built mobile UI components.",
      "startedAt": "2024-06-01",
      "endedAt": null
    }
  }
}
```

## Portfolio Work

```http
GET    /api/v1/profile/portfolio
POST   /api/v1/profile/portfolio
PATCH  /api/v1/profile/portfolio/:portfolioId
DELETE /api/v1/profile/portfolio/:portfolioId
```

Create:

```http
POST /api/v1/profile/portfolio
Content-Type: multipart/form-data
```

Multipart fields:

```text
title: string
description: string, optional
images: image files, optional
```

Update metadata:

```json
{
  "title": "KUQuest Mobile",
  "description": "Updated description"
}
```

Image management:

```http
POST   /api/v1/profile/portfolio/:portfolioId/image
DELETE /api/v1/profile/portfolio/:portfolioId/image
```

Multipart field for image replacement:

```text
image: image file
```

Validation:

- `title`: required, maximum 120 characters
- `description`: nullable, maximum 1000 characters
- image count and image size limits must be documented
- replacing an image must not delete the previous image until the new upload succeeds

## Certificates

```http
GET    /api/v1/profile/certificates
POST   /api/v1/profile/certificates
PATCH  /api/v1/profile/certificates/:certificateId
DELETE /api/v1/profile/certificates/:certificateId
```

Create/update body:

```json
{
  "name": "AWS Certified Cloud Practitioner",
  "issuer": "Amazon Web Services",
  "issuedAt": "2024-05-01"
}
```

Image management:

```http
POST   /api/v1/profile/certificates/:certificateId/image
DELETE /api/v1/profile/certificates/:certificateId/image
```

Multipart field:

```text
image: image file
```

Validation:

- `name`: required
- `issuer`: required
- `issuedAt`: required calendar date in `YYYY-MM-DD`
- image replacement must preserve the previous image if upload fails

Every successful mutation returns the complete updated Certificate or a documented success response.

## Resource shapes

### Experience

```json
{
  "id": "experience-id",
  "title": "Frontend Developer",
  "employmentType": "Internship",
  "organization": "KUQuest",
  "description": "Built mobile UI components.",
  "startedAt": "2024-06-01",
  "endedAt": null
}
```

### Portfolio Work

```json
{
  "id": "portfolio-id",
  "title": "KUQuest Mobile",
  "description": "Mobile application",
  "images": [
    {
      "fileId": "file-id",
      "url": "https://cdn.example/image.jpg",
      "position": 0
    }
  ]
}
```

### Certificate

```json
{
  "id": "certificate-id",
  "name": "AWS Certified Cloud Practitioner",
  "issuer": "Amazon Web Services",
  "issuedAt": "2024-05-01",
  "image": {
    "fileId": "file-id",
    "url": "https://cdn.example/certificate.jpg"
  }
}
```

## File rules

- Accepted formats: JPEG, PNG, and WebP
- Maximum size: 5 MB per image
- Validate MIME type and actual file contents server-side
- Return `413 FILE_TOO_LARGE` for oversized files
- Return `415 UNSUPPORTED_MEDIA_TYPE` for unsupported files
- Use stable file IDs and URLs in response resources
- Upload retries must be safe with `Idempotency-Key`

## Mobile dependency checklist

The backend team should confirm:

- [ ] Whether display name is independently editable
- [ ] Whether Occupation belongs to public Profile or protected Academic Registration
- [ ] Whether tags are Student-managed or derived
- [ ] Whether concurrency uses ETags or numeric versions
- [ ] Whether image-delete endpoints are supported
- [ ] Whether create mutations return the complete created resource
- [ ] Exact maximum image count and dimensions
- [ ] Exact employment-type option values
- [ ] Whether `GET /api/v1/profile/edit` should be added as an aggregate read endpoint

## Current implementation compatibility

The mobile client already has separate operations for Profile, Experience, Portfolio Work, and Certificates. The backend contract should preserve the existing resource paths where possible and add the missing tag options, image deletion, profile-level occupation/tag updates, and concurrency behavior explicitly.
