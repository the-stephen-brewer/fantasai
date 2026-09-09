import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import {
  EmojiEvents as AwardsIcon,
  Dashboard as BoardIcon,
  Person as IdentityIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

interface BottomNavBarProps {
  userId?: string | null;
  currentView: "awards" | "datatable" | "profile";
  onViewChange: (newView: "awards" | "datatable") => void;
}

export default function BottomNavBar({
  userId,
  currentView,
  onViewChange,
}: BottomNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveValue = () => {
    if (location.pathname.includes("/profile")) {
      return "profile";
    }
    return currentView;
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    if (newValue === "awards" || newValue === "datatable") {
      onViewChange(newValue);
    } else if (newValue === "profile") {
      navigate(`/profile?userId=${userId}`);
    }
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200, // High z-index to be on top
        display: { xs: "block", md: "none" }, // Only show on mobile
        bgcolor: "rgba(10, 14, 25, 0.8)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid",
        borderColor: "rgba(0, 210, 255, 0.2)",
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getActiveValue()}
        onChange={handleChange}
        sx={{ bgcolor: "transparent" }}
      >
        <BottomNavigationAction
          label="Awards"
          value="awards"
          icon={<AwardsIcon />}
          sx={{ color: getActiveValue() === 'awards' ? 'primary.main' : 'grey.500' }}
        />
        <BottomNavigationAction
          label="Draft Board"
          value="datatable"
          icon={<BoardIcon />}
          sx={{ color: getActiveValue() === 'datatable' ? 'primary.main' : 'grey.500' }}
        />
        <BottomNavigationAction
          label="My Identity"
          value="profile"
          icon={<IdentityIcon />}
          sx={{ color: getActiveValue() === 'profile' ? 'primary.main' : 'grey.500' }}
        />
      </BottomNavigation>
    </Paper>
  );
}
