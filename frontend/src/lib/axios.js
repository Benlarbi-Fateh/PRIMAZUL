import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000", // adapte à ton backend
  withCredentials: true, // pour que le cookie JWT soit envoyé
});

export default instance;
