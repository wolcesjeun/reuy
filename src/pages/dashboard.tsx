import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(true);
  const [currentQuery, setCurrentQuery] = useState<any>(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      loadQuery(id as string);
      setShowUpload(false);
    } else {
      setShowUpload(true);
      setCurrentQuery(null);
      setResult("");
    }
  }, [id]);

  useEffect(() => {
    const handleClearQuery = () => {
      setResult("");
      setError("");
      setCurrentQuery(null);
      setShowUpload(true);
    };

    window.addEventListener("clearQuery", handleClearQuery);
    return () => {
      window.removeEventListener("clearQuery", handleClearQuery);
    };
  }, []);

  const loadQuery = async (queryId: string) => {
    try {
      const { data, error } = await supabase
        .from("queries")
        .select("*")
        .eq("id", queryId)
        .single();

      if (error) throw error;

      setCurrentQuery(data);
      setResult(data.analysis_result);
    } catch (error: any) {
      setError("Sorgu yüklenirken bir hata oluştu");
    }
  };

  const handleImageUpload = async (url: string, analysisResult: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Oturum bulunamadı");

      const { data, error: insertError } = await supabase
        .from("queries")
        .insert([
          {
            user_id: session.user.id,
            image_url: url,
            analysis_result: analysisResult,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      window.dispatchEvent(new Event("queriesUpdated"));

      setResult(analysisResult);
      setError("");
      setCurrentQuery(data);
      setShowUpload(false);

      const resultsElement = document.getElementById("results");
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error: any) {
      setError("Sorgu kaydedilirken bir hata oluştu");
    }
  };

  const handleNewQuery = () => {
    setResult("");
    setError("");
    setCurrentQuery(null);
    setShowUpload(true);
    router.push("/dashboard", undefined, { shallow: true });
  };

  return (
    <Container>
      {showUpload ? (
        <>
          <Typography variant="h4" gutterBottom>
            Geri Dönüşüm Görsel Analiz
          </Typography>
          <ImageUpload onImageUpload={handleImageUpload} />
        </>
      ) : (
        currentQuery && (
          <>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h4" gutterBottom>
                Analiz Sonucu
              </Typography>
              <Button
                variant="contained"
                onClick={handleNewQuery}
                sx={{
                  bgcolor: "primary.main",
                  borderRadius: 2,
                  px: 3,
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                Yeni Sorgu
              </Button>
            </Box>
            <Box
              sx={{
                mb: 4,
                p: 2,
                borderRadius: 8,
                bgcolor: "background.paper",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                overflow: "hidden",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "300px",
                  borderRadius: 6,
                  overflow: "hidden",
                  bgcolor: "grey.50",
                  "& img": {
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  },
                }}
              >
                <img src={currentQuery.image_url} alt="Yüklenen görsel" />
              </Box>
            </Box>
          </>
        )
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Analiz Ediliyor...</Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {result && (
        <Box
          id="results"
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 6,
            bgcolor: "background.paper",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            "& h1, & h2, & h3": {
              color: "text.primary",
              mb: 2,
              fontWeight: 500,
            },
            "& p": {
              mb: 2,
              lineHeight: 1.7,
              color: "text.primary",
            },
          }}
        >
          <ReactMarkdown>{result}</ReactMarkdown>
        </Box>
      )}
    </Container>
  );
}
