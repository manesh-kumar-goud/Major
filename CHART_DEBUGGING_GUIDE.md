# Chart Debugging Guide

## 🔍 Troubleshooting Chart Not Showing

### Step 1: Check Browser Console (F12)

Open DevTools and check the Console tab. You should see:
- `Prediction response:` - Full API response
- `Historical data:` - Historical data structure
- `Future predictions:` - Future predictions structure
- `Chart data prepared:` - Processed chart data

### Step 2: Verify Data Structure

The backend should return:
```json
{
  "historical_data": {
    "dates": ["2025-01-01", "2025-01-02", ...],
    "actual": [150.0, 151.5, ...],
    "predicted": [150.2, 151.3, ...]
  },
  "future_predictions": {
    "dates": ["2025-02-01", "2025-02-02", ...],
    "predictions": [155.0, 156.5, ...]
  }
}
```

### Step 3: Check Chart Data

In console, check:
```javascript
// Should show array of objects
console.log(chartData)
// Each object should have: { date, actual, predicted, type }
```

### Step 4: Common Issues

1. **Empty chartData**
   - Check if `results.historical_data` exists
   - Check if `results.future_predictions` exists
   - Verify arrays are not empty

2. **Chart container not visible**
   - Check CSS: `minHeight: '500px'` should be set
   - Verify ResponsiveContainer has `height={450}`

3. **Recharts not rendering**
   - Verify Recharts is installed: `npm list recharts`
   - Check for React errors in console

4. **Data format issues**
   - Dates should be strings
   - Values should be numbers (not strings)
   - No null/undefined in required fields

### Step 5: Manual Test

Add this to console:
```javascript
// Test chart rendering
const testData = [
  { date: '2025-01-01', actual: 150, predicted: 151 },
  { date: '2025-01-02', actual: 151, predicted: 152 },
  { date: '2025-01-03', actual: 152, predicted: 153 }
]
console.log('Test data:', testData)
```

### Step 6: Network Check

1. Open Network tab in DevTools
2. Make a prediction request
3. Check `/api/predictions/predict` response
4. Verify response has correct structure

### Step 7: React DevTools

1. Install React DevTools extension
2. Inspect `Prediction` component
3. Check `results` state
4. Check `chartData` computed value

## 🛠️ Quick Fixes Applied

1. ✅ Added `useMemo` for chart data processing
2. ✅ Better error handling and logging
3. ✅ Fixed chart container dimensions
4. ✅ Improved data validation
5. ✅ Added debug info in empty state
6. ✅ Better tooltip formatting
7. ✅ Fixed Y-axis domain

## 📝 Next Steps

1. **Refresh browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Clear cache** if needed
3. **Make a new prediction**
4. **Check console logs**
5. **Report any errors** you see

## 🐛 If Still Not Working

1. Check backend logs for prediction response
2. Verify API endpoint returns correct data
3. Check for CORS issues
4. Verify Recharts version compatibility
5. Check React version compatibility




