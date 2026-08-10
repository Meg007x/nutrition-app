import { Platform } from "react-native";

const DEV_HOST = Platform.OS === "web" ? "localhost" : "10.168.100.38";

export const BASE_URL = `http://${DEV_HOST}:3000`;
export const API_BASE_URL = `${BASE_URL}/api`;
