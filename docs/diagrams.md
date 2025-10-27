# So do he thong (Mermaid)

## Kien truc trien khai
```mermaid
flowchart LR
  subgraph Client
    F[Frontend (Vite 5173)]
    A[Admin (Vite 5174)]
  end
  B[Backend API (Express 4000)]
  M[(MongoDB 27017)]

  F -->|REST| B
  A -->|REST| B
  B -->|Mongoose| M
```

## Mo hinh du lieu (chi tiet)
```mermaid
erDiagram
  RESTAURANT ||--o{ BRANCH : "hosts"
  RESTAURANT ||--o{ CATEGORY : "owns"
  CATEGORY ||--o{ FOOD : "groups"
  FOOD ||--o{ FOOD_VARIANT : "defines"
  BRANCH ||--o{ FOOD_VARIANT : "offers"
  BRANCH ||--o{ INVENTORY : "stocks"
  FOOD_VARIANT ||--o{ INVENTORY : "tracked_in"
  USER ||--o{ ORDER : "places"
  BRANCH ||--o{ ORDER : "fulfills"
  ORDER ||--o{ ORDER_ITEM : "contains"
  FOOD_VARIANT ||--o{ ORDER_ITEM : "ordered_as"
  ORDER ||--o{ ORDER_TIMELINE : "logs"
  USER ||--o{ ORDER_TIMELINE : "records"
  ORDER ||--o{ PAYMENT : "paid_by"
  USER ||--|| SHIPPER_PROFILE : "has"
  BRANCH ||--o{ SHIPPER_PROFILE : "dispatches"
  SHIPPER_PROFILE ||--o{ DELIVERY_ASSIGNMENT : "fulfills"
  ORDER ||--|| DELIVERY_ASSIGNMENT : "assigned_to"
  BRANCH ||--o{ USER : "employs"

  RESTAURANT {
    ObjectId _id
    string name
    string description
    string phone
    string email
    string logoUrl
    string cuisine
    string policy
    boolean isActive
    date createdAt
    date updatedAt
  }
  BRANCH {
    ObjectId _id
    ObjectId restaurantId
    string name
    string street
    string district
    string city
    string phone
    number latitude
    number longitude
    boolean isPrimary
    boolean isActive
    date createdAt
    date updatedAt
  }
  CATEGORY {
    ObjectId _id
    ObjectId restaurantId
    string name
    string description
    boolean isActive
    date createdAt
    date updatedAt
  }
  FOOD {
    ObjectId _id
    ObjectId categoryId
    string name
    string description
    string imageUrl
    boolean isActive
    boolean isManuallyDisabled
    boolean isArchived
    date createdAt
    date updatedAt
  }
  FOOD_VARIANT {
    ObjectId _id
    ObjectId foodId
    ObjectId branchId
    string size
    number price
    boolean isDefault
    boolean isActive
    boolean isManuallyDisabled
    boolean isArchived
    date createdAt
    date updatedAt
  }
  INVENTORY {
    ObjectId _id
    ObjectId branchId
    ObjectId foodVariantId
    number quantity
    date updatedAt
    date createdAt
  }
  USER {
    ObjectId _id
    string name
    string email
    string password
    string phone
    string role
    boolean isActive
    string avatarUrl
    ObjectId branchId
    json cartData
    string staffStatus
  }
  ORDER {
    ObjectId _id
    ObjectId userId
    ObjectId branchId
    json address
    number subtotal
    number deliveryFee
    number totalAmount
    string status
    string paymentStatus
    date createdAt
    date updatedAt
  }
  ORDER_ITEM {
    ObjectId foodVariantId
    string title
    string size
    number quantity
    number unitPrice
    number totalPrice
    string notes
  }
  ORDER_TIMELINE {
    string status
    date at
    ObjectId actor
  }
  PAYMENT {
    ObjectId _id
    ObjectId orderId
    string provider
    string transactionId
    number amount
    string status
    date paidAt
    json meta
    date createdAt
    date updatedAt
  }
  SHIPPER_PROFILE {
    ObjectId _id
    ObjectId userId
    ObjectId branchId
    string vehicleType
    string licensePlate
    string status
    date createdAt
    date updatedAt
  }
  DELIVERY_ASSIGNMENT {
    ObjectId _id
    ObjectId orderId
    ObjectId shipperId
    string status
    date assignedAt
    date pickedAt
    date deliveredAt
    date createdAt
    date updatedAt
  }
```

## Giai thich ERD: Thuc the va Moi quan he

- RESTAURANT ΓåÆ BRANCH (1ΓÇôn)
  - 1 nh├á h├áng c├│ nhiß╗üu chi nh├ính. `branch.restaurantId -> restaurant._id`.
  - D├╣ng khi liß╗çt k├¬ chi nh├ính theo th╞░╞íng hiß╗çu.

- RESTAURANT ΓåÆ CATEGORY (1ΓÇôn)
  - Danh mß╗Ñc m├│n thuß╗Öc phß║ím vi 1 nh├á h├áng. `category.restaurantId -> restaurant._id`.

- CATEGORY ΓåÆ FOOD (1ΓÇôn)
  - 1 danh mß╗Ñc c├│ nhiß╗üu m├│n. `food.categoryId -> category._id`.

- FOOD ΓåÆ FOOD_VARIANT (1ΓÇôn)
  - 1 m├│n c├│ nhiß╗üu biß║┐n thß╗â (size/gi├í). `foodVariant.foodId -> food._id`.

- BRANCH ΓåÆ FOOD_VARIANT (1ΓÇôn)
  - Biß║┐n thß╗â ├íp dß╗Ñng theo chi nh├ính (gi├í/size c├│ thß╗â kh├íc nhau). `foodVariant.branchId -> branch._id`.

- BRANCH ΓåÆ INVENTORY Γåö FOOD_VARIANT (nΓÇô1 & 1ΓÇôn)
  - Tß╗ôn kho theo cß║╖p (branch, foodVariant). `inventory.branchId`, `inventory.foodVariantId`.
  - Gß╗úi ├╜ unique: `(branchId, foodVariantId)`.

- USER ΓåÆ ORDER (1ΓÇôn) v├á BRANCH ΓåÆ ORDER (1ΓÇôn)
  - Mß╗ùi ─æ╞ín gß║»n 1 user ─æß║╖t v├á 1 chi nh├ính xß╗¡ l├╜. `order.userId`, `order.branchId`.

- ORDER ΓåÆ ORDER_ITEM (1ΓÇôn) Γåö FOOD_VARIANT
  - Mß╗ùi d├▓ng h├áng tham chiß║┐u biß║┐n thß╗â tß║íi thß╗¥i ─æiß╗âm ─æß║╖t. `orderItem.foodVariantId`.

- ORDER ΓåÆ ORDER_TIMELINE (1ΓÇôn) vß╗¢i USER (actor)
  - Nhß║¡t k├╜ diß╗àn biß║┐n ─æ╞ín. `timeline.actor -> user._id` (user/staff/shipper/hß╗ç thß╗æng).

- ORDER ΓåÆ PAYMENT (1ΓÇôn)
  - L╞░u giao dß╗ïch thanh to├ín (Stripe...). `payment.orderId -> order._id`.

- USER ΓåÆ SHIPPER_PROFILE (1ΓÇô1) v├á BRANCH ΓåÆ SHIPPER_PROFILE (1ΓÇôn)
  - Hß╗ô s╞í shipper cß╗ºa 1 user v├á chi nh├ính l├ám viß╗çc. `shipperProfile.userId`, `shipperProfile.branchId`.

- SHIPPER_PROFILE ΓåÆ DELIVERY_ASSIGNMENT (1ΓÇôn) v├á ORDER ΓåÆ DELIVERY_ASSIGNMENT (1ΓÇô1 tß║íi thß╗¥i ─æiß╗âm hoß║ít ─æß╗Öng)
  - Bß║ún ghi ph├ón c├┤ng giao cho 1 ─æ╞ín. `deliveryAssignment.shipperId`, `deliveryAssignment.orderId`.

Ghi ch├║ `USER.branchId`:
- D├╣ng cho nh├ón sß╗▒ (staff/shipper) ─æß╗â biß║┐t thuß╗Öc chi nh├ính n├áo.
- Vß╗¢i kh├ích h├áng (role = customer), kh├┤ng bß║»t buß╗Öc ΓåÆ ─æß╗â null. Chi nh├ính phß╗Ñc vß╗Ñ ─æ╞ín nß║▒m ß╗ƒ `ORDER.branchId`.

## Luong du lieu chinh

1) Duyet menu (khach h├áng)
- Client ΓåÆ GET `/api/v2/menu/default?branchId=...`
- Backend tß╗òng hß╗úp Category ΓåÆ Food ΓåÆ FoodVariant theo chi nh├ính.

2) Tao don hang
- Client gß╗¡i `{ branchId, items:[{foodVariantId, quantity, notes?}], address }` ΓåÆ POST `/api/v2/orders`.
- Backend kiß╗âm tra tß╗ôn kho c╞í bß║ún (t├╣y ch├¡nh s├ích), t├¡nh tß╗òng tiß╗ün, tß║ío ORDER + ORDER_ITEM, th├¬m timeline `pending`.

3) Thanh toan (Stripe)
- Tß║ío intent: POST `/api/v2/orders/pay/stripe` ΓåÆ trß║ú vß╗ü client secret.
- X├íc nhß║¡n: POST `/api/v2/orders/confirm-payment` ΓåÆ l╞░u PAYMENT, cß║¡p nhß║¡t `order.paymentStatus` + timeline `payment_confirmed` (hoß║╖c `payment_failed`).

4) Xu ly don (Admin/Staff)
- Cß║¡p nhß║¡t `status`: PATCH `/api/v2/orders/:id/status` (pendingΓåÆconfirmedΓåÆpreparingΓåÆdelivered/cancelled...).
- Mß╗ùi lß║ºn ─æß╗òi trß║íng th├íi, append timeline t╞░╞íng ß╗⌐ng.

5) Cap nhat ton kho
- Khi order v├áo giai ─æoß║ín chuß║⌐n bß╗ï, giß║úm `INVENTORY.quantity` theo tß╗½ng `foodVariantId` tß║íi `branchId`.
- API: GET/POST `/api/v2/inventory` ─æß╗â xem/cß║¡p nhß║¡t tß╗ôn.

6) Phan cong shipper
- Tß║ío/ cß║¡p nhß║¡t `DELIVERY_ASSIGNMENT` cho `ORDER` khi `status = assigned`.
- `SHIPPER_PROFILE.status` chuyß╗ân `availableΓåöbusy` theo tiß║┐n tr├¼nh; timeline th├¬m `assigned`, `delivering`, `delivered`.

7) Huy/Hoan tien (tuy chon)
- Nß║┐u hß╗ºy sau thanh to├ín, tß║ío PAYMENT mß╗¢i (refund/void) v├á timeline `cancelled`.

## Rangan buoc & Index de xuat

- INVENTORY: unique `(branchId, foodVariantId)`; index `{ branchId, updatedAt }`.
- FOOD_VARIANT: index `{ foodId, branchId, isDefault }`.
- ORDER: index `{ userId, createdAt }`, `{ branchId, status, createdAt }`.
- PAYMENT: index `{ orderId, createdAt }`, `{ provider, transactionId }` (unique nß║┐u cß║ºn).
- SHIPPER_PROFILE: index `{ branchId, status }`, unique `{ userId }`.
- USER: index `{ email }` (unique), `{ role, branchId }`.

## Quy tac chuyen trang thai (goi y)

`pending ΓåÆ confirmed ΓåÆ preparing ΓåÆ assigned ΓåÆ delivering ΓåÆ delivered`

- Cho ph├⌐p `cancelled` tß╗½ `pending/confirmed` (t├╣y ch├¡nh s├ích).
- Mß╗ùi chuyß╗ân trß║íng th├íi phß║úi ghi timeline vß╗¢i `actor` v├á thß╗¥i ─æiß╗âm `at`.




