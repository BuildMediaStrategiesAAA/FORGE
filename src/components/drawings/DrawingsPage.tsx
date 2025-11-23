import { useState, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, X, Download, Save, Settings, Trash2 } from 'lucide-react';
import { uploadPhoto, getPhotosForJob, getPhotoUrl, deletePhoto, type Photo } from '../../services/photos.service';
import { getDimensionsForJob, upsertDimensions } from '../../services/dimensions.service';
import { getLatestModel, createModel } from '../../services/scaffold.service';
import { generateDraftModelFromDims } from '../../lib/scaffold/generator';
import { estimateLoadClass } from '../../lib/scaffold/generator';
import type { ScaffoldGraph } from '../../lib/scaffold/model';
import { Scaffold2DElevation } from './Scaffold2DElevation';
import { Scaffold3DModel } from './Scaffold3DModel';
import { takeoffFromGraph } from '../../lib/scaffold/takeoff';
import { saveTakeoff } from '../../services/materials.service';
import { supabase } from '../../lib/supabase';

interface DrawingsPageProps {
  jobId: string | null;
}

export function DrawingsPage({ jobId }: DrawingsPageProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [buildingDescription, setBuildingDescription] = useState('');
  const [dimensions, setDimensions] = useState({ height: '', width: '', length: '' });
  const [buildingType, setBuildingType] = useState('residential');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [scaffoldGraph, setScaffoldGraph] = useState<ScaffoldGraph | null>(null);

  useEffect(() => {
    if (jobId) {
      loadPhotos();
      loadDimensions();
      loadScaffoldModel();
    }
  }, [jobId]);

  async function loadScaffoldModel() {
    if (!jobId) return;
    try {
      const model = await getLatestModel(jobId);
      if (model) {
        setScaffoldGraph(model.model_json);
        setShowOutput(true);
      }
    } catch (error) {
      console.error('Failed to load scaffold model:', error);
    }
  }

  async function loadPhotos() {
    if (!jobId) return;
    try {
      const data = await getPhotosForJob(jobId);
      setPhotos(data);

      const urls: Record<string, string> = {};
      for (const photo of data) {
        urls[photo.id] = await getPhotoUrl(photo.storage_path);
      }
      setPhotoUrls(urls);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  }

  async function loadDimensions() {
    if (!jobId) return;
    try {
      const data = await getDimensionsForJob(jobId);
      if (data) {
        setDimensions({
          height: data.height_m?.toString() || '',
          width: data.length_m?.toString() || '',
          length: data.lift_m?.toString() || ''
        });
      }
    } catch (error) {
      console.error('Failed to load dimensions:', error);
    }
  }

  async function saveDimensions() {
    if (!jobId) return;
    try {
      await upsertDimensions(jobId, {
        height_m: dimensions.height ? parseFloat(dimensions.height) : null,
        length_m: dimensions.width ? parseFloat(dimensions.width) : null,
        lift_m: dimensions.length ? parseFloat(dimensions.length) : null
      });
    } catch (error) {
      console.error('Failed to save dimensions:', error);
    }
  }

  const generationSteps = [
    'Analyzing image...',
    'Calculating dimensions...',
    'Generating design...'
  ];

  const mockMaterialList = [
    { item: 'Standards (2m)', quantity: 50, unit: 'pieces' },
    { item: 'Ledgers (2.5m)', quantity: 40, unit: 'pieces' },
    { item: 'Boards', quantity: 30, unit: 'pieces' },
    { item: 'Base plates', quantity: 20, unit: 'pieces' },
    { item: 'Couplers', quantity: 120, unit: 'pieces' },
    { item: 'Guard rails', quantity: 35, unit: 'pieces' },
  ];

  const totalWeight = 2450;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jobId) return;

    try {
      setIsUploading(true);
      await uploadPhoto(jobId, file);
      await loadPhotos();

      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  async function handleDeletePhoto(photoId: string, storagePath: string) {
    if (!confirm('Delete this photo?')) return;
    try {
      await deletePhoto(photoId, storagePath);
      await loadPhotos();
      if (uploadedImage && photos.find(p => p.id === photoId)) {
        setUploadedImage(null);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo');
    }
  }

  const handleGenerate = async () => {
    if (!jobId) {
      alert('Select a job first');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationStep(1);

      const dims = await getDimensionsForJob(jobId);
      if (!dims || !dims.length_m || !dims.height_m || !dims.lift_m) {
        alert('Enter dimensions before generating');
        setIsGenerating(false);
        return;
      }

      const graph = generateDraftModelFromDims({
        length_m: dims.length_m,
        height_m: dims.height_m,
        lift_m: dims.lift_m,
        bay_length_m: 2.0
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationStep(2);

      const loadClass = estimateLoadClass(graph);
      const newModel = await createModel(jobId, graph, loadClass, supabase);

      const takeoffLines = takeoffFromGraph(graph);
      await saveTakeoff(newModel.id, takeoffLines, supabase);

      await new Promise(resolve => setTimeout(resolve, 500));

      const latestModel = await getLatestModel(jobId, supabase);
      if (latestModel) {
        setScaffoldGraph(latestModel.model_json);
      }

      setIsGenerating(false);
      setShowOutput(true);
    } catch (error) {
      console.error('Failed to generate scaffold model:', error);
      setIsGenerating(false);
      alert(`Failed to generate scaffold model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleDownload = (type: string) => {
    console.log(`Download ${type} clicked`);
  };

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Scaffold Designer</h1>
          <p className="text-[#e5e5e5]">Generate 2D/3D scaffold designs from photos or descriptions</p>
        </div>

        <div className="neumorphic-card p-8 mb-8">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'neumorphic-button text-white'
                  : 'text-[#e5e5e5] hover:text-white hover:bg-[#252525]'
              }`}
            >
              Upload Photo
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${
                activeTab === 'manual'
                  ? 'neumorphic-button text-white'
                  : 'text-[#e5e5e5] hover:text-white hover:bg-[#252525]'
              }`}
            >
              Describe Manually
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div>
              {!jobId && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-center">
                  Please select a job first to upload photos
                </div>
              )}

              <div className="border-2 border-dashed border-[#2d2d2d] rounded-lg p-12 text-center mb-6 hover:border-[#3d3d3d] transition-colors">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-[#e5e5e5]" />
                <p className="text-[#e5e5e5] mb-6">Drag photo here or click to upload</p>

                <div className="flex flex-col gap-3 max-w-md mx-auto">
                  <label className={`neumorphic-button cursor-pointer flex items-center justify-center gap-2 py-3 px-6 ${!jobId || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Camera className="w-5 h-5" />
                    <span>Take Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={!jobId || isUploading}
                    />
                  </label>

                  <label className={`neumorphic-button cursor-pointer flex items-center justify-center gap-2 py-3 px-6 ${!jobId || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <ImageIcon className="w-5 h-5" />
                    <span>Choose from Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={!jobId || isUploading}
                    />
                  </label>

                  <label className={`neumorphic-button cursor-pointer flex items-center justify-center gap-2 py-3 px-6 ${!jobId || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="w-5 h-5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload from Computer'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={!jobId || isUploading}
                    />
                  </label>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Uploaded Photos ({photos.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="neumorphic-card p-2 relative group">
                        <button
                          onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                          className="absolute top-4 right-4 neumorphic-button p-2 text-white hover:text-red-400 transition-colors z-10 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {photoUrls[photo.id] && (
                          <img
                            src={photoUrls[photo.id]}
                            alt="Site photo"
                            className="w-full h-48 object-cover rounded-lg cursor-pointer"
                            onClick={() => setUploadedImage(photoUrls[photo.id])}
                          />
                        )}
                        <p className="text-xs text-[#999] mt-2 text-center">
                          {new Date(photo.taken_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedImage && (
                <div className="neumorphic-card p-4 relative mt-4">
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-6 right-6 neumorphic-button p-2 text-white hover:text-red-400 transition-colors z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <img
                    src={uploadedImage}
                    alt="Uploaded building"
                    className="max-w-full max-h-[400px] mx-auto rounded-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Building Description</label>
                <textarea
                  value={buildingDescription}
                  onChange={(e) => setBuildingDescription(e.target.value)}
                  placeholder="Describe the building... e.g., 3-story brick office building, 40ft height, flat roof, street access on two sides"
                  className="w-full h-32 bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-4 text-white placeholder-[#666] focus:outline-none focus:border-[#3d3d3d]"
                  style={{
                    boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(40, 40, 40, 0.1)'
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Height (meters)</label>
                  <input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    onBlur={saveDimensions}
                    placeholder="0"
                    className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-3 text-white placeholder-[#666] focus:outline-none focus:border-[#3d3d3d]"
                    style={{
                      boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(40, 40, 40, 0.1)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Width (meters)</label>
                  <input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    onBlur={saveDimensions}
                    placeholder="0"
                    className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-3 text-white placeholder-[#666] focus:outline-none focus:border-[#3d3d3d]"
                    style={{
                      boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(40, 40, 40, 0.1)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Length (meters)</label>
                  <input
                    type="number"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                    onBlur={saveDimensions}
                    placeholder="0"
                    className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-3 text-white placeholder-[#666] focus:outline-none focus:border-[#3d3d3d]"
                    style={{
                      boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(40, 40, 40, 0.1)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Building Type</label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-3 text-white focus:outline-none focus:border-[#3d3d3d]"
                  style={{
                    boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(40, 40, 40, 0.1)'
                  }}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="highrise">High-rise</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="neumorphic-button px-12 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isGenerating ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: isGenerating ? undefined : 'text',
              WebkitTextFillColor: isGenerating ? undefined : 'transparent',
              backgroundClip: isGenerating ? undefined : 'text'
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate 2D/3D Scaffold Design'}
          </button>

          {isGenerating && (
            <div className="mt-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 border-4 border-[#2d2d2d] border-t-white rounded-full animate-spin"></div>
              </div>
              <p className="text-white font-semibold">{generationSteps[generationStep]}</p>
            </div>
          )}
        </div>

        {showOutput && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="neumorphic-card p-6">
                <h3 className="text-white font-bold text-lg mb-4">2D Elevation View</h3>
                <div className="bg-[#0d0d0d] rounded-lg aspect-[3/2] flex items-center justify-center border border-[#2d2d2d]">
                  {scaffoldGraph ? (
                    <Scaffold2DElevation graph={scaffoldGraph} />
                  ) : (
                    <p className="text-[#666] text-sm">Generate a design to see the elevation</p>
                  )}
                </div>
              </div>

              <div className="neumorphic-card p-6">
                <h3 className="text-white font-bold text-lg mb-4">3D Interactive Model</h3>
                <div className="bg-[#0d0d0d] rounded-lg aspect-[3/2] border border-[#2d2d2d] relative overflow-hidden">
                  {scaffoldGraph ? (
                    <Scaffold3DModel graph={scaffoldGraph} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-[#666] text-sm">Generate a design to see the 3D model</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="neumorphic-card p-6">
                <h3 className="text-white font-bold text-lg mb-4">Material List</h3>
                <div className="space-y-3">
                  {mockMaterialList.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-2 border-b border-[#2d2d2d]">
                      <div>
                        <p className="text-white font-semibold text-sm">{item.item}</p>
                        <p className="text-[#999] text-xs">{item.unit}</p>
                      </div>
                      <span className="text-white font-bold">{item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t-2 border-[#2d2d2d]">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Total Weight</span>
                      <span className="text-white font-bold">{totalWeight} kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => handleDownload('2D')}
                className="neumorphic-button flex items-center gap-2 px-6 py-3"
              >
                <Download className="w-5 h-5" />
                Download 2D Drawing
              </button>
              <button
                onClick={() => handleDownload('3D')}
                className="neumorphic-button flex items-center gap-2 px-6 py-3"
              >
                <Download className="w-5 h-5" />
                Download 3D Model
              </button>
              <button
                onClick={() => handleDownload('materials')}
                className="neumorphic-button flex items-center gap-2 px-6 py-3"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                <Save className="w-5 h-5" style={{ WebkitTextFillColor: 'white' }} />
                <span>Save to Job</span>
              </button>
              <button
                onClick={() => setShowOutput(false)}
                className="neumorphic-button flex items-center gap-2 px-6 py-3 border border-[#2d2d2d]"
              >
                <Settings className="w-5 h-5" />
                Adjust Design
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
