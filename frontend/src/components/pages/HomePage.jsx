import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    const isAuthenticated = async () => {
      try {
        const reponse = await axios.get(
          "http://localhost:3000/is-authenticated"
        );
        if (!reponse.data.isAuthenticated) navigate("/login");
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

  const handleSync = async () => {
    try {
      const response = await axios.get("http://localhost:3000/sync-customers");
      alert(response.data.message);
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
          <CardTitle>Sync Customers</CardTitle>
          <CardDescription>
            Migrate the customers data from the Legacy Database to Salesforce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Button className="w-full md:w-[200px]" onClick={handleSync}>
              <RefreshCw />
              Sync
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
