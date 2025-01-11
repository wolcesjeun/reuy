import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
} from "@mui/material";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth state değişikliklerini dinle
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      console.log("Session Durumu:", session);

      if (event === "SIGNED_IN" && session) {
        console.log("Oturum açıldı, yönlendirme başlıyor...");
        window.location.href = "/dashboard";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Login işlemi başlıyor...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        console.log("Login başarılı, session:", data.session);

        // Session'ı localStorage'a kaydet
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(data.session)
        );
        console.log("Session localStorage'a kaydedildi");

        // Cookie'ye session bilgisini ekle
        document.cookie = `supabase-auth-token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax`;
        console.log("Session cookie'ye kaydedildi");

        // Session'ı tekrar kontrol et
        const { data: sessionCheck } = await supabase.auth.getSession();
        console.log("Session kontrolü:", sessionCheck);

        if (sessionCheck.session) {
          // Sayfayı yenile ve dashboard'a yönlendir
          window.location.href = "/dashboard";
        } else {
          throw new Error("Session oluşturulamadı");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 4,
          borderRadius: 3,
          bgcolor: "background.paper",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: 4,
            color: "primary.main",
            fontWeight: 500,
          }}
        >
          ReUy - Giriş
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ width: "100%" }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            label="E-posta"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Şifre"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              borderRadius: 2,
              p: 1.5,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 500,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              },
            }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
          <Link href="/auth/register" passHref>
            <Typography
              variant="body2"
              align="center"
              sx={{
                cursor: "pointer",
                color: "primary.main",
                textDecoration: "none",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  color: "primary.dark",
                  textDecoration: "underline",
                },
              }}
            >
              Hesabınız yok mu? Kayıt olun
            </Typography>
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
