export let API_URL = "https://project-meet.vercel.app";
export let CLIENT_URL = "https://project-meet.vercel.app";

if (process.env.NODE_ENV === "development") {
  API_URL = "http://localhost:8080";
  CLIENT_URL = "http://localhost:5173";
}
