import { useState } from "react";
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

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Kullanıcı kaydı
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Profil bilgilerini kaydet
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
          },
        ]);

        if (profileError) throw profileError;
        router.push("/auth/login");
      }
    } catch (error: any) {
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
          ReUy - Kayıt
        </Typography>
        <Box component="form" onSubmit={handleRegister} sx={{ width: "100%" }}>
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
            label="Ad"
            autoFocus
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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
            label="Soyad"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
            label="E-posta"
            autoComplete="email"
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
            autoComplete="new-password"
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
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </Button>
          <Link href="/auth/login" passHref>
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
              Zaten hesabınız var mı? Giriş yapın
            </Typography>
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
