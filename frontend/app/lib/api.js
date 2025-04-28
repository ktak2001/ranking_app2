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
  const payload = {
    year : String(year),                  /* ← 変更 */
    month: String(month).padStart(2, '0'),/* ← 変更 */
    youtuberId,
    showYear
  };
  const response = await axiosInstance.post('/getSupportersRanking', payload);
  return response.data;
}

export async function getAllSupportersRanking(year, month, showYear) {
  const payload = {
    year : String(year),                  /* ← 変更 */
    month: String(month).padStart(2, '0'),/* ← 変更 */
    showYear
  };
  const response = await axiosInstance.post('/getAllSupportersRanking', payload);
  return response.data;
}


export async function getYoutubersRanking(year, month, showYear) {
  const payload = {
    year : String(year),                  /* ← 変更 */
    month: String(month).padStart(2, '0'),/* ← 変更 */
    showYear
  };
  const response = await axiosInstance.post('/getYoutubersRanking', payload);
  return response.data;
}


export async function getSupportingYoutubers(year, month, supporterId, showYear) {
  const payload = {
    year : String(year),                  /* ← 変更 */
    month: String(month).padStart(2, '0'),/* ← 変更 */
    supporterId,
    showYear
  };
  const response = await axiosInstance.post('/getSupportingYoutubers', payload);
  return response.data;
}
