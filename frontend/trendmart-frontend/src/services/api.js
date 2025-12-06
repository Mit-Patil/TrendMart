import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5198",
  withCredentials: true
});


export default api;
