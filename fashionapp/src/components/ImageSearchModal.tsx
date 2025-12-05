import { useState } from 'react';
import { Modal, Upload, Spin, Button, message } from 'antd';
import { CameraOutlined, InboxOutlined, CloseOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import ProductCard from './ProductCard';
import type { Product } from '../types/product';
import { productService } from '../services/productService';

interface ImageSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImageSearchModal({ open, onClose }: ImageSearchModalProps) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleUpload: UploadProps['beforeUpload'] = (file) => {
    // Validate file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Only image files can be uploaded!');
      return Upload.LIST_IGNORE;
    }

    // Validate file size (max 5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadedFile(file);
    setResults([]); // Clear previous results

    return false; // Prevent auto upload
  };

  const handleSearch = async () => {
    if (!uploadedFile) {
      message.warning('Please select an image first!');
      return;
    }

    setLoading(true);
    try {
      const products = await productService.searchByImage(uploadedFile);
      setResults(products);

      if (products.length === 0) {
        message.info('No similar products found');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      message.error(error.message || 'Search failed. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setUploadedFile(null);
    setResults([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      title={
        <div className="flex items-center gap-2">
          <CameraOutlined className="text-xl" />
          <span className="text-lg font-semibold">Search by Image</span>
        </div>
      }
      destroyOnClose
    >
      <div className="py-4">
        {/* Upload Area */}
        {!previewUrl ? (
          <Upload.Dragger
            beforeUpload={handleUpload}
            showUploadList={false}
            accept="image/*"
            className="border-2 border-dashed hover:border-blue-400 transition-colors"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-6xl text-blue-500" />
            </p>
            <p className="ant-upload-text text-lg font-medium">
              Click or drag and drop image here
            </p>
            <p className="ant-upload-hint text-gray-500">
              Supported: JPG, PNG, WEBP (max 5MB)
            </p>
          </Upload.Dragger>
        ) : (
          <div className="space-y-4">
            {/* Preview Image */}
            <div className="relative bg-gray-50 rounded-lg p-4 flex justify-center items-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 rounded-lg shadow-md object-contain"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <CloseOutlined className="text-gray-600" />
              </button>
            </div>

            {/* Search Button */}
            {!loading && results.length === 0 && (
              <div className="flex justify-center gap-3">
                <Button type="primary" size="large" onClick={handleSearch} icon={<CameraOutlined />}>
                  Search similar products
                </Button>
                <Button size="large" onClick={handleReset}>
                  Choose another image
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-600 text-lg">Searching for similar products...</p>
            <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Found {results.length} similar products
              </h3>
              <Button onClick={handleReset}>Search again</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2">
              {results.map(product => (
                <div key={product.product_id} onClick={handleClose}>
                  <ProductCard product={product} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {!previewUrl && !loading && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Tips for best results:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Choose clear, non-blurry images</li>
              <li>Product should occupy most of the image</li>
              <li>Simple background will give more accurate results</li>
              <li>Avoid images with too many products</li>
            </ul>
          </div>
        )}
      </div>
    </Modal >
  );
}
