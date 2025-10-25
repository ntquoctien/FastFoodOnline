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
