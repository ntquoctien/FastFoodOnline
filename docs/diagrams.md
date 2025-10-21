# Sơ đồ hệ thống (Mermaid)

## Kiến trúc triển khai
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

## Mô hình dữ liệu (rút gọn)
```mermaid
erDiagram
  RESTAURANT ||--o{ BRANCH : has
  BRANCH ||--o{ FOOD_VARIANT : offers
  CATEGORY ||--o{ FOOD : groups
  FOOD ||--o{ FOOD_VARIANT : has
  BRANCH ||--o{ INVENTORY : stocks
  USER ||--o{ ORDER : places
  ORDER ||--o{ ORDER_ITEM : contains
  ORDER ||--o| PAYMENT : has
  SHIPPER_PROFILE ||--o{ DELIVERY_ASSIGNMENT : handles

  RESTAURANT {
    string name
    string email
    string phone
  }
  BRANCH {
    ObjectId restaurantId
    string name
    string city
  }
  CATEGORY {
    ObjectId restaurantId
    string name
  }
  FOOD {
    ObjectId categoryId
    string name
  }
  FOOD_VARIANT {
    ObjectId foodId
    ObjectId branchId
    string size
    number price
  }
  INVENTORY {
    ObjectId branchId
    ObjectId foodVariantId
    number quantity
  }
  ORDER {
    ObjectId userId
    ObjectId branchId
    number totalAmount
    string status
  }
  PAYMENT {
    ObjectId orderId
    string provider
    string status
  }
  SHIPPER_PROFILE {
    ObjectId userId
    ObjectId branchId
    string status
  }
  DELIVERY_ASSIGNMENT {
    ObjectId orderId
    ObjectId shipperId
    string status
  }
```
