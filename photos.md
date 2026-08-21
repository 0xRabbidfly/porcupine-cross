# Prologue Cross Photo Management Guide

## Overview

This guide provides complete instructions for managing photos for the Prologue Cross cyclocross event. The system supports high-resolution photo downloads, thumbnail generation, and an automated gallery with infinite scroll and lightbox functionality.

## 📁 Directory Structure

```
photos/
└── event-2026/                    # Update year as needed
    ├── high-res/                  # Full resolution photos (keep original quality)
    ├── thumbnails/               # Web-optimized thumbnails (300-400px width)
    └── photos.json               # Metadata file (auto-generated)
```

## 🚀 Quick Start Checklist

- [ ] Create new event directory: `photos/event-2026/`
- [ ] Set up subdirectories: `high-res/` and `thumbnails/`
- [ ] Upload high-resolution photos to `high-res/`
- [ ] Generate thumbnails (see Thumbnail Generation section)
- [ ] Update and run `generate-metadata.ps1`
- [ ] Upload all files to web server
- [ ] Update `photos.html` with new year
- [ ] Test gallery functionality

## 📸 Photo Requirements

### High-Resolution Photos

- **Format**: JPG/JPEG only
- **Quality**: Keep original quality (no compression)
- **Naming**: Use consistent naming convention (e.g., `IMG_001.jpg`, `DSC_1234.jpg`)
- **Size**: Typically 3-8MB per photo
- **Dimensions**: Usually 4000x3000px or similar

### Thumbnails

- **Format**: JPG/JPEG only
- **Width**: 300-400px (height auto-scaled)
- **Quality**: 85-90% compression
- **Size**: 50-150KB per thumbnail
- **Naming**: Must match high-res filename exactly

## 🛠️ Thumbnail Generation

### Using GIMP (Our Process)

1. Open GIMP
2. Go to File → Batch Process
3. Configure the batch process:
   - **Input folder**: Select your high-res photos directory (e.g., `Z:\Prologue CX 2026\high-res`)
   - **Output folder**: Create and select thumbnails directory (e.g., `Z:\Prologue CX 2026\thumbnails`)
   - **File type**: JPEG
   - **Quality**: 85
   - **Resize**: Check "Resize"
   - **Width**: 400px (height will auto-scale)
4. Click "Start" to process all photos
5. Verify thumbnails were created with matching filenames

## 📋 Metadata Generation

### Update the PowerShell Script

Edit `generate-metadata.ps1` with your new paths:

```powershell
# Update these paths for 2026
$highResPath = "Z:\Prologue CX 2026\high-res"
$thumbnailPath = "Z:\Prologue CX 2026\thumbnails"
$outputJsonPath = "Z:\Prologue CX 2026\photos.json"
```

### Run the Script

```powershell
# Run from the project root directory
.\generate-metadata.ps1
```

The script will:

- Verify both directories exist
- Match high-res photos with thumbnails
- Generate sequential photo IDs
- Create the `photos.json` metadata file
- Provide upload instructions

## 🌐 Website Updates

### Update photos.html

1. **Update page title and meta tags:**

```html
<title>Event Photos | Prologue Cross Cyclocross Race 2026 | Photo Gallery</title>
<meta
  name="description"
  content="Browse and download professional photos from Prologue Cross 2026..."
/>
```

2. **Update page header:**

```html
<h1><span class="ace-icon">♠</span>2026 Event Photos</h1>
```

3. **Update JavaScript basePath:**

```javascript
this.basePath = '/photos/event-2026/';
```

### Update Countdown Dates

Update race date references in:

- `index.html` (countdown timer)
- `js/main.js` (countdown target date)
- `tech-guide.html` (if applicable)

## 📤 Upload Process

### 1. Prepare Files

Ensure you have:

- All high-res photos in `photos/event-2026/high-res/`
- All thumbnails in `photos/event-2026/thumbnails/`
- `photos.json` metadata file in `photos/event-2026/`

### 2. Upload to Web Server

Upload the entire `photos/event-2026/` directory to your web server's `/photos/` directory.

### 3. Verify Upload

- Check that all files uploaded successfully
- Test the gallery at `https://www.prologuecross.ca/photos.html`
- Verify thumbnails load correctly
- Test high-res downloads

## 🔧 Troubleshooting

### Common Issues

**Photos not loading:**

- Check file paths in `photos.json`
- Verify all files uploaded to correct directories
- Check file permissions on web server

**Thumbnails missing:**

- Ensure thumbnail filenames exactly match high-res filenames
- Check thumbnail generation completed successfully
- Verify thumbnails are JPG format

**Gallery not updating:**

- Clear browser cache
- Check browser console for JavaScript errors
- Verify `photos.json` is valid JSON format

**Slow loading:**

- Optimize thumbnail sizes (aim for <100KB each)
- Consider CDN for photo delivery
- Implement progressive loading if needed

### Performance Optimization

**For Large Photo Sets (500+ photos):**

- Consider implementing pagination
- Use WebP format for thumbnails (with JPG fallback)
- Implement lazy loading for better performance
- Consider photo compression for high-res versions

## 📊 Analytics & Monitoring

### Track Photo Usage

Monitor these metrics:

- Page views on photos.html
- Photo download counts
- User engagement time on gallery
- Mobile vs desktop usage

### Google Analytics Events

The gallery includes tracking for:

- Photo views
- Downloads
- Gallery interactions

## 🔒 Security Considerations

### File Access

- Photos are publicly accessible (no authentication required)
- Consider watermarking if needed
- Monitor for hotlinking/bandwidth abuse

### Privacy

- AI face recognition runs client-side only
- No photos are sent to external servers
- Consider GDPR implications for EU participants

## 📅 Annual Checklist

### Pre-Event

- [ ] Set up new event directory structure
- [ ] Test photo upload process
- [ ] Verify gallery functionality
- [ ] Update website with new year

### Post-Event

- [ ] Receive photos from photographers
- [ ] Generate thumbnails
- [ ] Create metadata file
- [ ] Upload to web server
- [ ] Test gallery functionality
- [ ] Announce to participants
- [ ] Monitor usage and feedback

### End of Season

- [ ] Archive old photo sets
- [ ] Update documentation
- [ ] Plan improvements for next year
- [ ] Backup photo collections

## 💡 Tips for Success

### Photography

- Work with experienced event photographers
- Establish clear delivery timeline (1-2 weeks post-event)
- Request both RAW and processed JPG files
- Ensure consistent naming convention

### Organization

- Sort photos by time/event if possible
- Remove duplicates and poor quality shots
- Consider creating themed collections (start, finish, podium, etc.)

### User Experience

- Test gallery on mobile devices
- Provide clear download instructions
- Consider creating a "best of" collection
- Share gallery link widely through social media

## 📞 Support

For technical issues with the photo system:

1. Check this documentation first
2. Review browser console for errors
3. Verify all files uploaded correctly
4. Test with a small subset of photos first

## 🔄 Version History

- **2026**: Initial implementation with infinite scroll and lightbox
- **2026**: Enhanced with AI face recognition (coming soon)
- **Future**: Consider WebP support, advanced search, social sharing

---

_Last updated: December 2024_
_For next year's event, update all year references from 2026 to 2027_
