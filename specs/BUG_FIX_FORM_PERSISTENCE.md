# Bug Fix: Form Data Persistence When Creating New Car

## Problem Description
When viewing a car's details page (`/car-details/:id`) and clicking "Add car" in the header, the form would navigate to `/car-details` but retain field values from the previously viewed car instead of showing empty fields for a new car.

**Initial Fix**: Text input fields cleared properly, but Select dropdowns (year, color, engine type, license plate, transmission, oil type, etc.) still retained their previous values.

## Root Cause

### Primary Issue
The issue was in the `CarDetails` component's initialization logic (`src/components/car-details.tsx`):

1. When navigating from `/car-details/:id` to `/car-details`, the `id` parameter changes from a string to `undefined`
2. The `useEffect` hook that handles data fetching would detect `!id` and simply return early
3. **The form was never reset**, so it retained all the data from the previously viewed car

### Secondary Issue (Select Dropdowns)
After the initial fix, Select dropdowns still persisted because:

1. **Type Mismatch**: The form reset was setting optional fields to `undefined`, but React's `Select` component can't properly handle `undefined` as a value
2. **Value Prop Handling**: The Select components were using `value={field.value || undefined}`, which still passes the old value when it exists
3. **Empty String vs Undefined**: Select components need an empty string `''` to display the placeholder, not `undefined`

## The Complete Fix

### Part 1: Reset Form on Navigation (car-details.tsx)
Updated the `useEffect` hook to properly reset the form when `id` is `undefined`:

```typescript
if (!id) {
  // When there's no id (new car), reset the form to default values
  form.reset({
    make: '',
    model: '',
    owner_name: '',
    year: null,           // numeric field uses null (matches schema)
    color: '',            // changed from undefined to ''
    license_plate: '',    // changed from undefined to ''
    engine_type: '',      // changed from undefined to ''
    transmission_type: '', // changed from undefined to ''
    fuel_type: '',        // changed from undefined to ''
    drive_type: '',       // changed from undefined to ''
    trim: '',             // changed from undefined to ''
    oil_type: '',         // changed from undefined to ''
    vin: '',              // changed from undefined to ''
    jobs: [defaultJob]
  });
  setPhotos([]);
  setPendingUploads([]);
  setIsEditMode(false);
  setIsLoading(false);
  return;
}
```

### Part 2: Update Select Components (car-form-section.tsx)
Changed all Select components to use empty string instead of undefined:

```typescript
// Before (buggy):
<Select onValueChange={field.onChange} value={field.value || undefined}>

// After (fixed):
<Select onValueChange={field.onChange} value={field.value || ''}>
```

This was applied to all dropdown fields:
- `engine_type`
- `transmission_type`
- `fuel_type`
- `drive_type`
- `oil_type`

### Part 3: Consistent Reset in isExistingCar Effect
Also updated the secondary reset logic that triggers when toggling between new/existing car modes to use empty strings instead of undefined.

## Why This Works

1. **Empty String for Select & Text**: React's Select and Input components treat empty string `''` as "no selection" and properly display the placeholder
2. **Null for Number Fields**: The `year` field (number input) uses `null` which matches the schema type (`z.number().optional().nullable()`) and the Input component properly handles it with `value={field.value || ''}`
3. **Consistent Behavior**: All optional fields now consistently use appropriate empty values ('' for strings, null for numbers), making the form state predictable

## What Changed
1. **Form Reset**: All optional string fields now reset to empty strings instead of `undefined`
2. **Clear State**: Photos, pending uploads, and edit mode are properly cleared
3. **Select Value Props**: All Select components now handle empty values correctly
4. **Consistent Resets**: Both reset locations (navigation and toggle) use the same pattern

## Impact
- ✅ Clicking "Add car" now properly shows empty form fields
- ✅ All Select dropdowns show placeholders instead of previous values
- ✅ Text inputs remain cleared as expected
- ✅ No data persists from previously viewed cars
- ✅ Photos and pending uploads are cleared
- ✅ Form validation starts fresh

## Testing
To verify the complete fix:
1. Navigate to any existing car's details page (`/car-details/:id`)
2. Fill in or note values in ALL fields including:
   - Text fields (make, model, owner, color, license plate, VIN)
   - Number fields (year)
   - Select dropdowns (engine type, transmission, fuel type, drive type, oil type)
3. Click "Add car" in the header
4. Verify ALL fields are now empty with proper placeholders
5. Verify no photos are shown
6. Verify the title shows "New Car"

## Files Modified
- `src/components/car-details.tsx` - Updated two form reset locations to use empty strings
- `src/components/car-form-section.tsx` - Updated all Select components to handle empty string values
