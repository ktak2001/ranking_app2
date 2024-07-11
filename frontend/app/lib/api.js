import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers:{
        "Content-Type": "application/json"
      }
});

export async function getYoutuberInfo(youtuberId) {
  const response = await axiosInstance.post(`/getYoutuberInfo`, { youtuberId });
  return response.data;
}

export async function getSupporterInfo(supporterId) {
  const response = await axiosInstance.post(`/getSupporterInfo`, { supporterId });
  return response.data;
}

export async function getSupportersRanking(year, month, youtuberId, showYear) {
  const response = await axiosInstance.post(`/getSupportersRanking`, { year, month, youtuberId, showYear });
  return response.data;
}

export async function getYoutubersRanking(year, month, showYear) {
  const response = await axiosInstance.post(`/getYoutubersRanking`, { year, month, showYear });
  return response.data;
}

export async function getSupportingYoutubers(year, month, supporterId) {
  const response = await axiosInstance.post(`/getSupportingYoutubers`, { year, month, supporterId });
  return response.data;
}