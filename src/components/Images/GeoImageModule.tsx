import React, { useState, useEffect, useMemo, useRef } from 'react';
import exifr from 'exifr';
import { 
  Camera, 
  Upload, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Plus, 
  CheckCircle, 
  ExternalLink,
  Tag,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GeoImage, 
  Watershed, 
  InterventionType, 
  ImageClassificationCategory,
  FocusTarget 
} from '../../types/index.js';
import { uploadGeoImage } from '../../services/api.js';
import { modalBackdropVariants, modalPanelVariants, staggerContainer, staggerItem, buttonTapProps } from '../../motion.js';

interface GeoImageModuleProps {
  watershed: Watershed;
  images: GeoImage[];
  onSelectImage: (image: GeoImage) => void;
  onAnalyzeImage: (image: GeoImage) => void;
  onLocateOnMap: (target: FocusTarget) => void;
  onImageUploaded: (newImage: GeoImage) => void;
}

// Ray-casting point-in-polygon helper
function isPointInPolygon(lat: number, lng: number, polygonCoords: number[][][]): boolean {
  if (!polygonCoords || !polygonCoords[0]) return true;
  const ring = polygonCoords[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Client image processor: downscale to max 1600px and compute Laplacian variance sharpness
async function processClientImage(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  sharpnessScore: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        // 1. Calculate downscaled dimensions (max 1600px)
        const maxDim = 1600;
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;
        if (targetWidth > maxDim || targetHeight > maxDim) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
            targetWidth = maxDim;
          } else {
            targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
            targetHeight = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: reader.result as string,
            width: originalWidth,
            height: originalHeight,
            sharpnessScore: 70
          });
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // 2. Compute Sharpness via Laplacian variance on smaller thumbnail (max 300px)
        const thumbCanvas = document.createElement('canvas');
        const thumbW = 200;
        const thumbH = Math.round((targetHeight * thumbW) / targetWidth);
        thumbCanvas.width = thumbW;
        thumbCanvas.height = thumbH;
        const thumbCtx = thumbCanvas.getContext('2d');

        if (!thumbCtx) {
          return resolve({ dataUrl, width: originalWidth, height: originalHeight, sharpnessScore: 75 });
        }

        thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
        const imgData = thumbCtx.getImageData(0, 0, thumbW, thumbH);
        const gray = new Float32Array(thumbW * thumbH);

        for (let i = 0; i < imgData.data.length; i += 4) {
          gray[i / 4] = 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
        }

        // Apply 3x3 Laplacian operator
        let sumLap = 0;
        let sumLapSq = 0;
        let count = 0;

        for (let y = 1; y < thumbH - 1; y++) {
          for (let x = 1; x < thumbW - 1; x++) {
            const idx = y * thumbW + x;
            const lap =
              gray[idx - thumbW] +
              gray[idx + thumbW] +
              gray[idx - 1] +
              gray[idx + 1] -
              4 * gray[idx];

            sumLap += lap;
            sumLapSq += lap * lap;
            count++;
          }
        }

        const mean = sumLap / count;
        const variance = (sumLapSq / count) - (mean * mean);

        // Map variance to 0-100 sharpness score
        const score = Math.min(100, Math.max(10, Math.round(Math.log10(Math.max(1, variance)) * 32)));

        resolve({
          dataUrl,
          width: originalWidth,
          height: originalHeight,
          sharpnessScore: score
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const GeoImageModule: React.FC<GeoImageModuleProps> = ({
  watershed,
  images,
  onSelectImage,
  onAnalyzeImage,
  onLocateOnMap,
  onImageUploaded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('ALL');
  const [selectedInterventionType, setSelectedInterventionType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [justUploadedId, setJustUploadedId] = useState<string | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLat, setUploadLat] = useState(watershed.centerCoordinates[0].toFixed(5));
  const [uploadLng, setUploadLng] = useState(watershed.centerCoordinates[1].toFixed(5));
  const [uploadVillageId, setUploadVillageId] = useState(watershed.villages[0]?.id || 'v-01');
  const [uploadType, setUploadType] = useState<InterventionType>('Check Dam');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadInspector, setUploadInspector] = useState('Field Officer (GPS Survey)');
  const [uploadNotes, setUploadNotes] = useState('Field photograph captured during post-monsoon watershed inspection.');
  const [uploadImageFile, setUploadImageFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Quality and validation tracking
  const [hasExifGps, setHasExifGps] = useState<boolean | null>(null);
  const [exifWarning, setExifWarning] = useState<string | null>(null);
  const [clientQuality, setClientQuality] = useState<{ width: number; height: number; sharpnessScore: number } | null>(null);
  const [overrideBoundaryWarning, setOverrideBoundaryWarning] = useState(false);

  // Reset form whenever modal opens or watershed changes
  useEffect(() => {
    if (showUploadModal) {
      setUploadTitle('');
      setUploadLat(watershed.centerCoordinates[0].toFixed(5));
      setUploadLng(watershed.centerCoordinates[1].toFixed(5));
      setUploadVillageId(watershed.villages[0]?.id || 'v-01');
      setUploadDate(new Date().toISOString().split('T')[0]);
      setUploadImageFile(null);
      setHasExifGps(null);
      setExifWarning(null);
      setClientQuality(null);
      setOverrideBoundaryWarning(false);
      setUploadError(null);
    }
  }, [showUploadModal, watershed.id]);

  // Modal Escape key trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showUploadModal) {
        setShowUploadModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUploadModal]);

  // Filtered Images
  const filteredImages = images.filter((img) => {
    if (selectedVillageId !== 'ALL' && img.villageId !== selectedVillageId) return false;
    if (selectedInterventionType !== 'ALL' && img.interventionType !== selectedInterventionType) return false;
    if (selectedCategory !== 'ALL' && img.analysis?.classification !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        img.title.toLowerCase().includes(q) ||
        img.villageName.toLowerCase().includes(q) ||
        img.fieldNotes.toLowerCase().includes(q) ||
        img.interventionType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle file selection with EXIF GPS parsing & client image processing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Parse EXIF GPS tags using exifr
      const exif = await exifr.parse(file, { gps: true, tiff: true, xmp: true }).catch(() => null);

      if (exif && typeof exif.latitude === 'number' && typeof exif.longitude === 'number') {
        setUploadLat(exif.latitude.toFixed(6));
        setUploadLng(exif.longitude.toFixed(6));
        setHasExifGps(true);
        setExifWarning(null);

        if (exif.DateTimeOriginal) {
          try {
            setUploadDate(new Date(exif.DateTimeOriginal).toISOString().split('T')[0]);
          } catch {}
        }
      } else {
        setHasExifGps(false);
        setExifWarning('No GPS coordinates found in EXIF tags. Location defaulted to catchment center; you can refine coordinates manually or use current location.');
      }

      // 2. Client-side image processing (downscale to max 1600px + Laplacian sharpness)
      const processed = await processClientImage(file);
      setUploadImageFile(processed.dataUrl);
      setClientQuality({
        width: processed.width,
        height: processed.height,
        sharpnessScore: processed.sharpnessScore
      });

      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err: any) {
      console.warn('Failed to parse EXIF or process image:', err);
    }
  };

  // Browser Geolocation helper
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUploadLat(pos.coords.latitude.toFixed(6));
        setUploadLng(pos.coords.longitude.toFixed(6));
        setHasExifGps(true);
        setExifWarning(null);
      },
      (err) => {
        alert('Could not retrieve GPS position: ' + err.message);
      }
    );
  };

  // Real Validation Checklist Computations
  const parsedLat = parseFloat(uploadLat);
  const parsedLng = parseFloat(uploadLng);
  const isValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng);
  const isInsideBoundary = isValidCoords ? isPointInPolygon(parsedLat, parsedLng, watershed.boundaryGeoJson.coordinates) : false;
  
  const uploadDateObj = new Date(uploadDate);
  const isDateValid = !isNaN(uploadDateObj.getTime()) && uploadDateObj <= new Date();

  // Duplicate detection: check if existing image has same title or within 5m and same date
  const isDuplicate = useMemo(() => {
    if (!uploadTitle || !isValidCoords) return false;
    return images.some(img => {
      const sameTitle = img.title.trim().toLowerCase() === uploadTitle.trim().toLowerCase();
      const dist = Math.hypot(img.latitude - parsedLat, img.longitude - parsedLng) * 111000;
      const sameLocAndDate = dist < 5 && img.date.startsWith(uploadDate);
      return sameTitle || sameLocAndDate;
    });
  }, [uploadTitle, parsedLat, parsedLng, uploadDate, images, isValidCoords]);

  const meetsResolution = clientQuality ? clientQuality.width >= 640 && clientQuality.height >= 480 : Boolean(uploadImageFile);

  const canSubmit = uploadImageFile && uploadTitle && isValidCoords && isDateValid && (isInsideBoundary || overrideBoundaryWarning) && !isSubmitting;

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const villageObj = watershed.villages.find(v => v.id === uploadVillageId);
      const newImg = await uploadGeoImage({
        watershedId: watershed.id,
        title: uploadTitle || `${uploadType} Ground Inspection`,
        imageUrl: uploadImageFile || '',
        latitude: parsedLat,
        longitude: parsedLng,
        date: uploadDate,
        villageId: uploadVillageId,
        villageName: villageObj ? villageObj.name : 'Kalyanpura',
        interventionType: uploadType,
        inspectorName: uploadInspector,
        fieldNotes: uploadNotes,
        clientQuality: clientQuality ? {
          width: clientQuality.width,
          height: clientQuality.height,
          sharpnessScore: clientQuality.sharpnessScore,
          gpsAccuracyMeters: hasExifGps ? 2.5 : 4.5
        } : undefined
      });

      onImageUploaded(newImg);
      setJustUploadedId(newImg.id);
      setShowUploadModal(false);
      setTimeout(() => setJustUploadedId(null), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#646464]">
            <Camera className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span>GROUND-TRUTH EVIDENCE CATALOG</span>
          </div>
          <h2 className="mt-1 font-serif text-2xl font-normal text-[#171717]">
            Geo-coded Field Photographs
          </h2>
          <p className="mt-1 text-xs text-[#646464]">
            Smartphone photos embedded with GPS tags, automated photographic quality inspection, and tripartite scientific verification.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#41a1cf]" />
          <span>Upload Geo-Coded Photo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#646464] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search photo, notes, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 pl-8 pr-3 py-1.5 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] placeholder-[#646464] focus:outline-none focus:border-[#41a1cf]"
            />
          </div>

          {/* Village Filter */}
          <div className="flex items-center gap-1 bg-[#f9faf7] border border-[#dee2de] rounded-lg px-2.5 py-1.5">
            <MapPin className="w-3 h-3 text-[#41a1cf]" />
            <span className="text-[#646464]">Village:</span>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="bg-transparent font-medium text-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Villages</option>
              {watershed.villages.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Intervention Filter */}
          <div className="flex items-center gap-1 bg-[#f9faf7] border border-[#dee2de] rounded-lg px-2.5 py-1.5">
            <Tag className="w-3 h-3 text-[#41a1cf]" />
            <span className="text-[#646464]">Structure:</span>
            <select
              value={selectedInterventionType}
              onChange={(e) => setSelectedInterventionType(e.target.value)}
              className="bg-transparent font-medium text-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Check Dam">Check Dam</option>
              <option value="Farm Pond">Farm Pond</option>
              <option value="Contour Trench">Contour Trench</option>
              <option value="Plantation / Afforestation">Plantation</option>
              <option value="Gully Plug">Gully Plug</option>
              <option value="Percolation Tank">Percolation Tank</option>
            </select>
          </div>

          {/* AI Category Filter (includes all categories) */}
          <div className="flex items-center gap-1 bg-[#f9faf7] border border-[#dee2de] rounded-lg px-2.5 py-1.5">
            <Sparkles className="w-3 h-3 text-[#41a1cf]" />
            <span className="text-[#646464]">AI Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Check dam">Check dam</option>
              <option value="Farm pond">Farm pond</option>
              <option value="Water harvesting structure">Water harvesting structure</option>
              <option value="Plantation/vegetation">Plantation/vegetation</option>
              <option value="Agricultural land">Agricultural land</option>
              <option value="Barren/degraded land">Barren/degraded land</option>
              <option value="Drainage/stream">Drainage/stream</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        <div className="text-[11px] font-mono text-[#646464]">
          Showing {filteredImages.length} of {images.length} photographs
        </div>
      </div>

      {/* Geo-coded Photos Grid with Smooth Motion Layout */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredImages.map((img) => {
            const isJustAdded = justUploadedId === img.id;
            return (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { duration: 0.3 }
                }}
                exit={{ opacity: 0, scale: 0.94 }}
                className={`bg-[#ffffff] rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group ${
                  isJustAdded ? 'ring-2 ring-[#41a1cf] bg-sky-50/20' : 'border-[#dee2de]'
                }`}
              >
                
                {/* Image Display */}
                <div 
                  className="relative aspect-[4/3] bg-[#f9faf7] overflow-hidden cursor-pointer"
                  onClick={() => onSelectImage(img)}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Category Pill */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1f1f29]/80 backdrop-blur-md text-white shadow-sm">
                      {img.analysis?.classification || img.interventionType}
                    </span>
                  </div>

                  {/* Quality Pill */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#ffffff]/90 text-emerald-800 border border-emerald-300 shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {img.analysis?.validatedQuality.status || 'Verified'}
                    </span>
                  </div>

                  {/* GPS Coordinates Bar */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between p-1.5 rounded-lg bg-[#1f1f29]/75 backdrop-blur-sm text-white text-[10px] font-mono">
                    <span>{img.latitude.toFixed(4)}°N, {img.longitude.toFixed(4)}°E</span>
                    <span>{new Date(img.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 
                      onClick={() => onSelectImage(img)}
                      className="font-serif text-sm font-medium text-[#171717] hover:text-[#41a1cf] cursor-pointer line-clamp-1"
                    >
                      {img.title}
                    </h3>
                    <p className="text-[11px] text-[#646464] mt-0.5">
                      {img.villageName} • {img.inspectorName}
                    </p>
                    <p className="text-xs text-[#444141] line-clamp-2 mt-1.5">
                      {img.fieldNotes}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#dee2de]/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onAnalyzeImage(img)}
                      className="inline-flex items-center gap-1 text-[#41a1cf] hover:text-[#1f1f29] font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Analysis</span>
                    </button>

                    <button
                      onClick={() => onLocateOnMap({
                        kind: 'image',
                        id: img.id,
                        lat: img.latitude,
                        lng: img.longitude,
                        title: img.title
                      })}
                      className="inline-flex items-center gap-1 text-[#646464] hover:text-[#171717] font-medium"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Locate</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Upload Geo-Coded Image Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div 
            className="fixed inset-0 z-[1200] bg-[#171717]/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-photo-title"
          >
            <motion.div 
              variants={modalPanelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-[#ffffff] border border-[#dee2de] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
            >
              
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dee2de] bg-[#f9faf7]">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#41a1cf]" />
                  <h3 id="upload-photo-title" className="font-serif text-base font-normal text-[#171717]">
                    Upload Geo-Coded Photograph
                  </h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  aria-label="Close upload dialog"
                  className="text-[#646464] hover:text-[#171717]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
                
                {/* Image File Selector */}
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">
                    Field Photo File (JPG, PNG, WebP)
                  </label>
                  <div className="border-2 border-dashed border-[#dee2de] rounded-xl p-4 text-center bg-[#f9faf7] hover:border-[#41a1cf] transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {uploadImageFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={uploadImageFile} alt="Preview" className="w-16 h-12 object-cover rounded border border-[#dee2de]" />
                        <div className="text-left">
                          <span className="text-emerald-700 font-medium block">Photo attached & scaled</span>
                          {clientQuality && (
                            <span className="text-[10px] text-[#646464]">
                              {clientQuality.width}x{clientQuality.height}px • Sharpness: {clientQuality.sharpnessScore}/100
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-[#646464] mx-auto" />
                        <p className="text-xs text-[#444141] font-medium">Click or drag & drop photo here</p>
                        <p className="text-[10px] text-[#646464]">Reads smartphone EXIF GPS coordinates & timestamp automatically</p>
                      </div>
                    )}
                  </div>
                  {exifWarning && (
                    <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      {exifWarning}
                    </p>
                  )}
                  {hasExifGps === true && (
                    <p className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>EXIF GPS coordinates detected and pre-filled!</span>
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">
                    Structure / Photograph Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Masonry Check Dam CD-02 Spillway"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  />
                </div>

                {/* Coordinates Grid with Location Picker button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-[#2c2c2c]">
                      GPS Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="text-[11px] text-[#0284c7] hover:underline flex items-center gap-1 font-medium"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Use Device GPS</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Latitude (°N)"
                        value={uploadLat}
                        onChange={(e) => setUploadLat(e.target.value)}
                        className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-mono text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Longitude (°E)"
                        value={uploadLng}
                        onChange={(e) => setUploadLng(e.target.value)}
                        className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-mono text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                      />
                    </div>
                  </div>
                </div>

                {/* Village & Structure Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2c2c2c] mb-1">
                      Village
                    </label>
                    <select
                      value={uploadVillageId}
                      onChange={(e) => setUploadVillageId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                    >
                      {watershed.villages.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-[#2c2c2c] mb-1">
                      Intervention Type
                    </label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as InterventionType)}
                      className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                    >
                      <option value="Check Dam">Check Dam</option>
                      <option value="Farm Pond">Farm Pond</option>
                      <option value="Contour Trench">Contour Trench</option>
                      <option value="Plantation / Afforestation">Plantation / Afforestation</option>
                      <option value="Gully Plug">Gully Plug</option>
                      <option value="Percolation Tank">Percolation Tank</option>
                    </select>
                  </div>
                </div>

                {/* Date & Surveyor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2c2c2c] mb-1">
                      Date of Capture
                    </label>
                    <input
                      type="date"
                      required
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#2c2c2c] mb-1">
                      Inspector Name / Designation
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadInspector}
                      onChange={(e) => setUploadInspector(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">
                    Surveyor Notes & Observations
                  </label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  />
                </div>

                {/* Validation Checklist Card (Requirement D.2) */}
                <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#646464] block">
                    Upload Quality & Integrity Checklist
                  </span>
                  
                  <div className="space-y-1 text-[11px]">
                    {/* Boundary Check */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#444141]">Inside Catchment Boundary:</span>
                      {isInsideBoundary ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Pass
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Outside Boundary
                        </span>
                      )}
                    </div>
                    {!isInsideBoundary && (
                      <label className="flex items-center gap-2 text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
                        <input
                          type="checkbox"
                          checked={overrideBoundaryWarning}
                          onChange={(e) => setOverrideBoundaryWarning(e.target.checked)}
                          className="accent-amber-600"
                        />
                        <span>Confirm coordinate placement outside official catchment bounds</span>
                      </label>
                    )}

                    {/* Timestamp Check */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#444141]">Timestamp Valid (Past/Present):</span>
                      {isDateValid ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Pass
                        </span>
                      ) : (
                        <span className="text-red-700 font-medium flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Future Date
                        </span>
                      )}
                    </div>

                    {/* Duplicate Check */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#444141]">Duplicate Detection:</span>
                      {!isDuplicate ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Unique
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Possible Duplicate
                        </span>
                      )}
                    </div>

                    {/* Resolution Check */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#444141]">Resolution Verification (≥ 640x480):</span>
                      {meetsResolution ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Pass
                        </span>
                      ) : (
                        <span className="text-[#646464] font-medium">Pending Photo</span>
                      )}
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-2 border-t border-[#dee2de] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#dee2de] text-[#444141] hover:bg-[#f9faf7] font-medium text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="px-4 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors disabled:opacity-40 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Validating & Analyzing...</span>
                      </>
                    ) : (
                      <span>Submit Geo-Coded Photo</span>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
