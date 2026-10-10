import axios from "axios";
import { BASE_URL } from "../api/api";

const API = axios.create({
  baseURL: `${BASE_URL}/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Register
export const registerUser = (userData) => {
  return API.post("/register", userData);
};

// Login
export const loginUser = (userData) => {
  return API.post("/login", userData);
};