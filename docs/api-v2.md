# API v2 Overview

Base URL: `http://localhost:4000/api/v2`

Authentication: Most endpoints require JWT via `Authorization: Bearer <token>` and/or `userId` injected by middleware. Admin-only endpoints require user role = `admin`.

## Menu `/menu`
- GET `/default?branchId=<branchId>`
  - Desc: Get default menu for branch, grouped by categories and variants.
  - Auth: Public.
- POST `/categories`
  - Desc: Create category {name, description}.
  - Auth: Admin.
  - Body: `{ name: string, description?: string }`
- POST `/foods`
  - Desc: Create food and variants.
  - Auth: Admin.
  - Body (multipart/form-data):
    - image: file (optional)
    - name: string
    - description?: string
    - categoryId: ObjectId
    - variants: JSON string of array: `[{ branchId, size, price, isDefault? }]`
- DELETE `/foods/:foodId`
  - Desc: Archive/disable a food item by id.
  - Auth: Admin.

## Orders `/orders`
- POST `/`
  - Desc: Create order.
  - Auth: User.
  - Body: `{ branchId, items: [{ foodVariantId, quantity, notes? }], address: {...} }`
- GET `/me`
  - Desc: Get orders of current user.
  - Auth: User.
- POST `/confirm-payment`
  - Desc: Confirm payment result.
  - Auth: User.
  - Body: `{ orderId, provider, transactionId, amount }`
- POST `/pay/vnpay`
  - Desc: Initialize VNPAY payment request and return checkout URL.
  - Auth: User.
  - Body: `{ orderId, amount }`
- GET `/pay/vnpay/verify`
  - Desc: Verify VNPAY return payload (query parameters from VNPAY redirect).
  - Auth: Public (HMAC signature is verified server-side).
- GET `/`
  - Desc: List all orders. If role is admin/branch_manager, can filter by `?branchId=`.
  - Auth: Authenticated.
- PATCH `/:orderId/status`
  - Desc: Update order status. Allowed statuses: pending|confirmed|preparing|delivered|cancelled.
  - Auth: Authenticated (role-aware checks in service).
  - Body: `{ status }`

## Inventory `/inventory`
- GET `/`
  - Desc: List inventory of a branch. Query: `branchId`.
  - Auth: Authenticated.
- POST `/`
  - Desc: Update inventory quantity.
  - Auth: Authenticated.
  - Body: `{ branchId, foodVariantId, quantity }`

## Shippers `/shippers`
- GET `/`
  - Desc: List shipper profiles.
  - Auth: Authenticated.
- PATCH `/:shipperId/status`
  - Desc: Update shipper status. Allowed: available|busy|inactive.
  - Auth: Authenticated.
  - Body: `{ status }`

## Branches `/branches`
- GET `/`
  - Desc: List branches. Optional: `?includeInactive=true`.
  - Auth: Admin.
- POST `/`
  - Desc: Create a branch.
  - Auth: Admin.
- PUT `/:branchId`
  - Desc: Update branch by id.
  - Auth: Admin.
- DELETE `/:branchId`
  - Desc: Delete branch by id.
  - Auth: Admin.
