# Field Configuration Guide

This document explains how to manage field display across the Safari Journal application.

## Overview

The application uses a centralized field configuration system (`config/field-config.json`) to control which fields display on different pages and how they are labeled.

## Structure

### `field-config.json` Sections

#### 1. **fields**
Defines all available contact fields and their properties:

```json
"field_name": {
  "label": "Display Label",
  "displayOn": ["contacts"],
  "multiline": false,
  "type": "text"
}
```

**Properties:**
- `label`: The display label shown on the Contacts page
- `displayOn`: Array of pages where this field appears (`["contacts"]` for most fields)
- `multiline`: Optional - set to `true` for multi-line text like `notes` or `comment`
- `type`: Optional - `"url"`, `"image"`, `"phone"`, `"text"` (defaults to `"text"`)
- `system`: Optional - set to `true` for system fields like `name` and `category`

#### 2. **pageConfigs**
Defines display behavior for each page:

```json
"itinerary": {
  "showContactButton": true,
  "filterContactInfo": true,
  "displayFields": []
}
```

**Itinerary Page:**
- `showContactButton`: Shows "View contact" button in event cards
- `filterContactInfo`: Removes phone/email from Details text
- `displayFields`: (empty for itinerary - it shows minimal info)

**Contacts Page:**
- `displayFields`: List of field names to display in order

## Adding a New Field

### Step 1: Add field definition
```json
"my_new_field": {
  "label": "My New Field Label",
  "displayOn": ["contacts"],
  "multiline": false
}
```

### Step 2: Update displayFields if needed
If you want it on the contacts page, add it to:
```json
"pageConfigs": {
  "contacts": {
    "displayFields": [
      "name",
      "category",
      ...
      "my_new_field"
    ]
  }
}
```

### Step 3: Add to contacts.json
Add your new field to the contact entry:
```json
{
  "name": "Provider Name",
  "category": "stay",
  "my_new_field": "value",
  ...
}
```

## Examples

### Example 1: Adding a booking reference field
```json
"booking_reference": {
  "label": "Booking Reference",
  "displayOn": ["contacts"]
}
```

### Example 2: Adding multi-line instructions
```json
"special_instructions": {
  "label": "Special Instructions",
  "displayOn": ["contacts"],
  "multiline": true
}
```

## Current Field Mappings

All fields defined in `field-config.json` are automatically mapped and displayed. The system:

1. **Itinerary Page**: Shows minimal contact info (just address line)
2. **Contacts Page**: Shows all fields defined in `pageConfigs.contacts.displayFields`

## Maintenance

When modifying fields:
- Always update `config/field-config.json` first
- Update contact entries in `config/contacts.json` with the new data
- The application automatically uses the configuration—no code changes needed

This ensures consistent field handling across all pages and makes it easy to onboard new fields.
