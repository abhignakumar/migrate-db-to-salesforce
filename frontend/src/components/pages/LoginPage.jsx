import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const isAuthenticated = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/is-authenticated"
        );
        if (response.data.isAuthenticated) navigate("/");
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log("Axios Error: ", error);
          alert(error.response.data.message || "Error");
        } else {
          console.log("Error: ", error);
          alert("Error");
        }
      }
    };
    isAuthenticated();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.get("http://localhost:3000/login");
      window.location.href = response.data.authUrl;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Axios Error: ", error);
        alert(error.response.data.message || "Error");
      } else {
        console.log("Error: ", error);
        alert("Error");
      }
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Login To Salesforce</CardTitle>
          <CardDescription>
            Click the button below to login to your Salesforce account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Button className="w-full md:w-[200px]" onClick={handleLogin}>
              <LogIn />
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
