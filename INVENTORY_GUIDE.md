# Inventory Management System Guide

## Overview

The Inventory Management System allows admins to:
- View all product inventory in real-time
- Track stock levels and reorder status
- Update stock quantities with reasons
- Search and filter inventory
- Get low stock alerts
- View inventory statistics
- Maintain audit trail of stock changes

## Features

### 📊 Real-Time Statistics
- **Total Products**: Count of all products
- **Total Stock**: Sum of all inventory
- **Average Stock**: Mean inventory across products
- **Low Stock Items**: Products below minimum threshold (5 units)
- **Out of Stock Items**: Products with zero inventory

### 🔍 Search & Filter
- Search by product name
- Filter by category
- Search by SKU
- Filter by stock status (All, Low, Out of Stock)

### ✏️ Stock Management
- Edit stock quantities directly
- Add reason for stock adjustments
- Automatic audit trail logging
- Batch stock updates

### ⚠️ Stock Status Indicators
- **✓ In Stock**: Stock ≥ 5 units
- **⚠ Low Stock**: Stock < 5 units
- **✗ Out of Stock**: Stock = 0 units

## Accessing Inventory

1. Navigate to Admin Dashboard
2. Click "📦 Inventory" button (next to View Store)
3. Or go to `/admin/inventory`

## How to Update Stock

### Single Product Update

1. Find the product in the inventory list
2. Click the "Edit" button in the Action column
3. Enter the quantity change:
   - **Positive number**: Add stock (e.g., "10" adds 10 units)
   - **Negative number**: Remove stock (e.g., "-5" removes 5 units)
4. Select adjustment reason from dropdown:
   - Manual adjustment
   - Stock received
   - Damaged goods
   - Return from customer
   - Inventory count correction
   - Transfer
5. Click "Save" to update

### Adjustment Reasons

Choose the appropriate reason for accurate inventory tracking:
- **Manual adjustment**: General inventory adjustments
- **Stock received**: New shipment arrived
- **Damaged goods**: Items removed due to damage
- **Return from customer**: Customer returned items
- **Inventory count correction**: Correction from physical count
- **Transfer**: Stock transferred to another location

## Filtering Options

### By Status
- **All Items**: View entire inventory
- **Low Stock**: Focus on items below 5 units
- **Out of Stock**: See items that need restocking

### By Search
- Type product name
- Type category
- Type SKU (Format: SKU-{product-id})

## Stock Levels Guide

### Recommended Stock Levels
- **Minimum Stock**: 5 units (triggers low stock warning)
- **Maximum Stock**: 100 units (can be adjusted per product)
- **Reorder Point**: When stock reaches 5 units

## Audit Trail

All stock changes are logged with:
- Product ID and name
- Quantity changed
- Reason for change
- Timestamp
- Admin who made the change

Access audit trail via Firestore `stock_logs` collection.

## Best Practices

### Daily Tasks
✓ Check low stock items each morning
✓ Plan reorders for critical items
✓ Update stock after receiving shipments

### Weekly Tasks
✓ Review total inventory levels
✓ Verify SKU accuracy
✓ Reconcile physical counts

### Monthly Tasks
✓ Analyze slow-moving inventory
✓ Update stock thresholds
✓ Review audit logs for discrepancies

## Common Tasks

### Receive New Stock
1. Go to Inventory → Inventory Management
2. Find the product
3. Click Edit
4. Enter positive quantity (e.g., "+20")
5. Select "Stock received" as reason
6. Click Save

### Remove Damaged Items
1. Click Edit on the product
2. Enter negative quantity (e.g., "-2")
3. Select "Damaged goods" as reason
4. Click Save

### Correct Inventory Count
1. After physical count, click Edit
2. Enter the adjustment needed (±)
3. Select "Inventory count correction"
4. Click Save

### Process Customer Return
1. Click Edit on the product
2. Enter positive quantity (e.g., "+1")
3. Select "Return from customer"
4. Click Save

## Statistics Dashboard

The stats box shows:
- **Total Products**: 50 (example)
- **Total Stock**: 450 units
- **Average Stock**: 9 units per product
- **Low Stock Items**: 8 items needing attention
- **Out of Stock**: 2 items not available

Use these metrics to:
- Assess overall inventory health
- Identify critical restocking needs
- Plan purchasing strategy

## Technical Details

### Stock Data
- Stored in `products.json`
- Updated in real-time
- Backed up with audit logs in Firestore

### API Endpoints
- `POST /api/inventory` - All inventory operations
  - `action: "update_stock"` - Update single product
  - `action: "batch_update"` - Update multiple products
  - `action: "search"` - Search inventory
  - `action: "stats"` - Get statistics
  - `action: "get_history"` - View audit trail

### Audit Logs
- Stored in Firestore `stock_logs` collection
- Never deleted (permanent record)
- Can be exported for analysis

## Troubleshooting

### Stock not updating?
1. Verify `products.json` is writable
2. Check browser console for errors
3. Refresh the page
4. Try updating a different product

### Statistics not accurate?
1. Click refresh in browser
2. Wait for load to complete
3. Clear browser cache
4. Check if products.json is properly formatted

### Audit trail missing?
1. Verify Firestore connection
2. Check Cloud Firestore permissions
3. Ensure `stock_logs` collection exists

## Integration with Orders

When orders are created:
- Stock is NOT automatically reduced
- Manual inventory adjustments required
- Create reminder to update stock when order ships

Future enhancement: Auto-reduce stock on order placement

## Future Features

Planned enhancements:
- 📦 Barcode scanning for quick updates
- 📊 Inventory analytics and trends
- 🔔 Automated low stock alerts via email
- 📦 Supplier management
- 📈 Demand forecasting
- 🏪 Multi-warehouse support

## Support

For issues with inventory management:
1. Check the audit logs in Firestore
2. Verify products.json formatting
3. Check browser console for errors
4. Review this guide's troubleshooting section

## Quick Reference

| Task | Steps |
|------|-------|
| View inventory | Go to `/admin/inventory` |
| Update stock | Click Edit → Enter qty → Select reason → Save |
| Search products | Type in search box |
| Filter by status | Use status dropdown |
| View statistics | Check stats grid at top |
| View low stock | Select "Low Stock" filter |
| Process return | Click Edit → +qty → "Return from customer" |
| Receive shipment | Click Edit → +qty → "Stock received" |

---

Last updated: 2026-08-05
