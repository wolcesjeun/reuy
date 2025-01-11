import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabase";
import { analyzeImage } from "@/services/gemini";

interface ImageUploadProps {
  onImageUpload: (url: string, analysisResult: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      setError("");
      setUploading(true);
      const file = acceptedFiles[0];

      // Dosya boyutu kontrolü
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Dosya boyutu 5MB'dan büyük olamaz");
      }

      // Önizleme URL'i oluştur
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Dosya adını benzersiz yap
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Supabase'e yükle
      const { data, error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Public URL al
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(fileName);

      setUploadedUrl(publicUrl);
    } catch (error: any) {
      console.error("Görsel yükleme hatası:", error.message);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!uploadedUrl) return;

    try {
      setAnalyzing(true);
      setError("");

      const analysisResult = await analyzeImage(uploadedUrl);
      onImageUpload(uploadedUrl, analysisResult);
    } catch (error: any) {
      console.error("Analiz hatası:", error.message);
      setError("Görsel analiz edilirken bir hata oluştu");
    } finally {
      setAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  return (
    <Box sx={{ mb: 4 }}>
      {previewUrl && (
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <img
            src={previewUrl}
            alt="Önizleme"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.300",
          borderRadius: 2,
          p: previewUrl ? 3 : 8,
          minHeight: previewUrl ? "100px" : "300px",
          textAlign: "center",
          cursor: "pointer",
          bgcolor: isDragActive ? "action.hover" : "background.paper",
          "&:hover": {
            bgcolor: "action.hover",
          },
          mb: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Yükleniyor...</Typography>
          </Box>
        ) : (
          <Typography
            color="textSecondary"
            sx={{ fontSize: previewUrl ? "0.9rem" : "1.1rem" }}
          >
            {isDragActive
              ? "Görseli buraya bırakın"
              : previewUrl
              ? "Yeni bir görsel yüklemek için tıklayın veya sürükleyin"
              : "Görsel yüklemek için tıklayın veya sürükleyin"}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {uploadedUrl && !analyzing && (
        <Button
          variant="contained"
          onClick={handleAnalyze}
          fullWidth
          sx={{ mt: 2 }}
        >
          Analiz Et
        </Button>
      )}

      {analyzing && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>Analiz ediliyor...</Typography>
        </Box>
      )}
    </Box>
  );
}
