import { useState } from 'react'
import toast from 'react-hot-toast'

export const useFileUpload = (maxSizeMB = 10) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const validateFile = (file) => {
    const maxSize = maxSizeMB * 1024 * 1024
    
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return false
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported')
      return false
    }

    return true
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      clearFile()
      return
    }

    if (!validateFile(selectedFile)) {
      return
    }

    setFile(selectedFile)

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
  }

  const uploadFile = async (uploadFn) => {
    if (!file) return null

    setUploading(true)
    setProgress(0)

    try {
      const result = await uploadFn(file, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        setProgress(percentCompleted)
      })
      
      clearFile()
      return result
    } catch (error) {
      toast.error('Failed to upload file')
      throw error
    } finally {
      setUploading(false)
    }
  }

  return {
    file,
    preview,
    uploading,
    progress,
    handleFileSelect,
    clearFile,
    uploadFile
  }
}