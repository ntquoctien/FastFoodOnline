# ERD (tu code)

Nguon: backend/models v2 va cac services/controllers (khong dung tai lieu .md/.puml).

## Quan he chinh
- restaurants 1--* branches (`branches.restaurantId`); branch co the tham chieu hub (`hubId`).
- hubs 1--* branches, 1--* drones, 1--* missions, 1--* orders (`orders.hubId`, fallback tu `branch.hubId`).
- categories 1--* foods (`foods.categoryId`) 1--* foodVariants (`foodVariants.foodId`).
- foodVariants thuoc branch (`branchId`) va co the tham chieu measurementUnits (`measurementUnitId`); inventory gom cap (`branchId`, `foodVariantId`); `orders.items` tham chieu `foodVariantId`.
- users dat orders (`orders.userId`) va co the thuoc branch (`users.branchId`).
- payments thuoc orders (unique theo {orderId, provider}).
- droneAssignments lien ket 1:1 voi orders (`orderId` unique) va chi dinh drone; missions lien ket 1:1 voi orders va tham chieu drone/hub.
- notifications nham vao roles/branch; actor/readBy luu user/branch id.
- geocodeCache doc lap, cache toa do theo `addressKey`.

## Thuc the va truong chinh
### restaurants
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| name | String | bat buoc, unique index |
| description | String |  |
| phone | String |  |
| email | String |  |
| logoUrl | String |  |
| cuisine | String |  |
| policy | String |  |
| isActive | Boolean | default true |
| createdAt/updatedAt | Date | auto |

### branches
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| restaurantId | ObjectId -> restaurants | bat buoc |
| hubId | ObjectId -> hubs | tuy chon |
| name | String | bat buoc, unique theo restaurant khi active |
| address | Subdoc | street, ward, district, city, country, fullText |
| street/district/city/country | String | truong legacy song song address |
| phone | String |  |
| location | GeoJSON Point | 2dsphere index |
| latitude/longitude | Number | legacy fallback |
| isPrimary | Boolean | danh dau chi nhanh chinh |
| isActive | Boolean | mac dinh true |
| createdAt/updatedAt | Date | auto |

### hubs
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| name | String | bat buoc, unique |
| address | Subdoc | street, ward, district, city, country, fullText |
| location | GeoJSON Point | bat buoc, 2dsphere index |
| serviceRadiusKm | Number | ban kinh phuc vu |
| createdAt/updatedAt | Date | auto |

### categories
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| restaurantId | ObjectId -> restaurants | bat buoc |
| name | String | bat buoc, unique theo restaurant |
| description | String |  |
| isActive | Boolean | default true |
| createdAt/updatedAt | Date | auto |

### foods
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| categoryId | ObjectId -> categories | bat buoc |
| name | String | bat buoc, unique theo category |
| description | String |  |
| imageUrl | String |  |
| isActive | Boolean | default true |
| isManuallyDisabled | Boolean | default false |
| isArchived | Boolean | default false |
| createdAt/updatedAt | Date | auto |

### foodVariants
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| foodId | ObjectId -> foods | bat buoc |
| branchId | ObjectId -> branches | bat buoc |
| size | String | bat buoc |
| price | Number | bat buoc |
| measurementUnitId | ObjectId -> measurementUnits | tuy chon |
| unitType/unitLabel/unitValue/unitSymbol/unitOrder | String/Number | meta don vi |
| isDefault | Boolean | mac dinh false |
| weightKg | Number | dung tinh khoi luong giao |
| isActive/isManuallyDisabled/isArchived | Boolean | trang thai |
| createdAt/updatedAt | Date | auto |

### measurementUnits
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| type | String | bat buoc, lowercase |
| label | String | bat buoc, unique theo type |
| value | Number | gia tri so |
| symbol | String |  |
| order | Number | thu tu sap xep |
| description | String | mo ta hien thi |
| isActive | Boolean | mac dinh true |
| createdAt/updatedAt | Date | auto |

### inventory
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| branchId | ObjectId -> branches | bat buoc |
| foodVariantId | ObjectId -> foodVariants | bat buoc, unique cap cung branch |
| quantity | Number | mac dinh 0 |
| updatedAt | Date | dat thu cong moi lan cap nhat |
| createdAt | Date | auto |

### users
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| name | String | bat buoc |
| email | String | bat buoc, unique |
| password | String | bat buoc |
| phone | String |  |
| role | String | default user (admin/super_admin/staff... trong code) |
| isActive | Boolean | default true |
| avatarUrl | String |  |
| branchId | ObjectId -> branches | tuy chon (staff) |
| cartData | Mixed | du lieu gio hang |
| staffStatus | String | enum active/inactive/on_leave |
| createdAt/updatedAt | Date | (mongoose default on save) |

### orders
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| userId | ObjectId -> users | bat buoc |
| branchId | ObjectId -> branches | bat buoc |
| hubId | ObjectId -> hubs | tuy chon |
| items | [Subdoc] | xem bang order.items |
| customerAddress | address schema | dia chi khach hang moi |
| customerLocation | GeoJSON Point | toa do drop-off |
| address | Mixed | truong legacy (chua email/lat/lng neu co) |
| dropoffAddress | String | [unused] chi duoc set khi tao order, khong duoc doc o cac flow |
| dropoffLat/dropoffLng | Number | toa do drop-off |
| deliveryMethod | String | enum, hien tai chi "drone" |
| pickupBranchId | ObjectId -> branches | tuy chon |
| pickupLat/pickupLng | Number | toa do lay hang |
| subtotal/deliveryFee/totalAmount | Number | bat buoc |
| orderWeightKg | Number | dung check payload drone |
| payloadWeightKg | Number | [unused] chi duoc set, khong duoc doc o service/UI |
| status | String | enum hop nhat legacy & new |
| cancellationReason/cancelledAt/cancelledBy | String/Date/ObjectId | ly do huy |
| paymentMethod | String | enum COD/ONLINE/... |
| paymentStatus | String | enum unpaid/paid/refunded/PENDING/PAID... |
| timeline | [Subdoc] | lich su trang thai giao hang |
| droneId | ObjectId -> drones | tuy chon |
| missionId | ObjectId -> missions | tuy chon |
| etaMinutes | Number | hien thi ETA |
| needsDroneAssignment/lastDroneAssignAttemptAt/droneAssignRetries | Boolean/Date/Number | flag auto assign |
| createdAt/updatedAt | Date | auto |

#### order.items (sub doc)
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| foodVariantId | ObjectId -> foodVariants | bat buoc |
| title | String | ten mon tai thoi diem dat |
| size | String |  |
| quantity | Number | min 1 |
| unitPrice/totalPrice | Number | bat buoc |
| notes | String | [unused] khong duoc doc/hien thi trong code hien tai |

#### order.timeline (sub doc)
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| status | String | bat buoc |
| actorType | String | enum user/admin/staff/system/drone |
| at | Date | thoi diem |
| actor | ObjectId | id tham chieu tuong ung |

### payments
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| orderId | ObjectId -> orders | bat buoc |
| provider | String | enum vnpay/stripe/momo/zalopay/cash/card |
| transactionId | String | tuy chon |
| amount | Number | bat buoc |
| status | String | enum pending/success/failed/refunded |
| paidAt | Date |  |
| meta | Object | du lieu giao dich |
| createdAt/updatedAt | Date | auto |

### drones
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| code | String | bat buoc, unique |
| name | String |  |
| serialNumber | String | unique sparse |
| hubId | ObjectId -> hubs | uu tien |
| branchId | ObjectId -> branches | legacy fallback |
| status | String | enum AVAILABLE/ASSIGNED/... + legacy |
| batteryLevel | Number | 0-100 |
| speedKmh | Number | dung tinh ETA |
| maxPayloadKg | Number | mac dinh 2kg |
| location | GeoJSON Point | 2dsphere index |
| lastKnownLat/lastKnownLng | Number | legacy toa do |
| createdAt/updatedAt | Date | auto |

### droneAssignments
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| orderId | ObjectId -> orders | bat buoc, unique |
| droneId | ObjectId -> drones | bat buoc |
| status | String | enum assigned/en_route_pickup/... |
| assignedAt | Date | thoi diem gan |
| enRoutePickupAt/pickedAt/enRouteDropoffAt/deliveredAt/cancelledAt/failedAt | Date | [unused] chi duoc ghi lai, khong duoc doc/tinh toan o cac service/UI |
| meta | Object | [unused] chi duoc tron khi update status, khong duoc doc |
| createdAt/updatedAt | Date | auto |

### missions
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| orderId | ObjectId -> orders | bat buoc, unique |
| droneId | ObjectId -> drones | bat buoc |
| hubId | ObjectId -> hubs | tuy chon |
| status | String | enum PLANNED/EN_ROUTE_PICKUP/... |
| route | GeoJSON LineString | [unused] chi luu khi tao, khong duoc doc o cac flow |
| waypoints | [String] | [unused] khong duoc set/su dung |
| totalDistanceKm/estDurationMinutes | Number | [unused] chi tinh va luu, khong duoc doc |
| startedAt/finishedAt | Date |  |
| startLocation/endLocation | GeoJSON Point | [unused] chi luu, khong duoc doc |
| createdAt/updatedAt | Date | auto |

### notifications
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| title | String | bat buoc |
| message | String |  |
| level | String | enum info/success/warning/error |
| status | String | enum success/failed/pending |
| action | String | enum create/update/delete/status/other |
| entityType/entityId | String/ObjectId | tuy chon |
| targetRoles | [String] | mac dinh ["admin"] neu khong truyen |
| targetBranchId | ObjectId -> branches | tuy chon |
| actor | Subdoc | userId/name/role/branchId snapshot |
| metadata | Mixed |  |
| readBy | [ObjectId -> users] | danh dau da doc |
| createdAt/updatedAt | Date | auto |

### geocodeCache
| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| _id | ObjectId | PK |
| addressKey | String | bat buoc, unique |
| lat/lng | Number | toa do da cache |
| provider | String | [unused] chi duoc luu khi upsert, khong duoc doc |
| createdAt/updatedAt | Date | auto |
