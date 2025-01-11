import { useState, useEffect } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Oturum bulunamadı");

      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setEmail(session.user.email || "");
    } catch (error: any) {
      console.error("Profil yükleme hatası:", error.message);
      setError("Profil bilgileri yüklenirken bir hata oluştu");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Oturum bulunamadı");

      const { error } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setSuccess("Profil başarıyla güncellendi");
    } catch (error: any) {
      console.error("Güncelleme hatası:", error);
      setError("Profil güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (passwords.new !== passwords.confirm) {
        throw new Error("Yeni şifreler eşleşmiyor");
      }

      if (passwords.new.length < 6) {
        throw new Error("Şifre en az 6 karakter olmalıdır");
      }

      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      setSuccess("Şifre başarıyla güncellendi");
      setPasswords({ current: "", new: "", confirm: "" });
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
          mt: 4,
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
          variant="h4"
          sx={{
            mb: 4,
            color: "primary.main",
            fontWeight: 500,
          }}
        >
          Profil Bilgileri
        </Typography>

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

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Ad"
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
            fullWidth
            label="E-posta"
            value={email}
            disabled
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "action.hover",
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
            {loading ? "Güncelleniyor..." : "Bilgileri Güncelle"}
          </Button>
        </Box>

        <Divider sx={{ my: 4, opacity: 0.6 }} />

        <Typography
          variant="h5"
          sx={{
            mb: 3,
            color: "primary.main",
            fontWeight: 500,
          }}
        >
          Şifre Değiştir
        </Typography>

        <Box component="form" onSubmit={handlePasswordChange}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Mevcut Şifre"
            type="password"
            value={passwords.current}
            onChange={(e) =>
              setPasswords({ ...passwords, current: e.target.value })
            }
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
            label="Yeni Şifre"
            type="password"
            value={passwords.new}
            onChange={(e) =>
              setPasswords({ ...passwords, new: e.target.value })
            }
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
            label="Yeni Şifre (Tekrar)"
            type="password"
            value={passwords.confirm}
            onChange={(e) =>
              setPasswords({ ...passwords, confirm: e.target.value })
            }
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
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
