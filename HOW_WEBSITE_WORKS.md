# KejaMarket - How the Website Works

## 🏠 **Core Business Model**

KejaMarket is a **Real Estate & Rental Property Marketplace** for Kenya. It's like OLX/Airbnb but specifically for:
- 🏘️ Rental apartments, houses, rooms
- 🏢 Commercial spaces
- 🛏️ Short-term rentals (Airbnb style)
- 🛍️ Services (plumbers, electricians, etc.)
- 📦 Marketplace items

---

## 👥 **User Types & Roles**

### 1. **Tenants / Renters** (looking for properties)
- Browse properties
- View landlord contact info
- Message landlord
- Save favorites
- Apply/Book properties

### 2. **Landlords** (listing properties)
- Post rental properties
- Manage listings
- Receive inquiries from tenants
- Approve/reject applications
- Communicate with tenants

### 3. **Service Providers** (tradespeople)
- Post services (plumbing, electrical work, etc.)
- Get customer inquiries
- Manage service requests

### 4. **Marketplace Sellers**
- Sell items (furniture, appliances, etc.)
- Manage inventory

### 5. **Admins**
- Moderate listings
- Manage users
- Review reports
- Approve/reject suspicious listings

---

## 🔍 **Step 1: Tenant Browsing Properties**

### What Happens:

1. **Tenant Visits Homepage**
   - Sees 161 properties in a grid
   - Can filter by: Category, Price, Bedrooms, Location, etc.
   - Can search by keyword

2. **Tenant Clicks on a Property Card**
   - Opens property detail page
   - Shows:
     - ✅ Property images/gallery
     - ✅ Full description
     - ✅ **Price (rent amount)**
     - ✅ Bedrooms, bathrooms, square feet
     - ✅ **Location details** (area, suburb, exact address)
     - ✅ **Amenities** (water, electricity, parking, etc.)
     - ✅ **Landlord name & photo**
     - ✅ **Contact button** ("Contact Landlord")

---

## 📞 **Step 2: Viewing Landlord Contact Info**

### Current Behavior (in your app):

```
When tenant clicks "Contact Landlord" button:
↓
1. **If Tenant is NOT logged in:**
   - Redirect to Login page
   - Tenant must create account or sign in with Google
   
2. **If Tenant IS logged in:**
   - Show landlord contact details:
     ✅ Landlord name
     ✅ Phone number
     ✅ Email address
     ✅ WhatsApp button (if available)
     ✅ Message form (in-app messaging)
   
3. **Tenant can:**
   - Call landlord
   - Send WhatsApp message
   - Send email
   - Use in-app messaging system
```

### Database Flow:

```
GET /api/properties/:id
  ↓
Returns: {
  id: "km-prop-001",
  title: "Cozy Studio BNB - Kilimani",
  landlordName: "James Mwangi",
  landlordPhone: "+254712345678",
  landlordEmail: "james.mwangi@gmail.com",
  exact_location: "Kilimani, Nairobi",
  latitude: -1.2921,
  longitude: 36.8219,
  // ... other property details
}
```

---

## 💳 **Step 3: Subscription / Booking System**

### Current Implementation:

The website **DOES NOT YET HAVE:**
- ❌ Subscription plans
- ❌ Booking/reservation system
- ❌ Payment processing
- ❌ Rental agreements

### What Currently Exists:

✅ **Direct Contact System**
- Tenants see landlord contact
- Tenants contact landlord directly
- Landlord and tenant negotiate outside the app

✅ **M-Pesa Integration** (ready but not wired to bookings)
- Can accept payments
- Currently used for: Admin transactions, donations
- NOT yet connected to property bookings

---

## 🔄 **How a Booking SHOULD Work (Future Implementation)**

```
BOOKING FLOW (To be implemented):

1. Tenant Selects Property
   ↓
2. Tenant Clicks "Book Now" or "Request Rental"
   ↓
3. System Shows:
   - Check-in date selector
   - Check-out date selector (or rental period: 1 month, 3 months, 1 year, etc.)
   - Total price calculation
   ↓
4. Tenant Confirms Booking
   ↓
5. Payment Options:
   - M-Pesa (charge via phone)
   - Bank transfer
   - Card payment (Stripe/Pesapal)
   ↓
6. Payment Processing
   ↓
7. Booking Confirmation:
   - Email sent to tenant & landlord
   - In-app notification
   - Rental agreement generated
   - Move-in date scheduled
   ↓
8. Funds Held (Escrow):
   - Money held in KejaMarket account
   - Not released to landlord until move-in confirmed
   - Protects both parties
   ↓
9. Move-In Confirmation:
   - Tenant confirms moved in
   - Landlord confirms occupied
   - Funds released to landlord (minus commission)
```

---

## 💰 **Subscription Plans (To be implemented)**

### Option A: **Tenant Subscription**

```
FREE TIER:
- Browse properties ✅
- View limited contact info (email only)
- 1 message per property

PREMIUM TIER ($2.99/month):
- Full landlord contact (phone, email, WhatsApp)
- Unlimited messages
- Save unlimited favorites
- Priority support

VIP TIER ($9.99/month):
- Everything in Premium
- Direct landlord chat with response guarantee
- Property alerts (email when new properties match criteria)
- Virtual tours access
```

### Option B: **Landlord Subscription**

```
FREE TIER:
- Post 1 property
- Basic listing (title, description, 5 photos)
- Receive inquiries (but limited)

BASIC TIER ($4.99/month):
- Post 5 properties
- Enhanced listings (unlimited photos, video tours)
- Manage applicants
- In-app messaging

PREMIUM TIER ($14.99/month):
- Unlimited properties
- Featured listings (appears at top)
- Social media sharing
- Advanced analytics
- Rental agreement templates

PRO TIER ($29.99/month):
- Everything in Premium
- Tenant verification service
- Background check integration
- Property insurance discounts
```

---

## 📊 **Current Data Structure**

### Properties Table:

```
{
  id: "km-prop-001",
  title: "Cozy Studio BNB - Kilimani",
  category: "Studio",
  rentKes: 18500,
  bedrooms: 1,
  bathrooms: 1,
  estateSuburb: "Kilimani",
  county: "Nairobi",
  exactLocation: "Off Ngong Road, Kilimani",
  latitude: -1.2921,
  longitude: 36.8219,
  landlordId: "usr-landlord-01",
  landlordName: "James Mwangi",
  landlordPhone: "+254712345678",
  landlordEmail: "james.mwangi@gmail.com",
  photos: ["photo1.jpg", "photo2.jpg", ...],
  amenities: ["WiFi", "Parking", "Water Supply", ...],
  description: "...",
  status: "approved",
  is_verified: true,
  created_at: "2026-10-17T12:00:00Z"
}
```

### Users Table:

```
{
  id: "usr-tenant-01",
  name: "Grace Wanjiku",
  phone: "+254722000111",
  email: "grace.wanjiku@gmail.com",
  role: "tenant",
  isVerified: true,
  isPhoneVerified: true,
  favorites: ["km-prop-001", "km-prop-005", ...],
  subscription: "free" | "premium" | "vip",
  subscriptionExpiry: "2026-11-17",
  created_at: "2026-09-01T12:00:00Z"
}
```

---

## 🔐 **Security & Privacy**

### Landlord Contact Protection:

```
PUBLIC (visible to anyone):
- Landlord name
- Area/location
- Property photos
- Price
- Amenities

REQUIRES LOGIN (visible only to logged-in tenants):
- Phone number
- Email address
- Exact address/coordinates
- WhatsApp link

REQUIRES ADMIN APPROVAL (for verified listings):
- Background check status
- Verification badge
- Property insurance status
```

---

## 💬 **Messaging System**

### How In-App Messaging Works:

```
1. Tenant clicks "Contact Landlord"
   ↓
2. Opens chat interface
   ↓
3. Tenant can send messages:
   - "Hi, is this still available?"
   - "Can I view on Saturday?"
   - "What's the deposit amount?"
   ↓
4. Landlord receives in-app notification
   ↓
5. Landlord responds in-app
   ↓
6. Conversation history saved
   ↓
7. Can escalate to phone/email if needed
```

---

## 📱 **Mobile App Flow**

### On Mobile (what you see at ≤768px):

```
HOME SCREEN:
- Logo + Search bar
- Featured listings (2-column grid)
- Filter button
- Bottom navigation

TAP ON PROPERTY:
- Full-screen property view
- Gallery/swipe photos
- Property details
- "Contact Landlord" button

TAP "Contact Landlord":
- Shows landlord info
- Options: Call, WhatsApp, Email, Message
- Can apply/book
```

---

## 🚀 **What's Ready to Implement Next**

### Quick Wins (1-2 weeks):
1. ✅ Booking system (reserve dates)
2. ✅ M-Pesa payment integration
3. ✅ Tenant verification (email verification)
4. ✅ Review system for properties

### Medium Effort (2-4 weeks):
1. Subscription plans
2. Advanced search filters
3. Property tour scheduling
4. Rental agreement templates
5. Landlord approval workflow

### Longer Term (1-3 months):
1. AI property recommendations
2. Virtual property tours (360° photos)
3. Background check integration
4. Insurance partnerships
5. Moving company partnerships

---

## 💡 **Bottom Line**

**Right now:** Tenants can see properties, landlord contact info, and message landlords directly.

**What's missing:** Automated booking, payment processing, and subscription management.

**To complete:** Wire up the M-Pesa payment system, create booking workflow, and implement subscription tiers.

Would you like me to:
1. Add the booking/reservation system?
2. Implement subscription plans?
3. Connect M-Pesa payments?
4. Build the rental agreement system?

Let me know which feature you want to prioritize! 🎯
