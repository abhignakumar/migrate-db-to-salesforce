import { SquareArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader, LogOut } from "lucide-react";

export function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/is-authenticated"
        );
        if (response.data.isAuthenticated) setIsLoggedIn(true);
        else setIsLoggedIn(false);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log("Axios Error: ", error);
          toast.error(error.response.data.message || "Error");
        } else {
          console.log("Error: ", error);
          toast.error("Error");
        }
      }
    };
    isAuthenticated();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/logout");
      toast.success(response.data.message);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Axios Error: ", error);
        toast.error(error.response.data.message || "Error");
      } else {
        console.log("Error: ", error);
        toast.error("Error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav className="bg-slate-200 px-10 py-5 flex justify-between items-center border-b border-slate-300 shadow-sm">
      <Link
        to={"/"}
        className="font-bold text-gray-700 flex gap-x-2 items-center"
      >
        <SquareArrowUpRight />
        <span>Migrate DB to SF</span>
      </Link>
      {isLoggedIn && (
        <Button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-[100px] md:w-[170px]"
        >
          {isLoading ? (
            <Loader className="animate-spin" />
          ) : (
            <>
              <LogOut />
              Logout
            </>
          )}
        </Button>
      )}
    </nav>
  );
}
