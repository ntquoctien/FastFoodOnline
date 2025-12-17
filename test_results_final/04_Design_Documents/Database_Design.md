# DATABASE DESIGN - FastFoodOnline

## Thông tin chung
- **Database**: MongoDB
- **Version**: 6.x
- **Connection**: MongoDB Atlas / Local MongoDB
- **Database Name**: fastfoodonline

---

## COLLECTIONS

### 1. users
**Mô tả**: Lưu thông tin người dùng

**Schema**:
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, index),
  password: String (required, hashed with bcrypt),
  role: String (enum: ['user', 'admin', 'staff'], default: 'user'),
  phone: String,
  avatar: String (Cloudinary URL),
  cartData: Object (minimize: false, default: {}),
    // Format: { foodId: quantity, ... }
  createdAt: Date (default: Date.now),
  updatedAt: Date
}
```

**Indexes**:
- `email`: unique index
- `role`: index for filtering admin/staff

---

### 2. foods
**Mô tả**: Lưu thông tin món ăn

**Schema**:
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  price: Number (required, min: 0),
  image: String (Cloudinary URL),
  category: String (required),
    // Values: Salad, Rolls, Deserts, Sandwich, Cake, Pure Veg, Pasta, Noodles
  isActive: Boolean (default: true),
  isArchived: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `category`: index for filtering
- `isActive, isArchived`: compound index
- `name`: text index for search

---

### 3. categories
**Mô tả**: Danh mục món ăn

**Schema**:
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  image: String,
  order: Number (display order),
  isActive: Boolean (default: true)
}
```

---

### 4. orders
**Mô tả**: Đơn hàng

**Schema**:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users', required),
  branchId: ObjectId (ref: 'branches', required),
  items: [
    {
      foodId: ObjectId (ref: 'foods'),
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }
  ],
  subtotal: Number (required),
  deliveryFee: Number (default: 20000),
  totalAmount: Number (required),
  customerLocation: {
    type: String (enum: ['Point']),
    coordinates: [Number] // [longitude, latitude]
  },
  address: String (required),
  paymentMethod: String (enum: ['COD', 'VNPAY', 'STRIPE', 'MOMO'], required),
  paymentStatus: String (enum: ['unpaid', 'PENDING', 'PAID', 'FAILED'], default: 'unpaid'),
  status: String (enum: ['CREATED', 'PREPARING', 'READY_TO_SHIP', 'PICKING_UP', 
                         'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELED'], 
                  default: 'CREATED'),
  timeline: [
    {
      status: String,
      at: Date,
      actorType: String (enum: ['system', 'user', 'admin', 'drone']),
      actor: ObjectId,
      note: String
    }
  ],
  droneId: ObjectId (ref: 'drones'),
  missionId: ObjectId (ref: 'missions'),
  needsDroneAssignment: Boolean (default: false),
  cancelReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `userId`: index for user's orders
- `status`: index for filtering
- `createdAt`: index for sorting
- `customerLocation`: 2dsphere index for geo queries

---

### 5. branches
**Mô tả**: Chi nhánh cửa hàng

**Schema**:
```javascript
{
  _id: ObjectId,
  name: String (required),
  address: String (required),
  location: {
    type: String (enum: ['Point']),
    coordinates: [Number]
  },
  phone: String,
  isActive: Boolean (default: true),
  createdAt: Date
}
```

**Indexes**:
- `location`: 2dsphere index
- `isActive`: index

---

### 6. notifications
**Mô tả**: Thông báo

**Schema**:
```javascript
{
  _id: ObjectId,
  targetRoles: [String] (enum: ['admin', 'user', 'staff']),
  targetUsers: [ObjectId] (ref: 'users'),
  entityType: String (enum: ['order', 'food', 'user']),
  entityId: ObjectId,
  action: String,
  message: String (required),
  isRead: Boolean (default: false),
  createdAt: Date
}
```

**Indexes**:
- `targetUsers`: index
- `targetRoles`: index
- `isRead`: index
- `createdAt`: index for sorting

---

### 7. drones
**Mô tả**: Drone giao hàng (nếu có)

**Schema**:
```javascript
{
  _id: ObjectId,
  droneId: String (unique),
  model: String,
  status: String (enum: ['available', 'busy', 'maintenance', 'offline']),
  currentLocation: {
    type: String (enum: ['Point']),
    coordinates: [Number]
  },
  battery: Number (0-100),
  lastUpdate: Date
}
```

---

### 8. missions
**Mô tả**: Nhiệm vụ giao hàng của drone

**Schema**:
```javascript
{
  _id: ObjectId,
  droneId: ObjectId (ref: 'drones'),
  orderId: ObjectId (ref: 'orders'),
  status: String (enum: ['ASSIGNED', 'PICKING_UP', 'DELIVERING', 'COMPLETED', 'FAILED']),
  startLocation: { type: String, coordinates: [Number] },
  endLocation: { type: String, coordinates: [Number] },
  startTime: Date,
  endTime: Date,
  createdAt: Date
}
```

---

## RELATIONSHIPS

### 1-N Relationships:
- **users → orders**: Một user có nhiều orders
- **branches → orders**: Một branch có nhiều orders
- **drones → missions**: Một drone có nhiều missions

### N-M Relationships:
- **orders ↔ foods**: Qua items array trong orders

### Reference Fields:
- `orders.userId` → `users._id`
- `orders.branchId` → `branches._id`
- `orders.items[].foodId` → `foods._id`
- `orders.droneId` → `drones._id`
- `orders.missionId` → `missions._id`

---

## DATA VALIDATION

### Required Fields:
- **users**: name, email, password
- **foods**: name, price, category
- **orders**: userId, branchId, items, totalAmount, address, paymentMethod

### Unique Constraints:
- **users.email**: unique
- **drones.droneId**: unique
- **categories.name**: unique

### Enum Validations:
- **users.role**: user | admin | staff
- **orders.paymentMethod**: COD | VNPAY | STRIPE | MOMO
- **orders.status**: CREATED | PREPARING | DELIVERING | DELIVERED | ...

---

## INDEXES SUMMARY

### Performance Indexes:
- `users.email` (unique) - Login queries
- `foods.category` - Filtering
- `orders.userId` - User's order history
- `orders.status` - Admin order management

### Geo Indexes:
- `orders.customerLocation` (2dsphere) - Distance calculation
- `branches.location` (2dsphere) - Nearest branch

### Text Index:
- `foods.name` (text) - Search functionality

---

## SAMPLE DATA

### Sample User:
```javascript
{
  name: "Nguyen Van A",
  email: "user@example.com",
  password: "$2b$10$...", // hashed
  role: "user",
  cartData: {
    "64a1b2c3d4e5f6g7h8i9j0k1": 2,
    "64b2c3d4e5f6g7h8i9j0k1l2": 1
  }
}
```

### Sample Order:
```javascript
{
  userId: ObjectId("..."),
  branchId: ObjectId("..."),
  items: [
    { foodId: ObjectId("..."), quantity: 2, unitPrice: 50000, totalPrice: 100000 },
    { foodId: ObjectId("..."), quantity: 1, unitPrice: 30000, totalPrice: 30000 }
  ],
  subtotal: 130000,
  deliveryFee: 20000,
  totalAmount: 150000,
  address: "123 Main Street",
  paymentMethod: "COD",
  paymentStatus: "unpaid",
  status: "CREATED"
}
```

---

## BACKUP & MAINTENANCE

### Backup Strategy:
- MongoDB Atlas: Automatic backups
- Local: Daily backup script
- Export command: `mongodump --db fastfoodonline`

### Data Cleanup:
- Archive old orders (>6 months): Set isArchived = true
- Soft delete foods: Set isArchived = true instead of delete
- Clean old notifications: Delete after 30 days

---

**Version**: 1.0  
**Date**: 17-Dec-2025  
**Author**: Development Team

