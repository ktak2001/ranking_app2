import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getYoutuberInfo(youtuberId) {
  const response = await axios.post(`${API_URL}/getYoutuberInfo`, { youtuberId });
  return response.data;
}

export async function getSupporterInfo(supporterId) {
  const response = await axios.post(`${API_URL}/getSupporterInfo`, { supporterId });
  return response.data;
}

export async function getSupporterMonthRanking(year, month, youtuberId) {
  const response = await axios.post(`${API_URL}/getSupporterMonthRanking`, { year, month, youtuberId });
  return response.data;
}

export async function getYoutubersRanking(year, month) {
  const response = await axios.post(`${API_URL}/getYoutubersRanking`, { year, month });
  return response.data;
}

export async function getSupportingYoutubers(year, month, supporterId) {
  const response = await axios.post(`${API_URL}/getSupportingYoutubers`, { year, month, supporterId });
  return response.data;
}