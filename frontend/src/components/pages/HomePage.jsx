import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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
          toast.error(error.response.data.message || "Error");
        } else {
          console.log("Error: ", error);
          toast.error("Error");
        }
      }
    };
    isAuthenticated();
  }, []);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/sync-customers");
      toast.success(response.data.message, {
        description: `Job ID: ${response.data.jobId}`,
      });
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
            <Button
              className="w-full md:w-[200px]"
              onClick={handleSync}
              disabled={isLoading}
            >
              <RefreshCw className={cn({ "animate-spin": isLoading })} />
              Sync
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
