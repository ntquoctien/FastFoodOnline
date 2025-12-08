# So do he thong (Mermaid)

## Kien truc trien khai
```mermaid
flowchart LR
  subgraph Client
    F[Frontend (Vite 5173)]
    A[Admin (Vite 5174)]
  end
  B[Backend API (Express 4000)]
  M[(MongoDB Atlas (SRV))]

  F -->|REST| B
  A -->|REST| B
  B -->|Mongoose| M
```

## Mo hinh du lieu (chi tiet)
```mermaid
classDiagram
  class Restaurant {
    +ObjectId _id
    +string name
    +string description
    +string phone
    +string email
    +string logoUrl
    +string cuisine
    +string policy
    +bool isActive
    +date createdAt
    +date updatedAt
  }

  class Branch {
    +ObjectId _id
    +ObjectId restaurantId
    +ObjectId hubId
    +string name
    +Address address
    +string street
    +string district
    +string city
    +string country
    +string phone
    +Point location
    +number latitude
    +number longitude
    +bool isPrimary
    +bool isActive
    +date createdAt
    +date updatedAt
  }

  class Hub {
    +ObjectId _id
    +string name
    +Address address
    +Point location
    +number serviceRadiusKm
    +date createdAt
    +date updatedAt
  }

  class Category {
    +ObjectId _id
    +ObjectId restaurantId
    +string name
    +string description
    +bool isActive
    +date createdAt
    +date updatedAt
  }

  class Food {
    +ObjectId _id
    +ObjectId categoryId
    +string name
    +string description
    +string imageUrl
    +bool isActive
    +bool isManuallyDisabled
    +bool isArchived
    +date createdAt
    +date updatedAt
  }

  class FoodVariant {
    +ObjectId _id
    +ObjectId foodId
    +ObjectId branchId
    +ObjectId measurementUnitId
    +string size
    +number price
    +string unitType
    +string unitLabel
    +number unitValue
    +string unitSymbol
    +number unitOrder
    +bool isDefault
    +number weightKg
    +bool isActive
    +bool isManuallyDisabled
    +bool isArchived
    +date createdAt
    +date updatedAt
  }

  class MeasurementUnit {
    +ObjectId _id
    +string type
    +string label
    +number value
    +string symbol
    +number order
    +string description
    +bool isActive
    +date createdAt
    +date updatedAt
  }

  class Inventory {
    +ObjectId _id
    +ObjectId branchId
    +ObjectId foodVariantId
    +number quantity
    +date updatedAt
    +date createdAt
  }

  class User {
    +ObjectId _id
    +string name
    +string email
    +string password
    +string phone
    +string role
    +bool isActive
    +string avatarUrl
    +ObjectId branchId
    +object cartData
    +string staffStatus
  }

  class Order {
    +ObjectId _id
    +ObjectId userId
    +ObjectId branchId
    +ObjectId hubId
    +ObjectId droneId
    +ObjectId missionId
    +ObjectId pickupBranchId
    +OrderItem[] items
    +Address customerAddress
    +Point customerLocation
    +object address
    +string dropoffAddress
    +number dropoffLat
    +number dropoffLng
    +string deliveryMethod
    +number pickupLat
    +number pickupLng
    +number subtotal
    +number deliveryFee
    +number totalAmount
    +number orderWeightKg
    +number payloadWeightKg
    +string status
    +string cancellationReason
    +date cancelledAt
    +ObjectId cancelledBy
    +string paymentMethod
    +string paymentStatus
    +Timeline[] timeline
    +number etaMinutes
    +bool needsDroneAssignment
    +date lastDroneAssignAttemptAt
    +number droneAssignRetries
    +date createdAt
    +date updatedAt
  }

  class Payment {
    +ObjectId _id
    +ObjectId orderId
    +string provider
    +string transactionId
    +number amount
    +string status
    +date paidAt
    +object meta
    +date createdAt
    +date updatedAt
  }

  class Drone {
    +ObjectId _id
    +string code
    +string name
    +string serialNumber
    +ObjectId hubId
    +ObjectId branchId
    +string status
    +number batteryLevel
    +number speedKmh
    +number maxPayloadKg
    +Point location
    +number lastKnownLat
    +number lastKnownLng
    +date createdAt
    +date updatedAt
  }

  class DroneAssignment {
    +ObjectId _id
    +ObjectId orderId
    +ObjectId droneId
    +string status
    +date assignedAt
    +date enRoutePickupAt
    +date pickedAt
    +date enRouteDropoffAt
    +date deliveredAt
    +date cancelledAt
    +date failedAt
    +object meta
    +date createdAt
    +date updatedAt
  }

  class Mission {
    +ObjectId _id
    +ObjectId orderId
    +ObjectId droneId
    +ObjectId hubId
    +string status
    +LineString route
    +string[] waypoints
    +number totalDistanceKm
    +number estDurationMinutes
    +date startedAt
    +date finishedAt
    +Point startLocation
    +Point endLocation
    +date createdAt
    +date updatedAt
  }

  class Notification {
    +ObjectId _id
    +string title
    +string message
    +string level
    +string status
    +string action
    +string entityType
    +ObjectId entityId
    +string[] targetRoles
    +ObjectId targetBranchId
    +Actor actor
    +Mixed metadata
    +ObjectId[] readBy
    +date createdAt
    +date updatedAt
  }

  class GeocodeCache {
    +ObjectId _id
    +string addressKey
    +number lat
    +number lng
    +string provider
    +date createdAt
    +date updatedAt
  }

  Restaurant "1" --|> "many" Branch : "has branches"
  Hub "1" --|> "many" Branch : "serves branches"
  Branch "1" --|> "many" FoodVariant : "offers variants"
  Branch "1" --|> "many" Inventory : "stocks"
  Branch "1" --|> "many" User : "staff/users"
  Branch "1" --|> "many" Order : "order from"
  Category "1" --|> "many" Food : "categorizes"
  Food "1" --|> "many" FoodVariant : "has variants"
  MeasurementUnit "1" --|> "many" FoodVariant : "quantified by"
  FoodVariant "1" --|> "many" Inventory : "tracked in"
  User "1" --|> "many" Order : "places"
  Order "1" --|> "many" Payment : "paid by"
  Hub "1" --|> "many" Drone : "hosts"
  Hub "1" --|> "many" Mission : "dispatches"
  Drone "1" --|> "many" DroneAssignment : "assigned to"
  Drone "1" --|> "many" Mission : "flies"
  Order "1" --|> "1" DroneAssignment : "has assignment"
  Order "1" --|> "1" Mission : "has mission"
  Order "many" --|> "1" Hub : "routed via"
  Order "many" --|> "1" Drone : "delivered by"
  Notification "many" --|> "1" Branch : "target branch"
  Notification "many" --|> "1" User : "actor/readers"
```
