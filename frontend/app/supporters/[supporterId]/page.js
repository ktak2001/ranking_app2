import SupporterDetailsClient from './SupporterDetailsClient.js';
import { getSupporterInfo } from '@/app/lib/api';

// Simple in-memory cache
const cache = new Map();

async function getCachedSupporterInfo(supporterId) {
  if (!cache.has(supporterId)) {
    const supporterInfo = await getSupporterInfo(supporterId);
    cache.set(supporterId, supporterInfo);
  }
  return cache.get(supporterId);
}

export async function generateMetadata({ params }) {
  const supporterInfo = await getCachedSupporterInfo(params.supporterId);
  return {
    title: supporterInfo.supporterName,
    // Add other metadata as needed
  };
}

export const dynamic = 'force-dynamic';

export default async function SupporterDetailsPage({ params }) {
  const supporterInfo = await getCachedSupporterInfo(params.supporterId);

  return <SupporterDetailsClient supporterInfo={supporterInfo} params={params} />;
}