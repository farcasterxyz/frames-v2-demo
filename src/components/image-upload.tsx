import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (file: File) => void
}

export default function ImageUpload({ onUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    onUpload(file)
    setPreview(URL.createObjectURL(file))
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': [], 'video/*': []} })

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-300 ${
          isDragActive ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-purple-600">Drop the files here ...</p>
        ) : (
          <p className="text-gray-500">Drag &apos;n&apos; drop some files here, or click to select files</p>
        )}
      </div>
      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="max-w-full h-auto max-h-48 object-contain mx-auto rounded-lg shadow-md" />
        </div>
      )}
    </div>
  )
}

