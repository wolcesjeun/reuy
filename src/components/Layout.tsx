import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
  Divider,
} from "@mui/material";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { ReactNode, useState, useEffect } from "react";
import {
  AccountCircle,
  Menu as MenuIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import Link from "next/link";

const DRAWER_WIDTH = 300;

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queries, setQueries] = useState<any[]>([]);

  useEffect(() => {
    loadQueries();

    // Sorgu listesini güncellemek için event listener
    const handleQueriesUpdate = () => {
      loadQueries();
    };

    window.addEventListener("queriesUpdated", handleQueriesUpdate);

    return () => {
      window.removeEventListener("queriesUpdated", handleQueriesUpdate);
    };
  }, []);

  const loadQueries = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("queries")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setQueries(data || []);
    } catch (error) {
      console.error("Sorgular yüklenirken hata:", error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    router.push("/profile");
  };

  const handleSignOut = async () => {
    try {
      handleMenuClose();
      await supabase.auth.signOut();
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      localStorage.clear();
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Oturum kapatma hatası:", error);
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    try {
      const { error } = await supabase
        .from("queries")
        .delete()
        .eq("id", queryId);

      if (error) throw error;

      // Eğer silinen sorgu şu an görüntüleniyorsa, ana sayfaya dön ve temizle
      const currentQueryId = router.query.id;
      if (currentQueryId === queryId) {
        window.dispatchEvent(new Event("clearQuery"));
        router.push("/dashboard");
      }

      await loadQueries();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const handleQueryClick = (query: any) => {
    router.push({
      pathname: "/dashboard",
      query: { id: query.id },
    });
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("clearQuery"));
    router.push("/dashboard");
  };

  const drawer = (
    <Box sx={{ overflow: "auto" }}>
      <Typography
        variant="h6"
        sx={{
          p: 3,
          color: "primary.main",
          fontWeight: 500,
          fontSize: "1.1rem",
        }}
      >
        Geçmiş Analizler
      </Typography>
      <Divider sx={{ opacity: 0.6 }} />
      <List sx={{ px: 2 }}>
        {queries.map((query) => (
          <ListItem
            key={query.id}
            sx={{
              mb: 1,
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: "action.hover",
                cursor: "pointer",
                transform: "translateX(4px)",
              },
            }}
            onClick={() => handleQueryClick(query)}
          >
            <ListItemText
              primary={query.analysis_result.split("\n")[0]}
              secondary={new Date(query.created_at).toLocaleDateString("tr-TR")}
              sx={{
                "& .MuiListItemText-primary": {
                  color: "text.primary",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  mb: 0.5,
                },
                "& .MuiListItemText-secondary": {
                  color: "text.secondary",
                  fontSize: "0.85rem",
                },
              }}
            />
            <ListItemSecondaryAction>
              <MuiIconButton
                edge="end"
                aria-label="sil"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteQuery(query.id);
                }}
                sx={{
                  color: "error.main",
                  opacity: 0.7,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    opacity: 1,
                    color: "error.dark",
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </MuiIconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Link
              href="/dashboard"
              onClick={handleLogoClick}
              style={{ textDecoration: "none" }}
            >
              <Typography
                variant="h6"
                component="div"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                ReUy
              </Typography>
            </Link>
          </Box>
          <IconButton
            size="large"
            aria-label="kullanıcı menüsü"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
            sx={{
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1,
                minWidth: "200px",
                borderRadius: 2,
                "& .MuiList-root": {
                  py: 1,
                },
              },
            }}
          >
            <MenuItem
              onClick={handleProfile}
              sx={{
                py: 1.5,
                px: 2.5,
                borderRadius: 1,
                mx: 1,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccountCircle sx={{ mr: 2, fontSize: 20 }} />
                <Typography>Profil</Typography>
              </Box>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={handleSignOut}
              disabled={isLoading}
              sx={{
                py: 1.5,
                px: 2.5,
                borderRadius: 1,
                mx: 1,
                color: "error.main",
                "&:hover": {
                  color: "error.dark",
                  bgcolor: "error.lighter",
                },
              }}
            >
              {isLoading ? "Çıkış Yapılıyor..." : "Çıkış Yap"}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              bgcolor: "background.default",
              boxShadow: "none",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              bgcolor: "background.default",
              boxShadow: "none",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 7, sm: 8 },
          bgcolor: "background.default",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
