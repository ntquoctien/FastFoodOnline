# SCREEN DESIGN - FastFoodOnline

## USER INTERFACE (Frontend)

### 1. HOME PAGE
**URL**: `/`

**Components**:
- **Header**:
  - Logo (FastFoodOnline)
  - Navigation: Home, Menu, Mobile App, Contact Us
  - Sign In button (if not logged in)
  - Cart icon with badge (if logged in)
  - User avatar menu (if logged in): Profile, Orders, Logout

- **Hero Section**:
  - Main heading: "Order your favourite food here"
  - Subheading: "Choose from a diverse menu..."
  - CTA button: "View Menu"

- **Menu Section**:
  - Section title: "Explore our menu"
  - Category filters: All, Salad, Rolls, Deserts, Sandwich, Cake, Pure Veg, Pasta, Noodles
  - Food grid (3-4 columns)
    - Each food card:
      - Image
      - Name
      - Price
      - Description (truncated)
      - Add to cart button (+)

- **Footer**:
  - Company info
  - Social links
  - Copyright

---

### 2. MENU PAGE
**URL**: `/menu`

**Components**:
- Header (same as home)
- **Search Bar**:
  - Input field: "Search for food..."
  - Search button/icon

- **Category Tabs**:
  - All, Salad, Rolls, Deserts, etc.
  - Active category highlighted

- **Food Grid**:
  - Similar to home page
  - Responsive layout (mobile: 1 col, tablet: 2 cols, desktop: 3-4 cols)

---

### 3. CART PAGE
**URL**: `/cart`

**Components**:
- Header (same)
- **Cart Title**: "Your Cart"

- **Cart Items List**:
  - Each item row:
    - Image thumbnail
    - Name
    - Price per unit
    - Quantity controls: [-] [2] [+]
    - Total price
    - Remove button (X)

- **Cart Summary** (Right sidebar or bottom):
  - Subtotal: 100,000đ
  - Delivery Fee: 20,000đ
  - **Total**: 120,000đ
  - "Proceed to Checkout" button

- **Empty Cart State**:
  - Icon
  - Message: "Your cart is empty"
  - "Browse Menu" button

---

### 4. CHECKOUT PAGE
**URL**: `/checkout`

**Components**:
- **Delivery Information Form**:
  - First Name
  - Last Name
  - Email
  - Street Address
  - City
  - State
  - Zip Code
  - Country
  - Phone

- **Payment Method Selection**:
  - Radio buttons:
    - Cash on Delivery (COD)
    - VNPAY
    - Stripe
    - MoMo
  - Payment gateway logos

- **Order Summary**:
  - Items list (compact)
  - Subtotal
  - Delivery Fee
  - Total

- **"Place Order" Button** (Primary CTA)

---

### 5. MY ORDERS PAGE
**URL**: `/orders` or `/my-orders`

**Components**:
- Header (same)
- **Page Title**: "My Orders"

- **Orders List**:
  - Each order card:
    - Order ID: #12345
    - Date: 17-Dec-2025
    - Status badge: CREATED / PREPARING / DELIVERING / DELIVERED
    - Items preview (icons or thumbnails)
    - Total amount
    - "View Details" button

- **Order Details Modal/Page**:
  - Order info (ID, date, status)
  - Timeline (visual):
    - ✓ CREATED
    - ✓ PREPARING
    - ⏳ DELIVERING (current)
    - ○ DELIVERED
  - Items list
  - Payment info
  - Delivery address
  - "Cancel Order" button (if applicable)
  - "Track Order" button

---

### 6. PROFILE PAGE
**URL**: `/profile`

**Components**:
- Header (same)
- **Profile Section**:
  - Avatar (upload button)
  - Name (editable)
  - Email (readonly)
  - Phone (editable)
  - "Save Changes" button

- **Change Password Section**:
  - Current Password
  - New Password
  - Confirm Password
  - "Change Password" button

- **Order History Link**

---

### 7. LOGIN / SIGN UP MODAL

**Login Form**:
- Title: "Login"
- Email input
- Password input
- "Login" button
- "Don't have an account? Sign Up" link

**Sign Up Form**:
- Title: "Create Account"
- Name input
- Email input
- Password input
- "Create account" button
- "Already have an account? Login" link

---

## ADMIN INTERFACE

### 1. ADMIN DASHBOARD
**URL**: `/admin` or `/admin/dashboard`

**Components**:
- **Sidebar**:
  - Logo
  - Navigation:
    - Dashboard
    - Foods
    - Orders
    - Users (optional)
    - Statistics
  - Logout

- **Stats Cards**:
  - Total Orders
  - Total Revenue
  - Active Orders
  - Total Foods

- **Recent Orders Table**:
  - Order ID
  - Customer
  - Items
  - Status
  - Amount
  - Actions (View, Update Status)

---

### 2. FOOD MANAGEMENT PAGE
**URL**: `/admin/foods`

**Components**:
- **Page Header**:
  - Title: "Food Management"
  - "Add New Food" button

- **Foods Table**:
  - Image thumbnail
  - Name
  - Category
  - Price
  - Status (Active/Inactive)
  - Actions: Edit, Delete

- **Add/Edit Food Modal**:
  - Name input
  - Description textarea
  - Price input
  - Category select
  - Image upload
  - "Save" / "Cancel" buttons

---

### 3. ORDER MANAGEMENT PAGE
**URL**: `/admin/orders`

**Components**:
- **Filters**:
  - Status dropdown: All, Created, Preparing, Delivering, Delivered
  - Date range picker
  - Search by Order ID or Customer

- **Orders Table**:
  - Order ID
  - Customer
  - Items
  - Amount
  - Payment Method
  - Payment Status
  - Order Status
  - Actions: View Details, Update Status

- **Order Details Modal**:
  - Full order information
  - Customer details
  - Items list
  - Timeline
  - **Status Update Dropdown**:
    - CREATED → PREPARING
    - PREPARING → READY_TO_SHIP
    - READY_TO_SHIP → DELIVERING
    - DELIVERING → DELIVERED
  - "Update" button

---

## RESPONSIVE DESIGN

### Mobile (< 768px):
- Hamburger menu for navigation
- Single column layout
- Stack elements vertically
- Full-width buttons

### Tablet (768px - 1024px):
- 2 column grid for foods
- Collapsible sidebar for admin

### Desktop (> 1024px):
- 3-4 column grid for foods
- Fixed sidebar for admin
- Multi-column layouts

---

## COLOR SCHEME

### Primary Colors:
- **Primary**: #FF6347 (Tomato Red) - Buttons, CTAs
- **Secondary**: #FFA500 (Orange) - Highlights
- **Success**: #28A745 (Green) - Success messages, Delivered status
- **Warning**: #FFC107 (Yellow) - Preparing status
- **Danger**: #DC3545 (Red) - Cancel, Delete
- **Info**: #17A2B8 (Cyan) - Info badges

### Neutral Colors:
- **Background**: #FFFFFF (White)
- **Text**: #333333 (Dark Gray)
- **Border**: #E0E0E0 (Light Gray)
- **Disabled**: #CCCCCC (Gray)

---

## TYPOGRAPHY

- **Font Family**: 
  - Primary: Inter, system-ui, sans-serif
  - Fallback: Arial, Helvetica
- **Font Sizes**:
  - Heading 1: 32px
  - Heading 2: 24px
  - Heading 3: 20px
  - Body: 16px
  - Small: 14px

---

## ICONS

- **Library**: Font Awesome / React Icons
- **Cart Icon**: Shopping bag with badge
- **User Icon**: User circle
- **Search Icon**: Magnifying glass
- **Add/Remove**: Plus/Minus circle
- **Status Icons**: Check mark, Clock, Truck, Package

---

## INTERACTIONS

### Buttons:
- **Hover**: Darken color, scale up slightly
- **Active**: Scale down
- **Disabled**: Gray out, cursor not-allowed

### Forms:
- **Focus**: Blue border, shadow
- **Error**: Red border, error message below
- **Success**: Green border, checkmark

### Cards:
- **Hover**: Lift up (box-shadow), scale slightly
- **Click**: Navigate or open modal

---

## SCREENSHOTS / MOCKUPS

**Note**: Để có mockups hình ảnh, sử dụng tools:
- Figma (https://figma.com)
- Adobe XD
- Sketch
- Hoặc chụp screenshots từ website thực tế

**Hoặc**:
- Tạo folder `screenshots/` và đặt các file ảnh:
  - `home-page.png`
  - `menu-page.png`
  - `cart-page.png`
  - `checkout-page.png`
  - `orders-page.png`
  - `admin-dashboard.png`
  - `admin-foods.png`
  - `admin-orders.png`

---

**Version**: 1.0  
**Date**: 17-Dec-2025  
**Designer**: UI/UX Team

