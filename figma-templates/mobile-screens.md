# Bus Express - Mobile Screens Template

## 📱 Mobile-Responsive Design

### 1. Mobile Home Page (375px)

#### Mobile Layout
```
┌─────────────────────────┐
│  Bus Express    [☰]    │
├─────────────────────────┤
│                         │
│  Find Your Perfect      │
│  Bus Journey            │
│                         │
│  ┌─────────────────────┐ │
│  │ From: [Delhi ▼]    │ │
│  │ To: [Mumbai ▼]     │ │
│  │ Date: [Today ▼]    │ │
│  │ Passengers: [2 ▼]  │ │
│  │                     │ │
│  │ ┌─────────────────┐ │ │
│  │ │  Search Buses   │ │ │
│  │ └─────────────────┘ │ │
│  └─────────────────────┘ │
│                         │
│  Popular Routes:         │
│  [Delhi→Mumbai]          │
│  [Mumbai→Pune]           │
│  [Delhi→Jaipur]          │
│                         │
│  Featured Buses:         │
│  ┌─────────────────────┐ │
│  │ Bus Card 1          │ │
│  │ [Bus details]       │ │
│  │ [Book Now]          │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ Bus Card 2          │ │
│  │ [Bus details]       │ │
│  │ [Book Now]          │ │
│  └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

#### Mobile Home Components
```css
.mobile-home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 100%);
}

.mobile-header {
  background: #FFFFFF;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-logo {
  font-size: 20px;
  font-weight: 700;
  color: #1890FF;
}

.mobile-menu-button {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  font-size: 20px;
  color: #262626;
  cursor: pointer;
}

.mobile-hero {
  padding: 32px 16px;
  text-align: center;
}

.mobile-hero-title {
  font-size: 28px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 8px;
  line-height: 1.2;
}

.mobile-hero-subtitle {
  font-size: 16px;
  color: #8C8C8C;
  margin-bottom: 32px;
}

.mobile-search-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(24, 144, 255, 0.1);
  margin-bottom: 32px;
}

.mobile-search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mobile-search-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-search-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.mobile-search-input {
  height: 48px;
  padding: 12px 16px;
  border: 1px solid #D9D9D9;
  border-radius: 8px;
  font-size: 16px;
}

.mobile-search-button {
  height: 48px;
  background: #1890FF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.mobile-popular-routes {
  margin-bottom: 32px;
}

.mobile-popular-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  text-align: center;
}

.mobile-route-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-route-tag {
  background: #FFFFFF;
  border: 1px solid #E8E8E8;
  border-radius: 24px;
  padding: 12px 16px;
  font-size: 14px;
  color: #1890FF;
  cursor: pointer;
  text-align: center;
}

.mobile-featured-buses {
  padding: 0 16px;
}

.mobile-featured-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  text-align: center;
}

.mobile-bus-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.mobile-bus-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.mobile-bus-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.mobile-bus-price {
  font-size: 18px;
  font-weight: 700;
  color: #1890FF;
}

.mobile-bus-timing {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  padding: 12px 0;
  border-top: 1px solid #F0F0F0;
  border-bottom: 1px solid #F0F0F0;
}

.mobile-departure-time {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.mobile-duration {
  font-size: 12px;
  color: #8C8C8C;
  text-align: center;
}

.mobile-arrival-time {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.mobile-bus-features {
  display: flex;
  gap: 8px;
  margin: 12px 0;
  flex-wrap: wrap;
}

.mobile-bus-feature {
  font-size: 10px;
  color: #52C41A;
  background: #F6FFED;
  padding: 4px 6px;
  border-radius: 4px;
}

.mobile-bus-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.mobile-book-button {
  flex: 1;
  height: 40px;
  background: #1890FF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
```

### 2. Mobile Search Results (375px)

#### Mobile Layout
```
┌─────────────────────────┐
│  ← Back    Search Results │
├─────────────────────────┤
│                         │
│  Delhi → Mumbai         │
│  Today | 2 Passengers   │
│                         │
│  ┌─────────────────────┐ │
│  │ Filters: [All ▼]   │ │
│  │ Sort: [Price ▼]    │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ Bus 001            │ │
│  │ AC Sleeper         │ │
│  │ 10:00 AM - 6:00 PM │ │
│  │ ₹600 per person    │ │
│  │ [Select Seats]     │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ Bus 002            │ │
│  │ Non-AC             │ │
│  │ 11:00 AM - 7:00 PM │ │
│  │ ₹400 per person    │ │
│  │ [Select Seats]     │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ Bus 003            │ │
│  │ AC Sleeper         │ │
│  │ 12:00 PM - 8:00 PM │ │
│  │ ₹550 per person    │ │
│  │ [Select Seats]     │ │
│  └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

#### Mobile Search Results Components
```css
.mobile-search-results-container {
  min-height: 100vh;
  background: #F8F9FA;
}

.mobile-search-results-header {
  background: #FFFFFF;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-back-button {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  font-size: 20px;
  color: #262626;
  cursor: pointer;
}

.mobile-search-results-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  flex: 1;
}

.mobile-search-summary {
  background: #FFFFFF;
  padding: 16px;
  border-bottom: 1px solid #E8E8E8;
}

.mobile-search-route {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.mobile-search-details {
  font-size: 14px;
  color: #8C8C8C;
}

.mobile-search-filters {
  background: #FFFFFF;
  padding: 16px;
  border-bottom: 1px solid #E8E8E8;
  display: flex;
  gap: 12px;
}

.mobile-filter-button {
  flex: 1;
  height: 36px;
  background: #F5F5F5;
  border: 1px solid #D9D9D9;
  border-radius: 8px;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.mobile-filter-button.active {
  background: #E6F7FF;
  border-color: #1890FF;
  color: #1890FF;
}

.mobile-search-results-content {
  padding: 16px;
}

.mobile-bus-result-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.mobile-bus-result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.mobile-bus-result-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.mobile-bus-result-type {
  font-size: 12px;
  color: #8C8C8C;
  background: #F5F5F5;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.mobile-bus-result-price {
  text-align: right;
}

.mobile-bus-result-amount {
  font-size: 18px;
  font-weight: 700;
  color: #1890FF;
}

.mobile-bus-result-per-person {
  font-size: 12px;
  color: #8C8C8C;
}

.mobile-bus-result-timing {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  padding: 12px 0;
  border-top: 1px solid #F0F0F0;
  border-bottom: 1px solid #F0F0F0;
}

.mobile-bus-result-departure {
  text-align: left;
}

.mobile-bus-result-departure-time {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.mobile-bus-result-departure-place {
  font-size: 12px;
  color: #8C8C8C;
}

.mobile-bus-result-duration {
  text-align: center;
  flex: 1;
  margin: 0 16px;
}

.mobile-bus-result-duration-text {
  font-size: 12px;
  color: #8C8C8C;
  margin-bottom: 4px;
}

.mobile-bus-result-duration-line {
  height: 1px;
  background: #D9D9D9;
  position: relative;
}

.mobile-bus-result-duration-line::before {
  content: "🚌";
  position: absolute;
  left: 50%;
  top: -8px;
  transform: translateX(-50%);
  background: #F8F9FA;
  padding: 0 8px;
}

.mobile-bus-result-arrival {
  text-align: right;
}

.mobile-bus-result-arrival-time {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.mobile-bus-result-arrival-place {
  font-size: 12px;
  color: #8C8C8C;
}

.mobile-bus-result-features {
  display: flex;
  gap: 8px;
  margin: 12px 0;
  flex-wrap: wrap;
}

.mobile-bus-result-feature {
  font-size: 10px;
  color: #52C41A;
  background: #F6FFED;
  padding: 4px 6px;
  border-radius: 4px;
}

.mobile-bus-result-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.mobile-select-seats-button {
  flex: 1;
  height: 40px;
  background: #FFFFFF;
  color: #1890FF;
  border: 1px solid #1890FF;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.mobile-book-now-button {
  flex: 1;
  height: 40px;
  background: #1890FF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
```

### 3. Mobile Seat Selection (375px)

#### Mobile Layout
```
┌─────────────────────────┐
│  ← Back    Select Seats │
├─────────────────────────┤
│                         │
│  Bus 001 (AC Sleeper)   │
│  Delhi → Mumbai         │
│                         │
│  ┌─────────────────────┐ │
│  │    Lower Deck       │ │
│  │                     │ │
│  │ 1  2  3  4  5  6    │ │
│  │ 7  8  9  10 11 12   │ │
│  │ 13 14 15 16 17 18   │ │
│  │ 19 20 21 22 23 24   │ │
│  │                     │ │
│  │    Upper Deck       │ │
│  │                     │ │
│  │ 25 26 27 28 29 30   │ │
│  │ 31 32 33 34 35 36   │ │
│  │ 37 38 39 40 41 42   │ │
│  │ 43 44 45 46 47 48   │ │
│  └─────────────────────┘ │
│                         │
│  Legend:                 │
│  🟢 Available 🔴 Occupied │
│  🟡 Selected 🟣 Ladies   │
│                         │
│  ┌─────────────────────┐ │
│  │ Selected: 12, 13    │ │
│  │ Total: ₹1,200       │ │
│  │ [Continue to Payment]│ │
│  └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

#### Mobile Seat Selection Components
```css
.mobile-seat-selection-container {
  min-height: 100vh;
  background: #F8F9FA;
}

.mobile-seat-selection-header {
  background: #FFFFFF;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-seat-back-button {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  font-size: 20px;
  color: #262626;
  cursor: pointer;
}

.mobile-seat-selection-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  flex: 1;
}

.mobile-seat-selection-info {
  background: #FFFFFF;
  padding: 16px;
  border-bottom: 1px solid #E8E8E8;
}

.mobile-seat-bus-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.mobile-seat-route {
  font-size: 14px;
  color: #8C8C8C;
}

.mobile-seat-map-container {
  background: #FFFFFF;
  padding: 16px;
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.mobile-seat-deck {
  margin-bottom: 24px;
}

.mobile-seat-deck-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
  text-align: center;
}

.mobile-seat-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}

.mobile-seat {
  width: 32px;
  height: 32px;
  border: 1px solid #D9D9D9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-seat.available {
  background: #F6FFED;
  border-color: #B7EB8F;
  color: #52C41A;
}

.mobile-seat.available:hover {
  background: #D9F7BE;
  transform: scale(1.1);
}

.mobile-seat.occupied {
  background: #FFF2F0;
  border-color: #FFCCC7;
  color: #FF4D4F;
  cursor: not-allowed;
}

.mobile-seat.selected {
  background: #E6F7FF;
  border-color: #91D5FF;
  color: #1890FF;
  transform: scale(1.1);
}

.mobile-seat.ladies {
  background: #FFF0F6;
  border-color: #FFADD2;
  color: #EB2F96;
}

.mobile-seat.ladies.available:hover {
  background: #FFD6E7;
}

.mobile-seat-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 16px;
}

.mobile-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #595959;
}

.mobile-legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #D9D9D9;
}

.mobile-legend-color.available {
  background: #F6FFED;
  border-color: #B7EB8F;
}

.mobile-legend-color.occupied {
  background: #FFF2F0;
  border-color: #FFCCC7;
}

.mobile-legend-color.selected {
  background: #E6F7FF;
  border-color: #91D5FF;
}

.mobile-legend-color.ladies {
  background: #FFF0F6;
  border-color: #FFADD2;
}

.mobile-seat-summary {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  border-top: 1px solid #E8E8E8;
}

.mobile-seat-summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mobile-selected-seats {
  font-size: 14px;
  color: #262626;
}

.mobile-total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #1890FF;
}

.mobile-continue-button {
  width: 100%;
  height: 48px;
  background: #1890FF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.mobile-continue-button:disabled {
  background: #D9D9D9;
  cursor: not-allowed;
}
```

### 4. Mobile Booking Confirmation (375px)

#### Mobile Layout
```
┌─────────────────────────┐
│  ← Back    Confirmation │
├─────────────────────────┤
│                         │
│  ✅ Booking Confirmed!  │
│                         │
│  ┌─────────────────────┐ │
│  │ Booking Reference:  │ │
│  │ BE20241201001       │ │
│  │ Status: Confirmed   │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ Journey Details:    │ │
│  │ • Delhi → Mumbai    │ │
│  │ • Dec 1, 2024      │ │
│  │ • 10:00 AM - 6:00 PM│ │
│  │ • Bus 001 (AC)     │ │
│  │ • Seats: 12, 13    │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ Passenger Details:  │ │
│  │ • John Doe (Seat 12)│ │
│  │ • Jane Smith (Seat 13)│ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ Payment Details:    │ │
│  │ • Amount: ₹1,200    │ │
│  │ • Method: Card      │ │
│  │ • TXN: 123456789    │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ [Download Ticket]   │ │
│  │ [Email Ticket]      │ │
│  └─────────────────────┘ │
│                         │
│  ┌─────────────────────┐ │
│  │ [View Bookings]     │ │
│  │ [Book Another]      │ │
│  └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

#### Mobile Booking Confirmation Components
```css
.mobile-booking-confirmation-container {
  min-height: 100vh;
  background: #F8F9FA;
}

.mobile-booking-confirmation-header {
  background: #FFFFFF;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-confirmation-back-button {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  font-size: 20px;
  color: #262626;
  cursor: pointer;
}

.mobile-confirmation-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  flex: 1;
}

.mobile-confirmation-content {
  padding: 16px;
}

.mobile-confirmation-success {
  text-align: center;
  margin-bottom: 24px;
}

.mobile-confirmation-icon {
  font-size: 48px;
  color: #52C41A;
  margin-bottom: 16px;
}

.mobile-confirmation-message {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.mobile-confirmation-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.mobile-confirmation-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8E8E8;
}

.mobile-confirmation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.mobile-confirmation-item:last-child {
  border-bottom: none;
}

.mobile-confirmation-label {
  font-size: 14px;
  color: #8C8C8C;
}

.mobile-confirmation-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.mobile-confirmation-reference {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.mobile-confirmation-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #F6FFED;
  color: #52C41A;
}

.mobile-confirmation-amount {
  font-weight: 700;
  color: #1890FF;
}

.mobile-confirmation-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}

.mobile-confirmation-action-button {
  height: 48px;
  background: #FFFFFF;
  color: #1890FF;
  border: 1px solid #1890FF;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-confirmation-action-button:hover {
  background: #E6F7FF;
}

.mobile-confirmation-navigation {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-confirmation-nav-button {
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-confirmation-nav-button.primary {
  background: #1890FF;
  color: #FFFFFF;
  border: none;
}

.mobile-confirmation-nav-button.primary:hover {
  background: #096DD9;
}

.mobile-confirmation-nav-button.secondary {
  background: #FFFFFF;
  color: #1890FF;
  border: 1px solid #1890FF;
}

.mobile-confirmation-nav-button.secondary:hover {
  background: #E6F7FF;
}
```

### 5. Mobile Navigation Menu

#### Mobile Layout
```
┌─────────────────────────┐
│  Bus Express    [×]    │
├─────────────────────────┤
│                         │
│  Welcome, John!         │
│  john@email.com         │
│                         │
│  ┌─────────────────────┐ │
│  │ 🏠 Home             │ │
│  │ 🚌 My Bookings      │ │
│  │ 👤 Profile          │ │
│  │ ⚙️ Settings         │ │
│  │ 📞 Support          │ │
│  │ 📋 About            │ │
│  │ 🚪 Logout           │ │
│  └─────────────────────┘ │
│                         │
│  Version 1.0.0          │
│                         │
└─────────────────────────┘
```

#### Mobile Navigation Components
```css
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.mobile-nav-menu {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: #FFFFFF;
  z-index: 1001;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.mobile-nav-menu.open {
  transform: translateX(0);
}

.mobile-nav-header {
  padding: 16px;
  border-bottom: 1px solid #E8E8E8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-nav-logo {
  font-size: 20px;
  font-weight: 700;
  color: #1890FF;
}

.mobile-nav-close {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  font-size: 20px;
  color: #262626;
  cursor: pointer;
}

.mobile-nav-user {
  padding: 16px;
  border-bottom: 1px solid #E8E8E8;
}

.mobile-nav-user-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.mobile-nav-user-email {
  font-size: 14px;
  color: #8C8C8C;
}

.mobile-nav-items {
  padding: 16px 0;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #262626;
  text-decoration: none;
  transition: all 0.2s ease;
}

.mobile-nav-item:hover {
  background: #E6F7FF;
  color: #1890FF;
}

.mobile-nav-item.active {
  background: #E6F7FF;
  color: #1890FF;
  font-weight: 500;
  border-right: 3px solid #1890FF;
}

.mobile-nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-nav-text {
  font-size: 16px;
}

.mobile-nav-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid #E8E8E8;
  text-align: center;
}

.mobile-nav-version {
  font-size: 12px;
  color: #8C8C8C;
}
```

This comprehensive mobile screen template provides all the necessary components and layouts for a complete mobile-responsive experience in your Bus Express application! 📱✨
